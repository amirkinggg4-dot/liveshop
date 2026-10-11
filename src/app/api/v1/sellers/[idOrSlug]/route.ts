import { db } from "@/lib/db";
import { errors, handle, ok } from "@/lib/server/http";
import { getOptionalUser } from "@/lib/server/auth";
import { showCardInclude, showCard } from "@/lib/server/shows";

/**
 * GET /api/v1/sellers/:slugOrId → storefront (spec §2: GET /sellers/:slug).
 * Looks up by slug first, then by id. Public; when a Bearer token is
 * attached, `isFollowing` is included.
 */
export const GET = handle(
  async (req: Request, { params }: { params: Promise<{ idOrSlug: string }> }) => {
    const { idOrSlug } = await params;

    const seller = await db.sellerProfile.findUnique({
      where: { slug: idOrSlug },
      include: { _count: { select: { followers: true } } },
    }) ?? (idOrSlug.length > 0
      ? await db.sellerProfile.findUnique({
          where: { id: idOrSlug },
          include: { _count: { select: { followers: true } } },
        })
      : null);
    if (!seller) throw errors.notFound("فروشنده پیدا نشد");

    const viewer = await getOptionalUser(req);

    const [products, shows, following] = await Promise.all([
      db.product.findMany({
        where: { sellerId: seller.id, isDraft: false },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          category: { select: { slug: true, nameFa: true } },
          variants: { orderBy: { label: "asc" } },
        },
      }),
      db.show.findMany({
        where: { sellerId: seller.id, status: { in: ["LIVE", "SCHEDULED", "ENDED"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: showCardInclude,
      }),
      viewer
        ? db.follow.findUnique({
            where: {
              followerId_sellerId: { followerId: viewer.id, sellerId: seller.id },
            },
          })
        : Promise.resolve(null),
    ]);

    return ok({
      seller: {
        id: seller.id,
        shopName: seller.shopName,
        slug: seller.slug,
        bio: seller.bio,
        avatarUrl: seller.avatarUrl,
        verified: seller.status === "APPROVED",
        ratingAvg: seller.ratingAvg,
        ratingCount: seller.ratingCount,
        followersCount: seller._count.followers,
      },
      isFollowing: following != null,
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        brand: p.brand,
        images: p.images,
        price: p.price,
        category: p.category,
        totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
        variants: p.variants.map((v) => ({
          id: v.id,
          label: v.label,
          sku: v.sku,
          stock: v.stock,
          price: v.priceOverride ?? p.price,
        })),
      })),
      shows: shows.map((s) => showCard(s)),
    });
  },
);
