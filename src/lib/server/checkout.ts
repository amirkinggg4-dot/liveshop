/**
 * LiveShop v2.0.0 — checkout (spec §4, the critical path).
 *
 * POST /orders with a REQUIRED Idempotency-Key header. Everything happens in
 * ONE interactive Prisma transaction:
 *
 *   1. idempotency replay (same key + same buyer → same order, 200;
 *      same key + other buyer → 409)
 *   2. show must be LIVE; every variant must belong to a product shown in
 *      THIS show (ShowItem); address must belong to the buyer; the buyer
 *      must not purchase from their own store
 *   3. money is computed ONLY server-side: unit price from Variant/Product,
 *      shipping from config/fees SHIPPING_PRICES, commission from the
 *      seller's tier (commissionPctFor over this month's RELEASED sales) —
 *      any client-sent amounts are ignored (zod strips unknown fields)
 *   4. stock: variants sorted by id (stable lock order), conditional
 *      `UPDATE … WHERE stock >= qty` — a 0-row update throws OUT_OF_STOCK
 *      and rolls the whole transaction back
 *   5. wallet: the buyer's USER_WALLET account row is locked
 *      (SELECT … FOR UPDATE) BEFORE the balance check so two concurrent
 *      orders of one buyer can never spend the same balance twice
 *   6. ledger: buyer wallet −total → ESCROW +total (PURCHASE_HOLD)
 *   7. order (PAID_HELD, shipDeadline = now + 48h, address + item
 *      snapshots) + ShowItem.soldCount++
 *   8. after commit: publishOrderCommitted hook (no-op until v2.1)
 *
 * money is integer Toman; ledger amounts are BigInt.
 */
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError, errors } from "./http";
import {
  lockAccountForUpdate,
  newTxnId,
  postTransaction,
  sumEntries,
  ensureAccount,
} from "./ledger";
import { commissionPctFor, SHIPPING_PRICES, type ShippingPriceKey } from "@/lib/config/fees";
import { publishOrderCommitted, type OrderCommittedPayload } from "./realtime";

/** مهلت ارسال = اسکن ۲۴ ساعته + ارسال ۲۴ ساعته (fees.ts) = ۴۸ ساعت */
export const SHIP_DEADLINE_HOURS = 48;

/** روش‌های ارسال — دقیقاً کلیدهای جدول هزینهٔ fees.ts (تک منبع اعداد) */
export const SHIPPING_METHODS = [
  "tipax",
  "post",
  "peyk",
] as const satisfies readonly ShippingPriceKey[];

export type ShippingMethod = ShippingPriceKey;

export interface CreateOrderItemInput {
  variantId: string;
  qty: number;
}

export interface CreateOrderInput {
  showId: string;
  items: CreateOrderItemInput[];
  addressId: string;
  shippingMethod: ShippingMethod;
}

/** فقط برای تست: شبیه‌سازی کرش در نقطهٔ مشخص پیش از commit (rollback) */
export interface CreateOrderTestHooks {
  simulateFailureAt?: "ledger" | "order";
}

export interface ApiOrderItem {
  id: string;
  variantId: string;
  title: string;
  unitPrice: number;
  qty: number;
}

export interface ApiOrder {
  id: string;
  status: string;
  buyerId: string;
  sellerId: string;
  showId: string | null;
  itemsTotal: number;
  shippingFee: number;
  commission: number;
  total: number;
  shipDeadline: string;
  createdAt: string;
  address: Record<string, unknown>;
  items: ApiOrderItem[];
  shipment?: {
    carrier: string;
    trackingCode: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
}

export interface CreateOrderResult {
  order: ApiOrder;
  /** true = درخواست تکراری با همان کلید؛ همان سفارش قبلی برگشت (بدون خرید دوباره) */
  replayed: boolean;
}

function notLive(): ApiError {
  return new ApiError("SHOW_NOT_LIVE", "خرید فقط در حین پخش زنده ممکن است", 409);
}

function outOfStock(title: string): ApiError {
  return new ApiError(
    "OUT_OF_STOCK",
    `موجودی «${title}» به‌اندازهٔ درخواست شما نیست`,
    409,
  );
}

/** Sort by variant id — code-unit order, deterministic, deadlock-free. */
function byVariantId(
  a: { variantId: string },
  b: { variantId: string },
): number {
  return a.variantId < b.variantId ? -1 : a.variantId > b.variantId ? 1 : 0;
}

export function serializeOrder(
  order: Prisma.OrderGetPayload<{ include: { items: true; shipment: true } }>,
): ApiOrder {
  const address = (order.addressSnapshot ?? {}) as Record<string, unknown>;
  return {
    id: order.id,
    status: order.status,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    showId: order.showId,
    itemsTotal: order.itemsTotal,
    shippingFee: order.shippingFee,
    commission: order.commission,
    total: order.total,
    shipDeadline: order.shipDeadline.toISOString(),
    createdAt: order.createdAt.toISOString(),
    address,
    items: order.items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      title: item.titleSnapshot,
      unitPrice: item.unitPrice,
      qty: item.qty,
    })),
    shipment: order.shipment
      ? {
          carrier: order.shipment.carrier,
          trackingCode: order.shipment.trackingCode,
          shippedAt: order.shipment.shippedAt?.toISOString() ?? null,
          deliveredAt: order.shipment.deliveredAt?.toISOString() ?? null,
        }
      : null,
  };
}

