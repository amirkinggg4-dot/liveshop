/**
 * LiveShop v2.0.0 — order lifecycle (spec §4) for buyer + seller endpoints.
 *
 * State machine: EXACTLY src/lib/order-state.ts (the UI machine is the single
 * source — server aligns to it):
 *   - cancel: PAID_HELD|READY_TO_SHIP → CANCELED (canCancel), full refund
 *     ESCROW → buyer wallet (kind REFUND), stock + soldCount restored.
 *   - confirm-delivery: buyer-only, SHIPPED → RELEASED (canConfirmDelivery
 *     gates the start; the release itself is the buyer's confirmation).
 *     Money in ONE txn: ESCROW −total, SELLER_PAYABLE +(total−commission),
 *     PLATFORM_REVENUE +commission (stored order.commission — computed at
 *     purchase). Double call is an idempotent no-op — the status flip is a
 *     conditional single-winner UPDATE, so money moves at most once.
 *   - ship: seller-only; PAID_HELD → READY_TO_SHIP → SHIPPED (both steps are
 *     legal transitions of the shared machine, applied atomically).
 *
 * Every money movement is a postTransaction inside the caller's transaction;
 * every state flip is a conditional updateMany guarded by the previous check.
 */
import { db } from "@/lib/db";
import { ApiError, errors } from "./http";
import { newTxnId, postTransaction } from "./ledger";
import { canCancel } from "@/lib/order-state";
import { serializeOrder, type ApiOrder } from "./checkout";

function orderNotFound(): ApiError {
  return errors.notFound("سفارش یافت نشد");
}

function invalidTransition(message: string): ApiError {
  return new ApiError("INVALID_TRANSITION", message, 409);
}

/** فهرست سفارش‌های خریدار (فقط خودش) — کلیدصفحه‌ای روی (createdAt desc, id desc) */
export async function listBuyerOrders(
  buyerId: string,
  opts: { cursor?: string | null; limit?: number } = {},
) {
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  // take limit+1 تا «صفحهٔ بعدی وجود دارد؟» بدون رفت‌وبرگشت اضافه معلوم شود
  const orders = await db.order.findMany({
    where: { buyerId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    include: { items: true, shipment: true },
  });
  const hasMore = orders.length > limit;
  const page = hasMore ? orders.slice(0, limit) : orders;
  return {
    orders: page.map(serializeOrder),
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
  };
}

/** سفارش خریدار — فقط مال خودش؛ سفارش دیگران ۴۰۴ (نه ۴۰۳، بدون لو دادن وجود) */
export async function getBuyerOrder(buyerId: string, orderId: string): Promise<ApiOrder> {
  const order = await db.order.findFirst({
    where: { id: orderId, buyerId },
    include: { items: true, shipment: true },
  });
  if (!order) throw orderNotFound();
  return serializeOrder(order);
}

/** لغو توسط خریدار — فقط قبل از ارسال؛ بازگشت کامل پول + برگشت موجودی کالا. */
export async function cancelOrderByBuyer(buyerId: string, orderId: string): Promise<ApiOrder> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, buyerId },
      include: { items: true },
    });
    if (!order) throw orderNotFound();
    if (!canCancel(order.status)) {
      throw invalidTransition("لغو سفارش فقط قبل از ارسال ممکن است");
    }
    // single-winner flip → دوبار لغو (یا مسابقهٔ هم‌زمان) دوبار پول برنمی‌گرداند
    const flipped = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: "CANCELED" },
    });
    if (flipped.count !== 1) {
      throw invalidTransition("وضعیت سفارش همین حالا تغییر کرد؛ دوباره تلاش کنید");
    }

    const txnId = newTxnId();
    await postTransaction(tx, txnId, [
      {
        accountType: "ESCROW",
        userId: null,
        amount: -order.total,
        kind: "REFUND",
        orderId: order.id,
      },
      {
        accountType: "USER_WALLET",
        userId: buyerId,
        amount: order.total,
        kind: "REFUND",
        orderId: order.id,
      },
    ]);

    // برگشت موجودی واریانت‌ها و soldCount شو
    const variantIds = [...new Set(order.items.map((item) => item.variantId))];
    const variants = await tx.variant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, productId: true },
    });
    for (const item of order.items) {
      await tx.variant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.qty } },
      });
    }
    if (order.showId) {
      const qtyByProduct = new Map<string, number>();
      for (const item of order.items) {
        const productId = variants.find((v) => v.id === item.variantId)?.productId;
        if (!productId) continue;
        qtyByProduct.set(productId, (qtyByProduct.get(productId) ?? 0) + item.qty);
      }
      for (const [productId, qty] of qtyByProduct) {
        await tx.$executeRaw`
          UPDATE "ShowItem" SET "soldCount" = GREATEST(0, "soldCount" - ${qty})
          WHERE "showId" = ${order.showId} AND "productId" = ${productId}`;
      }
    }

    const updated = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true, shipment: true },
    });
    return serializeOrder(updated);
  });
}

