import type { Prisma, ShowStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { errors, handle, ok } from "@/lib/server/http";
import { showCardInclude, showCard } from "@/lib/server/shows";

const STATUSES = ["LIVE", "SCHEDULED", "ENDED", "CANCELED"] as const;

/**
 * GET /api/v1/shows
 *   ?status=LIVE|SCHEDULED|ENDED|CANCELED  (comma-separated, optional)
 *   ?category=<slug>                       (optional)
 *   ?cursor=<opaque>                       (keyset pagination)
 *   ?limit=1..24                           (default 12)
 * Cards include seller, category and the pinned item price + stock (spec §2).
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

  const where: Prisma.ShowWhereInput = {};
  if (statuses && statuses.length > 0) where.status = { in: statuses };
  if (statuses === undefined) where.status = { not: "CANCELED" };

  const categorySlug = params.get("category");
  if (categorySlug) {
    const category = await db.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });
    if (!category) throw errors.notFound("دسته‌بندی پیدا نشد");
    where.categoryId = category.id;
  }

  // Keyset pagination: cursor = "<createdAtMillis>_<id>" (opaque to clients).
  const cursor = params.get("cursor");
  if (cursor) {
    const [ts, id] = cursor.split("_");
    const tsDate = new Date(Number(ts));
    if (!ts || !id || Number.isNaN(tsDate.getTime())) {
      throw errors.validation("cursor نامعتبر است");
    }
    where.OR = [{ createdAt: { lt: tsDate } }, { createdAt: tsDate, id: { lt: id } }];
  }

  const limitRaw = Number(params.get("limit") ?? 12);
  const limit = Number.isInteger(limitRaw) && limitRaw >= 1 && limitRaw <= 24 ? limitRaw : 12;

  const rows = await db.show.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: showCardInclude,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  return ok({
    shows: page.map(showCard),
    nextCursor: hasMore && last ? `${last.createdAt.getTime()}_${last.id}` : null,
  });
});