/** کمیسیون روی کالاها (نه ارسال) طبق پلکان فروشِ ماهِ جاری فروشنده — فقط سمت سرور. */
async function computeCommission(
  tx: Prisma.TransactionClient,
  sellerId: string,
  itemsTotal: number,
  now: Date,
): Promise<number> {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const agg = await tx.order.aggregate({
    _sum: { itemsTotal: true },
    where: { sellerId, status: "RELEASED", createdAt: { gte: monthStart } },
  });
  const monthlySales = agg._sum.itemsTotal ?? 0;
  const pct = commissionPctFor(monthlySales);
  return Math.round((itemsTotal * pct) / 100);
}

export async function createOrder(
  buyerId: string,
  idempotencyKey: string,
  input: CreateOrderInput,
  testHooks: CreateOrderTestHooks = {},
): Promise<CreateOrderResult> {
  if (!idempotencyKey) {
    throw new ApiError(
      "IDEMPOTENCY_KEY_REQUIRED",
      "هدر Idempotency-Key برای ثبت سفارش الزامی است",
      400,
    );
  }
  // دفاع سرسختی مستقل از zod (لایهٔ route هم اعتبارسنجی می‌کند)
  for (const item of input.items) {
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) {
      throw errors.validation("تعداد هر کالا باید بین ۱ تا ۹۹ باشد");
    }
  }

  const includeForOrder = { items: true, shipment: true } as const;

  try {
    const result = await db.$transaction(
      async (tx) => {
        // ── 1) idempotency ──
        const existing = await tx.order.findUnique({
          where: { idempotencyKey },
          include: includeForOrder,
        });
        if (existing) {
          if (existing.buyerId !== buyerId) {
            throw new ApiError(
              "IDEMPOTENCY_KEY_CONFLICT",
              "این کلید Idempotency به سفارش حساب دیگری تعلق دارد",
              409,
            );
          }
          return { order: serializeOrder(existing), replayed: true as const, payload: null };
        }

        // ── 2) show / ownership ──
        const show = await tx.show.findUnique({
          where: { id: input.showId },
          include: {
            seller: { include: { user: { select: { id: true } } } },
          },
        });
        if (!show) throw errors.notFound("شو یافت نشد");
        if (show.status !== "LIVE") throw notLive();
        if (show.seller.user.id === buyerId) {
          throw new ApiError(
            "SELF_PURCHASE",
            "نمی‌توانید از فروشگاه خودتان خرید کنید",
            403,
          );
        }

        const address = await tx.address.findFirst({
          where: { id: input.addressId, userId: buyerId },
        });
        if (!address) throw errors.notFound("آدرس یافت نشد");

        // ── 3) server-side money ──
        const requested = [...input.items].sort(byVariantId);
        // merge duplicate variant lines (qty جمع می‌شود)
        const merged: CreateOrderItemInput[] = [];
        for (const item of requested) {
          const last = merged[merged.length - 1];
          if (last && last.variantId === item.variantId) {
            last.qty += item.qty;
          } else {
            merged.push({ ...item });
          }
        }

        const variants = await tx.variant.findMany({
          where: { id: { in: merged.map((item) => item.variantId) } },
          include: {
            product: {
              include: {
                showItems: {
                  where: { showId: show.id },
                  select: { id: true, productId: true },
                },
              },
            },
          },
        });
        const variantById = new Map(variants.map((v) => [v.id, v]));

        const lines = merged.map((item) => {
          const variant = variantById.get(item.variantId);
          if (!variant || variant.product.showItems.length === 0) {
            throw new ApiError(
              "VARIANT_NOT_IN_SHOW",
              "کالای درخواستی در این شو عرضه نشده است",
              400,
            );
          }
          // قیمت فقط از سرور — priceOverride محصول/سایز؛ هیچ مبلغی از کلاینت
          const unitPrice = variant.priceOverride ?? variant.product.price;
          return {
            variant,
            qty: item.qty,
            unitPrice,
            title: `${variant.product.title} (${variant.label})`,
            showItemId: variant.product.showItems[0]!.id,
            productId: variant.productId,
          };
        });

        const itemsTotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
        const shippingFee = SHIPPING_PRICES[input.shippingMethod];
        const total = itemsTotal + shippingFee;
        const now = new Date();
        const commission = await computeCommission(tx, show.sellerId, itemsTotal, now);

        // ── 4) stock (sorted, conditional) ──
        for (const line of lines) {
          const updated = await tx.$executeRaw`
            UPDATE "Variant" SET stock = stock - ${line.qty}
            WHERE id = ${line.variant.id} AND stock >= ${line.qty}`;
          if (updated !== 1) throw outOfStock(line.title);
        }

        // ── 5) wallet lock + balance ──
        const wallet = await ensureAccount(tx, "USER_WALLET", buyerId);
        await lockAccountForUpdate(tx, wallet.id);
        const balance = await sumEntries(tx, wallet.id);
        if (balance < BigInt(total)) {
          throw new ApiError(
            "INSUFFICIENT_FUNDS",
            "موجودی کیف پول برای این خرید کافی نیست",
            409,
          );
        }

        // ── 6) ledger: buyer −total → ESCROW +total ──
        if (testHooks.simulateFailureAt === "ledger") {
          throw new ApiError("SIMULATED_FAILURE", "شکست شبیه‌سازی‌شدهٔ تست", 500);
        }
        const txnId = newTxnId();
        await postTransaction(tx, txnId, [
          {
            accountType: "USER_WALLET",
            userId: buyerId,
            amount: -total,
            kind: "PURCHASE_HOLD",
          },
          {
            accountType: "ESCROW",
            userId: null,
            amount: total,
            kind: "PURCHASE_HOLD",
          },
        ]);

        // ── 7) order + items + soldCount ──
        if (testHooks.simulateFailureAt === "order") {
          throw new ApiError("SIMULATED_FAILURE", "شکست شبیه‌سازی‌شدهٔ تست", 500);
        }
        const order = await tx.order.create({
          data: {
            idempotencyKey,
            buyerId,
            sellerId: show.sellerId,
            showId: show.id,
            status: "PAID_HELD",
            itemsTotal,
            shippingFee,
            commission,
            total,
            addressSnapshot: {
              receiver: address.receiver,
              phone: address.phone,
              province: address.province,
              city: address.city,
              addressLine: address.addressLine,
              postalCode: address.postalCode,
            },
            shipDeadline: new Date(now.getTime() + SHIP_DEADLINE_HOURS * 3_600_000),
            items: {
              create: lines.map((line) => ({
                variantId: line.variant.id,
                titleSnapshot: line.title,
                unitPrice: line.unitPrice,
                qty: line.qty,
              })),
            },
          },
          include: includeForOrder,
        });

        for (const line of lines) {
          await tx.showItem.updateMany({
            where: { showId: show.id, productId: line.productId },
            data: { soldCount: { increment: line.qty } },
          });
        }

        const serialized = serializeOrder(order);
        const payload: OrderCommittedPayload = {
          showId: show.id,
          sellerId: show.sellerId,
          buyerId,
          orderId: order.id,
          purchase: lines.map((line) => ({ productTitle: line.title, qty: line.qty })),
          stock: lines.map((line) => ({ variantId: line.variant.id, stock: line.variant.stock - line.qty })),
        };
        return { order: serialized, replayed: false as const, payload };
      },
    );

    // ── 8) after commit (hook خالی تا v2.1) ──
    if (!result.replayed && result.payload) {
      await publishOrderCommitted(result.payload);
    }
    return { order: result.order, replayed: result.replayed };
  } catch (err) {
    // مسابقهٔ هم‌زمانی روی idempotencyKey: بازندهٔ create دوباره می‌خواند
    if (
      (err as Prisma.PrismaClientKnownRequestError)?.code === "P2002"
    ) {
      const existing = await db.order.findUnique({
        where: { idempotencyKey },
        include: includeForOrder,
      });
      if (existing && existing.buyerId === buyerId) {
        return { order: serializeOrder(existing), replayed: true };
      }
    }
    throw err;
  }
}
