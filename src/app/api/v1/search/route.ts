import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { errors, handle, ok } from "@/lib/server/http";
import { showCardInclude, showCard } from "@/lib/server/shows";
import { parseDiscoveryFilters } from "@/lib/server/discovery";
import { normalizeFa } from "@/lib/normalize";

/**
 * GET /api/v1/search?q=… → shows, sellers and products (spec §2).
 *
 * v1.6.3:
 *  - q AND every filter value are normalized with the SHARED normalizeFa
 *    (src/lib/normalize.ts) and matched against the normalized `searchText`
 *    columns (ILIKE, backed by pg_trgm GIN indexes) — «پوكمون»/«پوکمون» and
 *    «۹.۵»/«9.5» return the same results.
 *  - shared filters: minPrice, maxPrice, size, brand, condition=NEW|USED.
 *  - products additionally carry: showId + showTitle (the LIVE show hosting
 *    the product, else the nearest upcoming SCHEDULED one), sizes[] (in-stock
 *    variant size tokens) and condition.
 */
export const GET = handle(async (req: Request) => {
  const params = new URL(req.url).searchParams;
  const q = normalizeFa(params.get("q") ?? "");
  if (q.length < 2) {
    throw errors.validation("عبارت جست‌وجو باید دست‌کم ۲ نویسه باشد");
  }
  const like = `%${q}%`;
  const filters = parseDiscoveryFilters(params);

  const itemFilterSql = (pinnedOnlyPrice: boolean): Prisma.Sql => {
    const parts: Prisma.Sql[] = [];
    if (filters.minPrice != null) {
      parts.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "ShowItem" sif
        JOIN "Product" pf ON pf.id = sif."productId"
        WHERE sif."showId" = s.id AND ${pinnedOnlyPrice ? Prisma.sql`sif.pinned AND ` : Prisma.empty}
          pf.price >= ${filters.minPrice}
      )`);
    }
    if (filters.maxPrice != null) {
      parts.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "ShowItem" sif
        JOIN "Product" pf ON pf.id = sif."productId"
        WHERE sif."showId" = s.id AND ${pinnedOnlyPrice ? Prisma.sql`sif.pinned AND ` : Prisma.empty}
          pf.price <= ${filters.maxPrice}
      )`);
    }
    if (filters.brand) {
      parts.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "ShowItem" sif
        JOIN "Product" pf ON pf.id = sif."productId"
        WHERE sif."showId" = s.id AND pf."searchText" LIKE ${`%${filters.brand}%`}
      )`);
    }
    if (filters.size) {
      parts.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "ShowItem" sif
        JOIN "Product" pf ON pf.id = sif."productId"
        JOIN "Variant" vf ON vf."productId" = pf.id
        WHERE sif."showId" = s.id AND vf.stock > 0
          AND btrim(translate(lower(split_part(vf."label", '/', 1)),
                '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '0123456789')) = ${filters.size}
      )`);
    }
    if (filters.condition) {
      parts.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "ShowItem" sif
        JOIN "Product" pf ON pf.id = sif."productId"
        WHERE sif."showId" = s.id AND pf."condition" = ${filters.condition}::"Condition"
      )`);
    }
    return parts.length > 0
      ? Prisma.sql` AND ${Prisma.join(parts, " AND ")}`
      : Prisma.empty;
  };

  // ── shows: normalized searchText + shared item filters ──
  const shows = await db.$queryRaw(
    Prisma.sql`SELECT s.id FROM "Show" s
               WHERE s.status <> 'CANCELED'
                 AND s."searchText" ILIKE ${like}
                 ${itemFilterSql(true)}
               ORDER BY s."createdAt" DESC
               LIMIT 8`,
  ) as { id: string }[];

  const showRows = shows.length
    ? await db.show.findMany({
        where: { id: { in: shows.map((r) => r.id) } },
        include: showCardInclude,
      })
    : [];
  const showById = new Map(showRows.map((r) => [r.id, r]));
  const showCards = shows
    .map((r) => showById.get(r.id))
    .filter((r) => r != null)
    .map((r) => showCard(r!));

  // ── sellers: normalized searchText (shopName + slug) ──
  const sellers = await db.sellerProfile.findMany({
    where: { searchText: { contains: q, mode: "insensitive" } },
    take: 8,
    orderBy: { ratingCount: "desc" },
    include: { _count: { select: { followers: true } } },
  });

  // ── products: normalized searchText + filters ──
  // (size is filtered in JS after load — split_part semantics on variant
  // labels are easier and exact there; candidates are over-fetched)
  const productCandidates = await db.product.findMany({
    where: {
      isDraft: false,
      AND: [
        { searchText: { contains: q, mode: "insensitive" as const } },
        ...(filters.brand
          ? [
              {
                searchText: {
                  contains: filters.brand,
                  mode: "insensitive" as const,
                },
              },
            ]
          : []),
      ],
      ...(filters.minPrice != null || filters.maxPrice != null
        ? {
            price: {
              ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
              ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
            },
          }
        : {}),
      ...(filters.condition ? { condition: filters.condition } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 24,
    include: {
      seller: { select: { shopName: true, slug: true } },
      variants: { select: { label: true, stock: true } },
    },
  });

  const sizeMatches = (label: string): boolean =>
    filters.size != null &&
    normalizeFa(label.split("/")[0] ?? "") === filters.size;

  const sized = filters.size
    ? productCandidates.filter((p) =>
        p.variants.some((v) => v.stock > 0 && sizeMatches(v.label)),
      )
    : productCandidates;

  const products = sized.slice(0, 8);

  // ── hosting show per product: LIVE first, else nearest upcoming SCHEDULED ──
  const hostShowItems = products.length
    ? await db.showItem.findMany({
        where: {
          productId: { in: products.map((p) => p.id) },
          show: { status: { in: ["LIVE", "SCHEDULED"] } },
        },
        include: {
          show: {
            select: { id: true, title: true, status: true, scheduledAt: true },
          },
        },
      })
    : [];

  const now = Date.now();
  type HostPick = { id: string; title: string };
  const picks = new Map<
    string,
    { live?: HostPick; nearest?: HostPick & { at: number } }
  >();
  for (const it of hostShowItems) {
    const entry = picks.get(it.productId) ?? {};
    if (it.show.status === "LIVE") {
      entry.live = { id: it.show.id, title: it.show.title };
    } else {
      const at = it.show.scheduledAt?.getTime() ?? -1;
      if (at >= now && (entry.nearest == null || at < entry.nearest.at)) {
        entry.nearest = { id: it.show.id, title: it.show.title, at };
      }
    }
    picks.set(it.productId, entry);
  }
  const hostByProduct = new Map<string, HostPick>();
  for (const [pid, e] of picks) {
    const host = e.live ?? (e.nearest ? { id: e.nearest.id, title: e.nearest.title } : null);
    if (host) hostByProduct.set(pid, host);
  }

  return ok({
    query: q,
    shows: showCards,
    sellers: sellers.map((s) => ({
      id: s.id,
      shopName: s.shopName,
      slug: s.slug,
      avatarUrl: s.avatarUrl,
      verified: s.status === "APPROVED",
      followersCount: s._count.followers,
      // v1.6.3 — so the sellers tab can render the rating row like mock
      ratingAvg: s.ratingAvg,
      ratingCount: s.ratingCount,
    })),
    products: products.map((p) => {
      const host = hostByProduct.get(p.id) ?? null;
      const sizes = [
        ...new Set(
          p.variants
            .filter((v) => v.stock > 0)
            .map((v) => v.label.split("/")[0]!.trim())
            .filter((s) => s.length > 0),
        ),
      ];
      return {
        id: p.id,
        title: p.title,
        brand: p.brand,
        image: p.images[0] ?? null,
        price: p.price,
        seller: p.seller,
        totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
        // v1.6.3 — «در لایوی فلان» deep-link + filterable facets
        showId: host?.id ?? null,
        showTitle: host?.title ?? null,
        sizes,
        condition: p.condition as "NEW" | "USED",
      };
    }),
  });
});
