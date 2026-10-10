import { db } from "@/lib/db";
import { errors, handle, ok } from "@/lib/server/http";

/**
 * GET /api/v1/shows/:id → show + seller + category + items with product,
 * variants (stock + effective price) and the pinned item (spec §2).
 */
export const GET = handle(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const show = await db.show.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            slug: true,
            shopName: true,
            avatarUrl: true,
            bio: true,
            status: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
        category: { select: { slug: true, nameFa: true } },
        items: {
          orderBy: { position: "asc" },
          include: {
            product: {
              include: {
                category: { select: { slug: true, nameFa: true } },
                variants: { orderBy: { label: "asc" } },
              },
            },
          },
        },
      },
    });
    if (!show) throw errors.notFound("شو پیدا نشد");

    const pinnedItem = show.items.find((it) => it.pinned) ?? null;

    return ok({
      show: {
        id: show.id,
        title: show.title,
        coverUrl: show.coverUrl,
        status: show.status,
        scheduledAt: show.scheduledAt?.toISOString() ?? null,
        startedAt: show.startedAt?.toISOString() ?? null,
        endedAt: show.endedAt?.toISOString() ?? null,
        viewers: show.status === "LIVE" ? show.peakViewers : 0,
        category: show.category,
        seller: {
          id: show.seller.id,
          slug: show.seller.slug,
          shopName: show.seller.shopName,
          avatarUrl: show.seller.avatarUrl,
          bio: show.seller.bio,
          verified: show.seller.status === "APPROVED",
          ratingAvg: show.seller.ratingAvg,
          ratingCount: show.seller.ratingCount,
        },
        pinnedItemId: pinnedItem?.id ?? null,
        items: show.items.map((it) => ({
          id: it.id,
          position: it.position,
          pinned: it.pinned,
          soldCount: it.soldCount,
          product: {
            id: it.product.id,
            title: it.product.title,
            description: it.product.description,
            brand: it.product.brand,
            images: it.product.images,
            price: it.product.price,
            category: it.product.category,
            totalStock: it.product.variants.reduce((sum, v) => sum + v.stock, 0),
            variants: it.product.variants.map((v) => ({
              id: v.id,
              label: v.label,
              sku: v.sku,
              stock: v.stock,
              price: v.priceOverride ?? it.product.price,
            })),
          },
        })),
      },
    });
  },
);
