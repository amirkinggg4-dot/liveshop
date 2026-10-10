import { db } from "@/lib/db";
import { errors, handle, ok } from "@/lib/server/http";
import { showCardInclude, showCard } from "@/lib/server/shows";

/**
 * GET /api/v1/search?q=… → shows, sellers and products (spec §2).
 * Case-insensitive substring match; min 2 characters.
 */
export const GET = handle(async (req: Request) => {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    throw errors.validation("عبارت جست‌وجو باید دست‌کم ۲ نویسه باشد");
  }

  const [shows, sellers, products] = await Promise.all([
    db.show.findMany({
      where: {
        status: { not: "CANCELED" },
        title: { contains: q, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: showCardInclude,
    }),
    db.sellerProfile.findMany({
      where: {
        OR: [
          { shopName: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
      include: { _count: { select: { followers: true } } },
    }),
    db.product.findMany({
      where: {
        isDraft: false,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        seller: { select: { shopName: true, slug: true } },
        variants: { select: { stock: true } },
      },
    }),
  ]);

  return ok({
    query: q,
    shows: shows.map(showCard),
    sellers: sellers.map((s) => ({
      id: s.id,
      shopName: s.shopName,
      slug: s.slug,
      avatarUrl: s.avatarUrl,
      verified: s.status === "APPROVED",
      followersCount: s._count.followers,
    })),
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      brand: p.brand,
      image: p.images[0] ?? null,
      price: p.price,
      seller: p.seller,
      totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    })),
  });
});
