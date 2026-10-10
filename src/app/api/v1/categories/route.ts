import { db } from "@/lib/db";
import { handle, ok } from "@/lib/server/http";

/**
 * GET /api/v1/categories → categories with live-show counts (spec §2).
 * Sorted by live show count (desc), then Persian name.
 */
export const GET = handle(async () => {
  const [categories, liveCounts] = await Promise.all([
    db.category.findMany({
      include: { _count: { select: { shows: true, products: true } } },
      orderBy: { nameFa: "asc" },
    }),
    db.show.groupBy({
      by: ["categoryId"],
      where: { status: "LIVE" },
      _count: { _all: true },
    }),
  ]);
  const liveMap = new Map(liveCounts.map((c) => [c.categoryId, c._count._all]));

  return ok({
    categories: categories
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        nameFa: c.nameFa,
        liveShowCount: liveMap.get(c.id) ?? 0,
        showCount: c._count.shows,
        productCount: c._count.products,
      }))
      .sort(
        (a, b) =>
          b.liveShowCount - a.liveShowCount ||
          a.nameFa.localeCompare(b.nameFa, "fa"),
      ),
  });
});
