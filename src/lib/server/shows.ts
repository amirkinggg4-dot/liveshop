/**
 * LiveShop API v1 — shared serializers for shows (spec §2 Discovery).
 *
 * v1.6.3:
 *  - card carries `startsAt` for SCHEDULED shows (real scheduledAt) so the UI
 *    can render the relative countdown («۲ ساعت دیگر») without mock data.
 *  - optional `followedSellerIds` → seller gains `isFollowed` (field is
 *    OMITTED entirely for anonymous requests, per contract).
 */
import type { Prisma } from "@prisma/client";

/** Prisma include used by every endpoint that returns show "cards". */
export const showCardInclude = {
  seller: {
    select: { id: true, slug: true, shopName: true, avatarUrl: true, status: true },
  },
  category: { select: { slug: true, nameFa: true } },
  items: {
    include: {
      product: { include: { variants: { select: { stock: true } } } },
    },
  },
} satisfies Prisma.ShowInclude;

export type ShowCardRow = Prisma.ShowGetPayload<{ include: typeof showCardInclude }>;

export interface ShowCardOptions {
  /** follows of the (optional) authenticated user — presence enables the field */
  followedSellerIds?: Set<string>;
}

/**
 * Card shape (spec §2): pinned item price + stock.
 * `viewers` is only meaningful for LIVE shows (peak viewers until the
 * realtime viewer counter lands in a later phase).
 */
export function showCard(show: ShowCardRow, opts?: ShowCardOptions) {
  const pinned = show.items.find((it) => it.pinned) ?? show.items[0] ?? null;
  const stock = pinned
    ? pinned.product.variants.reduce((sum, v) => sum + v.stock, 0)
    : 0;
  return {
    id: show.id,
    title: show.title,
    coverUrl: show.coverUrl,
    status: show.status,
    scheduledAt: show.scheduledAt?.toISOString() ?? null,
    startedAt: show.startedAt?.toISOString() ?? null,
    /** v1.6.3 — real start instant for SCHEDULED shows (countdown source) */
    startsAt:
      show.status === "SCHEDULED"
        ? (show.scheduledAt?.toISOString() ?? null)
        : null,
    viewers: show.status === "LIVE" ? show.peakViewers : 0,
    category: show.category,
    seller: {
      id: show.seller.id,
      slug: show.seller.slug,
      shopName: show.seller.shopName,
      avatarUrl: show.seller.avatarUrl,
      verified: show.seller.status === "APPROVED",
      // v1.6.3 — only present when the request carried a valid token
      ...(opts?.followedSellerIds
        ? { isFollowed: opts.followedSellerIds.has(show.seller.id) }
        : {}),
    },
    pinnedItem:
      pinned != null
        ? {
            showItemId: pinned.id,
            productTitle: pinned.product.title,
            image: pinned.product.images[0] ?? null,
            price: pinned.product.price,
            stock,
          }
        : null,
  };
}
