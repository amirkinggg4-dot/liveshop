import type { ShowStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { errors, handle, ok } from "@/lib/server/http";
import { getOptionalUser } from "@/lib/server/auth";
import { showCard } from "@/lib/server/shows";
import {
  SHOW_SORTS,
  fetchShowIdPage,
  loadShowRowsInOrder,
  parseDiscoveryFilters,
} from "@/lib/server/discovery";

const STATUSES = ["LIVE", "SCHEDULED", "ENDED", "CANCELED"] as const;

/**
 * GET /api/v1/shows
 *   ?status=LIVE|SCHEDULED|ENDED|CANCELED  (comma-separated, optional)
 *   ?category=<slug>                       (optional)
 *   ?sort=popular|newest|price_asc|price_desc   (v1.6.3, optional)
 *   ?minPrice=&maxPrice=&size=&brand=&condition=NEW|USED  (v1.6.3, optional)
 *   ?cursor=<opaque>                       (keyset pagination)
 *   ?limit=1..24                           (default 12)
 *
 * Cards include seller, category and the pinned item price + stock (spec §2).
 * v1.6.3: SCHEDULED cards carry `startsAt` (real scheduledAt); when the
 * request carries a valid Bearer token, seller gains `isFollowed` (the field
 * is absent for anonymous requests).
 */
export const GET = handle(async (req: Request) => {
  const params = new URL(req.url).searchParams;

  const statusParam = params.get("status");
  let statuses: ShowStatus[] | undefined;
  if (statusParam) {
    statuses = statusParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s): s is (typeof STATUSES)[number] =>
        (STATUSES as readonly string[]).includes(s),
      );
    if (statuses.length === 0) throw errors.validation("وضعیت نامعتبر است؛ مقادیر مجاز: LIVE, SCHEDULED, ENDED, CANCELED");
  }

  const sortParam = params.get("sort");
  if (sortParam != null && sortParam !== "" &&
      !(SHOW_SORTS as string[]).includes(sortParam)) {
    throw errors.validation(
      "مرتب‌سازی نامعتبر است؛ مقادیر مجاز: popular, newest, price_asc, price_desc",
    );
  }

  let categoryId: string | null = null;
  const categorySlug = params.get("category");
  if (categorySlug) {
    const category = await db.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });
    if (!category) throw errors.notFound("دسته‌بندی پیدا نشد");
    categoryId = category.id;
  }

  const limitRaw = Number(params.get("limit") ?? 12);
  const limit = Number.isInteger(limitRaw) && limitRaw >= 1 && limitRaw <= 24 ? limitRaw : 12;

  const filters = parseDiscoveryFilters(params);
  const cursor = params.get("cursor") ?? undefined;

  const page = await fetchShowIdPage({
    statuses,
    categoryId,
    sort: sortParam ?? undefined,
    filters,
    cursor,
    limit,
  });

  const rows = await loadShowRowsInOrder(page.ids);

  // v1.6.3 — optional auth: isFollowed only for a valid token
  const user = await getOptionalUser(req);
  let followedSellerIds: Set<string> | undefined;
  if (user) {
    const follows = await db.follow.findMany({
      where: { followerId: user.id, sellerId: { in: rows.map((r) => r.seller.id) } },
      select: { sellerId: true },
    });
    followedSellerIds = new Set(follows.map((f) => f.sellerId));
  }

  return ok({
    shows: rows.map((row) => showCard(row, { followedSellerIds })),
    nextCursor: page.nextCursor,
  });
});