export interface ConfirmDeliveryResult {
  order: ApiOrder;
  /** true = قبلاً آزاد شده بود؛ پاسخ تکراری بدون هرگونه پرداخت دوباره */
  alreadyReleased: boolean;
}

/**
 * تأیید تحویل توسط خریدار → آزادسازی امانت (SHIPPED → RELEASED).
 * یک txn دفتری: ESCROW −total ، SELLER_PAYABLE +(total−commission) ،
 * PLATFORM_REVENUE +commission. صدا زدن دوبار فقط یک بار پول جابه‌جا می‌کند.
 */
export async function confirmDeliveryByBuyer(
  buyerId: string,
  orderId: string,
): Promise<ConfirmDeliveryResult> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, buyerId },
      include: { items: true, shipment: true },
    });
    if (!order) throw orderNotFound();

    // idempotent: آزادسازی تکراری → همان سفارش، بدون پرداخت دوباره
    if (order.status === "RELEASED") {
      return { order: serializeOrder(order), alreadyReleased: true };
    }
    if (order.status !== "SHIPPED") {
      throw invalidTransition("تأیید تحویل فقط بعد از ارسال مرسوله ممکن است");
    }
    const flipped = await tx.order.updateMany({
      where: { id: order.id, status: "SHIPPED" },
      data: { status: "RELEASED" },
    });
    if (flipped.count !== 1) {
      throw invalidTransition("وضعیت سفارش همین حالا تغییر کرد؛ دوباره تلاش کنید");
    }

    await tx.shipment.updateMany({
      where: { orderId: order.id },
      data: { deliveredAt: new Date() },
    });

    const seller = await tx.sellerProfile.findUnique({
      where: { id: order.sellerId },
      select: { userId: true },
    });
    if (!seller) throw errors.internal();

    const commission = order.commission;
    const txnId = newTxnId();
    await postTransaction(tx, txnId, [
      {
        accountType: "ESCROW",
        userId: null,
        amount: -order.total,
        kind: "ESCROW_RELEASE",
        orderId: order.id,
      },
      {
        accountType: "SELLER_PAYABLE",
        userId: seller.userId,
        amount: order.total - commission,
        kind: "ESCROW_RELEASE",
        orderId: order.id,
      },
      {
        accountType: "PLATFORM_REVENUE",
        userId: null,
        amount: commission,
        kind: "COMMISSION",
        orderId: order.id,
      },
    ]);

    const updated = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true, shipment: true },
    });
    return { order: serializeOrder(updated), alreadyReleased: false };
  });
}

export interface ShipInput {
  carrier: string;
  trackingCode: string;
}

/** ارسال توسط فروشندهٔ همان سفارش — PAID_HELD→READY_TO_SHIP→SHIPPED در یک تراکنش. */
export async function shipOrderBySeller(
  userId: string,
  orderId: string,
  input: ShipInput,
): Promise<ApiOrder> {
  return db.$transaction(async (tx) => {
    const seller = await tx.sellerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!seller) {
      throw new ApiError("NOT_SELLER", "این عملیات مخصوص فروشندگان است", 403);
    }
    // فیلتر sellerId → سفارشِ فروشندهٔ دیگر ۴۰۴ است (نه ۴۰۳) — بدون لو دادن وجود
    const order = await tx.order.findFirst({
      where: { id: orderId, sellerId: seller.id },
      include: { items: true, shipment: true },
    });
    if (!order) throw orderNotFound();
    if (order.status !== "PAID_HELD" && order.status !== "READY_TO_SHIP") {
      throw invalidTransition("این سفارش در وضعیت قابل ارسال نیست");
    }
    if (order.status === "PAID_HELD") {
      const markedReady = await tx.order.updateMany({
        where: { id: order.id, status: "PAID_HELD" },
        data: { status: "READY_TO_SHIP" },
      });
      if (markedReady.count !== 1) {
        throw invalidTransition("وضعیت سفارش همین حالا تغییر کرد؛ دوباره تلاش کنید");
      }
    }
    const flipped = await tx.order.updateMany({
      where: { id: order.id, status: "READY_TO_SHIP" },
      data: { status: "SHIPPED" },
    });
    if (flipped.count !== 1) {
      throw invalidTransition("وضعیت سفارش همین حالا تغییر کرد؛ دوباره تلاش کنید");
    }

    await tx.shipment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        carrier: input.carrier,
        trackingCode: input.trackingCode,
        shippedAt: new Date(),
      },
      update: {
        carrier: input.carrier,
        trackingCode: input.trackingCode,
        shippedAt: new Date(),
      },
    });

    const updated = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true, shipment: true },
    });
    return serializeOrder(updated);
  });
}
