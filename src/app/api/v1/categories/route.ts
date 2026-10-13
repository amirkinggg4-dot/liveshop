import { db } from "@/lib/db";
import { handle, ok } from "@/lib/server/http";

/**
 * GET /api/v1/categories → top-level categories with live-show counts
 * (spec §2) plus their subcategory tree (v2.0.3): children = {slug, nameFa}.
 * Only parentId=null rows are returned as categories — subcategory rows are
 * exposed through children, so existing consumers (explore tiles etc.) see
 * the same 10 categories as before, with no behavior change.
 */
export const GET = handle(async () => {
  const [categories, liveCounts] = await Promise.all([
    db.category.findMany({
      where: { parentId: null },
      include: {
        _count: { select: { shows: true, products: true } },
        children: {
          orderBy: { nameFa: "asc" },
          select: { slug: true, nameFa: true },
        },
      },
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
        // v2.0.3 — زیرمجموعه‌ها (نام + slug) از درخت همان دسته
        children: c.children,
      }))
      .sort(
        (a, b) =>
          b.liveShowCount - a.liveShowCount ||
          a.nameFa.localeCompare(b.nameFa, "fa"),
      ),
  });
});
