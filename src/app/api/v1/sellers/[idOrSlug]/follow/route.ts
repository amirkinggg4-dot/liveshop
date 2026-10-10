import { db } from "@/lib/db";
import { ApiError, errors, handle, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";

/**
 * POST /api/v1/sellers/:id/follow   (spec §2, requires auth)
 * DELETE /api/v1/sellers/:id/follow
 * :id is the SellerProfile id (a slug is accepted too, for convenience).
 * Returns the current follow state + followers count.
 */
export const POST = handle(
  async (req: Request, { params }: { params: Promise<{ idOrSlug: string }> }) => {
    const { idOrSlug } = await params;
    const user = await requireUser(req);

    const seller = await db.sellerProfile.findUnique({
      where: { id: idOrSlug },
      select: { id: true, userId: true },
    }) ?? (idOrSlug.length > 0
      ? await db.sellerProfile.findUnique({
          where: { slug: idOrSlug },
          select: { id: true, userId: true },
        })
      : null);
    if (!seller) throw errors.notFound("فروشنده پیدا نشد");
    if (seller.userId === user.id) {
      throw new ApiError("CANNOT_FOLLOW_SELF", "نمی‌توانید فروشگاه خودتان را دنبال کنید", 400);
    }

    await db.follow.upsert({
      where: { followerId_sellerId: { followerId: user.id, sellerId: seller.id } },
      create: { followerId: user.id, sellerId: seller.id },
      update: {},
    });

    return ok({
      following: true,
      followersCount: await db.follow.count({ where: { sellerId: seller.id } }),
    });
  },
);

export const DELETE = handle(
  async (req: Request, { params }: { params: Promise<{ idOrSlug: string }> }) => {
    const { idOrSlug } = await params;
    const user = await requireUser(req);

    const seller = await db.sellerProfile.findUnique({
      where: { id: idOrSlug },
      select: { id: true },
    }) ?? (idOrSlug.length > 0
      ? await db.sellerProfile.findUnique({
          where: { slug: idOrSlug },
          select: { id: true },
        })
      : null);
    if (!seller) throw errors.notFound("فروشنده پیدا نشد");

    await db.follow.deleteMany({
      where: { followerId: user.id, sellerId: seller.id },
    });

    return ok({
      following: false,
      followersCount: await db.follow.count({ where: { sellerId: seller.id } }),
    });
  },
);
