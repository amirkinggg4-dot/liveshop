/**
 * LiveShop v2.0.0 — realtime publishing hook (PLACEHOLDER).
 *
 * spec §4 step 7: after an order commits, `stock_changed` + `purchase` should
 * be published to the show channel and the seller notified. The WebSocket
 * layer does NOT exist yet (this phase is REST-only); this hook is the single
 * seam where that publishing will be wired in v2.1 — callers already invoke
 * it after every commit, so no checkout call-site will change.
 */
export interface OrderCommittedPayload {
  showId: string;
  sellerId: string;
  buyerId: string;
  orderId: string;
  /** برای رویداد purchase — عنوان نمایشی محصول */
  purchase: { productTitle: string; qty: number }[];
  /** برای رویداد stock_changed — موجودی پس از خرید */
  stock: { variantId: string; stock: number }[];
}

/**
 * TODO(v2.1): publish to the `show:{id}` WebSocket channel + notify seller.
 * v2.0.0: intentionally a no-op (REST فقط).
 */
export async function publishOrderCommitted(
  _payload: OrderCommittedPayload,
): Promise<void> {
  /* hook خالی — WebSocket هنوز وصل نیست */
}
