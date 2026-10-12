/**
 * LiveShop v2.0.0 — checkout / wallet / ledger tests on REAL PostgreSQL
 * (dedicated liveshop_test schema — scripts/test-server.sh).
 *
 * Every test the phase requires:
 *   ✓ 50 concurrent buyers on stock-5 → exactly 5 succeed, 45 OUT_OF_STOCK,
 *     final stock 0 (and the conditional UPDATE can never go negative)
 *   ✓ one buyer, 10 concurrent orders, wallet for exactly 3 → exactly 3
 *     succeed, balance never negative (SELECT … FOR UPDATE)
 *   ✓ Idempotency-Key replay (sequential + 10 concurrent) → one order, one
 *     deduction; same key for another user → 409
 *   ✓ simulated failure at ledger (f) / order (g) → full rollback
 *   ✓ every txnId sums to 0; whole ledger sums to 0
 *   ✓ UPDATE/DELETE on LedgerEntry rejected by the DB trigger
 *   ✓ confirm-delivery twice → exactly one payment
 *   ✓ user B cannot see / cancel / confirm user A's order
 *   ✓ fake client-side price is ignored
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@/lib/db";
import { createOrder } from "@/lib/server/checkout";
import {
  cancelOrderByBuyer,
  confirmDeliveryByBuyer,
  getBuyerOrder,
  listBuyerOrders,
  shipOrderBySeller,
} from "@/lib/server/orders";
import { newTxnId, postTransaction } from "@/lib/server/ledger";
import { devTopup, getWalletView } from "@/lib/server/wallet";
import { grabEnv } from "./helpers";
import {
  accountBalanceByType,
  catchApi,
  fundWallet,
  ledgerEntryCount,
  makeOrderInput,
  sellerPayableOf,
  seedOrderingFixture,
  SHIPPING_FEE,
  totalLedgerSum,
  unbalancedTxnIds,
  variantStock,
  walletOf,
  type OrderingFixture,
} from "./ordering-helpers";

const IDEM = "test-idem-key-1";

/**
 * این فایل به PostgreSQL واقعی نیاز دارد (scripts/test-server.sh).
 * اگر دیتابیس در دسترس نیست، تست‌ها skip می‌شوند تا `bun test src/lib`
 * گمراه‌کننده نشود — همان قرارداد بقیهٔ تست‌های سرور.
 */
async function pgReachable(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
// فقط روی اسکیمای تست (test-server.sh) اجرا شو — هرگز روی دیتابیس dev
const isTestSchema = !!process.env.DATABASE_URL?.includes("schema=liveshop_test");
const pgUp = isTestSchema && (await pgReachable());
const t = pgUp ? test : test.skip;
if (!pgUp) {
  console.warn(
    "[checkout.test] اجرا فقط با scripts/test-server.sh (schema=liveshop_test) — در این محیط skip شد",
  );
}

describe("v2.0.0 checkout — happy path + snapshots", () => {
  let fx: OrderingFixture;
  beforeAll(async () => {
    if (!pgUp) return; // بدون دیتابیس، hook هم بی‌اثر
    fx = await seedOrderingFixture({ variantStock: 5 });
    await fundWallet(fx.buyer.id, 10_000_000);
  });

  t("creates PAID_HELD order with server-only money + escrow hold", async () => {
    const before = {
      wallet: await walletOf(fx.buyer.id),
      escrow: await accountBalanceByType("ESCROW"),
      stock: await variantStock(fx.variants[0]!.id),
      sold: (await db.showItem.findUniqueOrThrow({ where: { id: fx.showItem.id } })).soldCount,
    };

    const { order, replayed } = await createOrder(fx.buyer.id, IDEM, makeOrderInput(fx));
    expect(replayed).toBe(false);
    expect(order.status).toBe("PAID_HELD");
    expect(order.itemsTotal).toBe(fx.unitPrice);
    expect(order.shippingFee).toBe(SHIPPING_FEE);
    expect(order.total).toBe(fx.unitPrice + SHIPPING_FEE);
    // فروشندهٔ تازه = فروش ماهانهٔ ۰ = پلکان ۸٪ (fees.ts)
    expect(order.commission).toBe(Math.round((fx.unitPrice * 8) / 100));

    // shipDeadline = حالا + ۴۸ ساعت (با تلورانس ۱ دقیقه)
    const deltaHours = (new Date(order.shipDeadline).getTime() - Date.now()) / 3_600_000;
    expect(deltaHours).toBeGreaterThan(47.95);
    expect(deltaHours).toBeLessThan(48.05);

    // کسر موجودی و کیف پول + شارژ امانت
    expect(await variantStock(fx.variants[0]!.id)).toBe(before.stock - 1);
    expect(await walletOf(fx.buyer.id)).toBe(before.wallet - order.total);
    expect(await accountBalanceByType("ESCROW")).toBe(before.escrow + order.total);

    // soldCount و snapshotها
    const item = (await db.showItem.findUniqueOrThrow({ where: { id: fx.showItem.id } }));
    expect(item.soldCount).toBe(before.sold + 1);
    expect(order.address.receiver).toBe("خریدار تست");
    expect(order.address.postalCode).toBe("1111111111");
    expect(order.items[0]!.unitPrice).toBe(fx.unitPrice);
    expect(order.items[0]!.qty).toBe(1);
    expect(order.items[0]!.title).toContain("کتانی تست");

    // replay همان کلید → همان سفارش، بدون خرید دوباره
    const replay = await createOrder(fx.buyer.id, IDEM, makeOrderInput(fx));
    expect(replay.replayed).toBe(true);
    expect(replay.order.id).toBe(order.id);
    expect(await walletOf(fx.buyer.id)).toBe(before.wallet - order.total); // یک کسر
  });
});

describe("v2.0.0 checkout — validation errors", () => {
  let fx: OrderingFixture;
  beforeAll(async () => {
    if (!pgUp) return; // بدون دیتابیس، hook هم بی‌اثر
    fx = await seedOrderingFixture();
    await fundWallet(fx.buyer.id, 10_000_000);
  });

  t("missing Idempotency-Key → 400", async () => {
    const e = await catchApi(createOrder(fx.buyer.id, "", makeOrderInput(fx)));
    expect(e.code).toBe("IDEMPOTENCY_KEY_REQUIRED");
    expect(e.status).toBe(400);
  });

  t("show not LIVE → 409 SHOW_NOT_LIVE", async () => {
    // وضعیت همین شو موقتاً SCHEDULED می‌شود (بدون truncate — fixture مشترک نجات می‌ماند)
    await db.show.update({ where: { id: fx.show.id }, data: { status: "SCHEDULED" } });
    const e = await catchApi(createOrder(fx.buyer.id, "key-sched", makeOrderInput(fx)));
    expect(e.code).toBe("SHOW_NOT_LIVE");
    expect(e.status).toBe(409);
    await db.show.update({ where: { id: fx.show.id }, data: { status: "LIVE" } });
  });

  t("variant not in this show → 400 VARIANT_NOT_IN_SHOW", async () => {
    // محصول دوم به این شو تعلق ندارد
    const product2 = await db.product.create({
      data: {
        sellerId: fx.seller.id,
        categoryId: fx.category.id,
        title: "محصول بیرون از شو",
        price: 500_000,
        isDraft: false,
        images: [],
        variants: { create: { label: "یک‌سایز", stock: 10 } },
      },
      include: { variants: true },
    });
    const input = makeOrderInput(fx);
    input.items = [{ variantId: product2.variants[0]!.id, qty: 1 }];
    const e = await catchApi(createOrder(fx.buyer.id, "key-outside", input));
    expect(e.code).toBe("VARIANT_NOT_IN_SHOW");
    expect(e.status).toBe(400);
  });

  t("someone else's address → 404", async () => {
    const input = makeOrderInput(fx, { addressId: fx.otherAddress.id } as never);
    const e = await catchApi(createOrder(fx.buyer.id, "key-addr", input));
    expect(e.code).toBe("NOT_FOUND");
  });

  t("buyer = shop owner → 403 SELF_PURCHASE", async () => {
    const e = await catchApi(
      createOrder(fx.sellerUser.id, "key-self", {
        ...makeOrderInput(fx),
        addressId: (await db.address.findFirstOrThrow({ where: { userId: fx.sellerUser.id } })
          .catch(() => null))?.id ?? (await db.address.create({
          data: {
            userId: fx.sellerUser.id,
            receiver: "فروشنده",
            phone: "09120000000",
            province: "تهران",
            city: "تهران",
            addressLine: "maghazeh",
            postalCode: "3333333333",
          },
        })).id,
      }),
    );
    expect(e.code).toBe("SELF_PURCHASE");
    expect(e.status).toBe(403);
  });

  t("qty 0 → VALIDATION_ERROR", async () => {
    const e = await catchApi(
      createOrder(fx.buyer.id, "key-qty", makeOrderInput(fx, { qty: 0 })),
    );
    expect(e.code).toBe("VALIDATION_ERROR");
  });

  t("fake client price/total is IGNORED — server computes money", async () => {
    const input = {
      ...makeOrderInput(fx),
      // فیلدهای تقلبی کلاینت — zod حذف می‌کند و ماژول هرگز نمی‌خواند
      price: 1,
      total: 100,
      shippingFee: 1,
      commission: 0,
    } as never;
    const { order } = await createOrder(fx.buyer.id, "key-fake", input);
    expect(order.total).toBe(fx.unitPrice + SHIPPING_FEE);
    expect(order.total).not.toBe(100);
    expect(order.commission).toBe(Math.round((fx.unitPrice * 8) / 100));
  });
});

describe("v2.0.0 concurrency — 50 buyers on stock 5", () => {
  t("exactly 5 succeed, 45 OUT_OF_STOCK, final stock 0", async () => {
    const fx = await seedOrderingFixture({ variantStock: 5 });
    const variantId = fx.variants[0]!.id;

    // ۵۰ خریدار با کیف پول پر
    const buyers: { id: string; addressId: string }[] = [];
    for (let i = 0; i < 50; i++) {
      const user = await db.user.create({ data: { phone: `0915${String(i).padStart(8, "0")}` } });
      const address = await db.address.create({
        data: {
          userId: user.id, receiver: `خریدار ${i}`, phone: "09150000000",
          province: "تهران", city: "تهران", addressLine: `آدرس ${i}`, postalCode: "5555555555",
        },
      });
      await fundWallet(user.id, 50_000_000);
      buyers.push({ id: user.id, addressId: address.id });
    }

    const attempts = buyers.map((buyer, i) =>
      createOrder(buyer.id, `cc-stock-${i}`, {
        showId: fx.show.id,
        items: [{ variantId, qty: 1 }],
        addressId: buyer.addressId,
        shippingMethod: "tipax",
      }),
    );
    const results = await Promise.allSettled(attempts);

    const okOrders = results.filter((r) => r.status === "fulfilled");
    const outOfStock = results.filter(
      (r) => r.status === "rejected" && (r.reason as { code?: string }).code === "OUT_OF_STOCK",
    );
    expect(okOrders.length).toBe(5);
    expect(outOfStock.length).toBe(45);
    expect(results.every((r) => r.status === "fulfilled" || outOfStock.includes(r))).toBe(true);

    // موجودی نهایی دقیقاً ۰ — و شرط WHERE stock >= qty هرگز منفی نمی‌گذارد
    expect(await variantStock(variantId)).toBe(0);
    expect(await db.order.count()).toBe(5);
    expect(await accountBalanceByType("ESCROW")).toBe(5 * (fx.unitPrice + SHIPPING_FEE));
  }, 60_000);
});

describe("v2.0.0 concurrency — one buyer, 10 orders, wallet for 3", () => {
  t("exactly 3 succeed, 7 INSUFFICIENT_FUNDS, balance never negative", async () => {
    // نکتهٔ مهم: هر سفارش واریانت «متمایز» می‌خرد تا قفل ردیف واریانت
    // تصادفی هم‌زمانی‌ها را serialize نکند — تنها محافظ، قفل SELECT … FOR UPDATE
    // روی ردیف حساب کیف پول است.
    const fx = await seedOrderingFixture({ variantStock: 100 });
    // ۹ واریانت دیگر برای همان محصول (همه در شو)
    for (let i = 0; i < 9; i++) {
      const v = await db.variant.create({
        data: { productId: fx.product.id, label: `سایز ${i + 4}`, stock: 100 },
      });
      fx.variants.push({ id: v.id, label: v.label, stock: v.stock });
    }
    const total = fx.unitPrice + SHIPPING_FEE;
    await fundWallet(fx.buyer.id, 3 * total); // فقط برای ۳ سفارش

    const attempts = fx.variants.slice(0, 10).map((variant, i) =>
      createOrder(fx.buyer.id, `cc-wallet-${i}`, {
        showId: fx.show.id,
        items: [{ variantId: variant.id, qty: 1 }],
        addressId: fx.buyerAddress.id,
        shippingMethod: "tipax",
      }),
    );
    const results = await Promise.allSettled(attempts);

    const okOrders = results.filter((r) => r.status === "fulfilled");
    const insufficient = results.filter(
      (r) => r.status === "rejected" && (r.reason as { code?: string }).code === "INSUFFICIENT_FUNDS",
    );
    expect(okOrders.length).toBe(3);
    expect(insufficient.length).toBe(7);

    const balance = await walletOf(fx.buyer.id);
    expect(balance).toBe(0); // ۳ × total خرج شد — و هیچ‌وقت منفی نشد
    expect(balance).toBeGreaterThanOrEqual(0);
    expect(await db.order.count({ where: { buyerId: fx.buyer.id } })).toBe(3);
  }, 60_000);
});

describe("v2.0.0 idempotency — 10 concurrent requests, one key", () => {
  t("one order, one deduction, everyone gets the same order", async () => {
    const fx = await seedOrderingFixture({ variantStock: 10 });
    await fundWallet(fx.buyer.id, 50_000_000);
    const total = fx.unitPrice + SHIPPING_FEE;

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        createOrder(fx.buyer.id, "cc-idem", makeOrderInput(fx)),
      ),
    );
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);

    const orderIds = new Set(
      results.map((r) => (r as PromiseFulfilledResult<{ order: { id: string } }>).value.order.id),
    );
    expect(orderIds.size).toBe(1);
    expect(await db.order.count()).toBe(1);
    expect(await walletOf(fx.buyer.id)).toBe(50_000_000 - total); // یک کسر
    expect(await variantStock(fx.variants[0]!.id)).toBe(9); // یک کسر موجودی
  }, 60_000);

  t("same key, another user → 409 IDEMPOTENCY_KEY_CONFLICT", async () => {
    const fx = await seedOrderingFixture({ variantStock: 10 });
    await fundWallet(fx.buyer.id, 10_000_000);
    await fundWallet(fx.other.id, 10_000_000);
    await createOrder(fx.buyer.id, "shared-key", makeOrderInput(fx));
    const e = await catchApi(
      createOrder(fx.other.id, "shared-key", {
        ...makeOrderInput(fx),
        addressId: fx.otherAddress.id,
      }),
    );
    expect(e.code).toBe("IDEMPOTENCY_KEY_CONFLICT");
    expect(e.status).toBe(409);
  });
});

describe("v2.0.0 rollback — simulated crash at ledger (f) / order (g)", () => {
  t("failure at ledger step → nothing persisted", async () => {
    const fx = await seedOrderingFixture({ variantStock: 5 });
    await fundWallet(fx.buyer.id, 10_000_000);
    const before = {
      wallet: await walletOf(fx.buyer.id),
      escrow: await accountBalanceByType("ESCROW"),
      stock: await variantStock(fx.variants[0]!.id),
      entries: await ledgerEntryCount(),
    };

    const e = await catchApi(
      createOrder(fx.buyer.id, "rb-ledger", makeOrderInput(fx), { simulateFailureAt: "ledger" }),
    );
    expect(e.code).toBe("SIMULATED_FAILURE");

    expect(await db.order.count()).toBe(0);
    expect(await walletOf(fx.buyer.id)).toBe(before.wallet);
    expect(await accountBalanceByType("ESCROW")).toBe(before.escrow);
    expect(await variantStock(fx.variants[0]!.id)).toBe(before.stock);
    expect(await ledgerEntryCount()).toBe(before.entries);
  });

  t("failure at order step (after ledger) → full rollback of money + stock", async () => {
    const fx = await seedOrderingFixture({ variantStock: 5 });
    await fundWallet(fx.buyer.id, 10_000_000);
    const before = {
      wallet: await walletOf(fx.buyer.id),
      escrow: await accountBalanceByType("ESCROW"),
      stock: await variantStock(fx.variants[0]!.id),
      entries: await ledgerEntryCount(),
    };

    const e = await catchApi(
      createOrder(fx.buyer.id, "rb-order", makeOrderInput(fx), { simulateFailureAt: "order" }),
    );
    expect(e.code).toBe("SIMULATED_FAILURE");

    expect(await db.order.count()).toBe(0);
    expect(await walletOf(fx.buyer.id)).toBe(before.wallet);
    expect(await accountBalanceByType("ESCROW")).toBe(before.escrow);
    expect(await variantStock(fx.variants[0]!.id)).toBe(before.stock);
    expect(await ledgerEntryCount()).toBe(before.entries);
  });
});

describe("v2.0.0 ledger invariants + append-only trigger", () => {
  let fx: OrderingFixture;
  beforeAll(async () => {
    if (!pgUp) return; // بدون دیتابیس، hook هم بی‌اثر
    fx = await seedOrderingFixture({ variantStock: 10 });
    await fundWallet(fx.buyer.id, 20_000_000);
    await createOrder(fx.buyer.id, "inv-1", makeOrderInput(fx));
  });

  t("every txnId sums to exactly 0", async () => {
    expect(await unbalancedTxnIds()).toEqual([]);
  });

  t("whole ledger sums to 0", async () => {
    expect(await totalLedgerSum()).toBe(BigInt(0));
  });

  t("unbalanced postTransaction is rejected — nothing written", async () => {
    const entries = await ledgerEntryCount();
    const e = await catchApi(
      db.$transaction((tx) =>
        postTransaction(tx, newTxnId(), [
          { accountType: "ESCROW", userId: null, amount: 1000, kind: "PURCHASE_HOLD" },
        ]),
      ),
    );
    expect(["LEDGER_INVALID", "LEDGER_UNBALANCED"]).toContain(e.code);
    const e2 = await catchApi(
      db.$transaction((tx) =>
        postTransaction(tx, newTxnId(), [
          { accountType: "ESCROW", userId: null, amount: 1000, kind: "PURCHASE_HOLD" },
          { accountType: "USER_WALLET", userId: fx.buyer.id, amount: 999, kind: "PURCHASE_HOLD" },
        ]),
      ),
    );
    expect(e2.code).toBe("LEDGER_UNBALANCED");
    expect(await ledgerEntryCount()).toBe(entries);
  });

  t("DB trigger rejects UPDATE on LedgerEntry", async () => {
    const entry = await db.ledgerEntry.findFirstOrThrow();
    const e = await catchApi(
      db.ledgerEntry.update({ where: { id: entry.id }, data: { amount: BigInt(123) } }),
    );
    expect(/append-only|LedgerEntry/.test(`${e.code} ${e.message}`)).toBe(true);
    expect(e.code).not.toBe("NO_THROW");
  });

  t("DB trigger rejects DELETE on LedgerEntry", async () => {
    const entry = await db.ledgerEntry.findFirstOrThrow();
    const e = await catchApi(db.ledgerEntry.delete({ where: { id: entry.id } }));
    expect(/append-only|LedgerEntry/.test(`${e.code} ${e.message}`)).toBe(true);
    expect(e.code).not.toBe("NO_THROW");
  });
});

describe("v2.0.0 order lifecycle — ship / cancel / confirm-delivery", () => {
  let fx: OrderingFixture;
  let orderId: string;
  let total: number;
  beforeAll(async () => {
    if (!pgUp) return; // بدون دیتابیس، hook هم بی‌اثر
    fx = await seedOrderingFixture({ variantStock: 10 });
    await fundWallet(fx.buyer.id, 20_000_000);
    const { order } = await createOrder(fx.buyer.id, "life-1", makeOrderInput(fx));
    orderId = order.id;
    total = order.total;
  });

  t("user B cannot see / cancel / confirm A's order (all 404)", async () => {
    const view = await catchApi(getBuyerOrder(fx.other.id, orderId));
    expect(view.code).toBe("NOT_FOUND");
    const cancel = await catchApi(cancelOrderByBuyer(fx.other.id, orderId));
    expect(cancel.code).toBe("NOT_FOUND");
    const confirm = await catchApi(confirmDeliveryByBuyer(fx.other.id, orderId));
    expect(confirm.code).toBe("NOT_FOUND");
    // و در فهرست B هم نیست
    const list = await listBuyerOrders(fx.other.id);
    expect(list.orders.some((o) => o.id === orderId)).toBe(false);
  });

  t("non-seller cannot ship → 403; another seller → 404", async () => {
    const notSeller = await catchApi(
      shipOrderBySeller(fx.buyer.id, orderId, { carrier: "tipax", trackingCode: "TRK-1" }),
    );
    expect(notSeller.code).toBe("NOT_SELLER");
    expect(notSeller.status).toBe(403);

    // فروشندهٔ دوم — سفارش مال او نیست → ۴۰۴ (بدون لو دادن وجود)
    const seller2User = await db.user.create({
      data: { phone: "09169999999", role: "SELLER" },
    });
    await db.sellerProfile.create({
      data: { userId: seller2User.id, shopName: "فروشگاه دوم", slug: "second-seller", status: "APPROVED" },
    });
    const wrongSeller = await catchApi(
      shipOrderBySeller(seller2User.id, orderId, { carrier: "tipax", trackingCode: "TRK-2" }),
    );
    expect(wrongSeller.code).toBe("NOT_FOUND");
  });

  t("seller ships own order (PAID_HELD → SHIPPED through READY_TO_SHIP)", async () => {
    const shipped = await shipOrderBySeller(fx.sellerUser.id, orderId, {
      carrier: "tipax",
      trackingCode: "TRK-100",
    });
    expect(shipped.status).toBe("SHIPPED");
    expect(shipped.shipment?.carrier).toBe("tipax");
    expect(shipped.shipment?.trackingCode).toBe("TRK-100");
    expect(shipped.shipment?.shippedAt).not.toBeNull();
    // ship دوباره در وضعیت SHIPPED مجاز نیست
    const again = await catchApi(
      shipOrderBySeller(fx.sellerUser.id, orderId, { carrier: "post", trackingCode: "TRK-101" }),
    );
    expect(again.code).toBe("INVALID_TRANSITION");
  });

  t("confirm-delivery releases escrow once; second call pays nothing", async () => {
    const entriesBefore = await ledgerEntryCount();
    const escrowBefore = await accountBalanceByType("ESCROW");
    const payableBefore = await sellerPayableOf(fx.sellerUser.id);
    const platformBefore = await accountBalanceByType("PLATFORM_REVENUE");
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });

    const first = await confirmDeliveryByBuyer(fx.buyer.id, orderId);
    expect(first.alreadyReleased).toBe(false);
    expect(first.order.status).toBe("RELEASED");
    expect(await accountBalanceByType("ESCROW")).toBe(escrowBefore - total);
    expect(await sellerPayableOf(fx.sellerUser.id)).toBe(payableBefore + (total - order.commission));
    expect(await accountBalanceByType("PLATFORM_REVENUE")).toBe(platformBefore + order.commission);
    const entriesAfterFirst = await ledgerEntryCount();
    expect(entriesAfterFirst - entriesBefore).toBe(3); // ESCROW + SELLER_PAYABLE + PLATFORM

    // صدا زدن دوبار → فقط یک پرداخت
    const second = await confirmDeliveryByBuyer(fx.buyer.id, orderId);
    expect(second.alreadyReleased).toBe(true);
    expect(second.order.id).toBe(orderId);
    expect(await ledgerEntryCount()).toBe(entriesAfterFirst); // هیچ پرگار تازه‌ای نیست
    expect(await accountBalanceByType("ESCROW")).toBe(escrowBefore - total);
  });

  t("confirm-delivery before ship → 409 INVALID_TRANSITION", async () => {
    const fx2 = await seedOrderingFixture({ variantStock: 10 });
    await fundWallet(fx2.buyer.id, 10_000_000);
    const { order } = await createOrder(fx2.buyer.id, "life-2", makeOrderInput(fx2));
    const e = await catchApi(confirmDeliveryByBuyer(fx2.buyer.id, order.id));
    expect(e.code).toBe("INVALID_TRANSITION");
    expect(e.status).toBe(409);
  });
});

describe("v2.0.0 cancel — refund + stock restore", () => {
  t("cancel PAID_HELD → full refund, stock/soldCount restored", async () => {
    const fx = await seedOrderingFixture({ variantStock: 5 });
    await fundWallet(fx.buyer.id, 10_000_000);
    const { order } = await createOrder(fx.buyer.id, "cxl-1", makeOrderInput(fx));
    const walletAfterBuy = await walletOf(fx.buyer.id);
    const escrowAfterBuy = await accountBalanceByType("ESCROW");
    const stockAfterBuy = await variantStock(fx.variants[0]!.id);

    const canceled = await cancelOrderByBuyer(fx.buyer.id, order.id);
    expect(canceled.status).toBe("CANCELED");
    expect(await walletOf(fx.buyer.id)).toBe(walletAfterBuy + order.total);
    expect(await accountBalanceByType("ESCROW")).toBe(escrowAfterBuy - order.total);
    expect(await variantStock(fx.variants[0]!.id)).toBe(stockAfterBuy + 1);
    const item = await db.showItem.findUniqueOrThrow({ where: { id: fx.showItem.id } });
    expect(item.soldCount).toBe(0);

    // لغو دوباره → ۴۰۹ (و پول دوبار برنمی‌گردد)
    const again = await catchApi(cancelOrderByBuyer(fx.buyer.id, order.id));
    expect(again.code).toBe("INVALID_TRANSITION");
    expect(await walletOf(fx.buyer.id)).toBe(walletAfterBuy + order.total);
  });

  t("cancel after SHIPPED → 409 INVALID_TRANSITION", async () => {
    const fx = await seedOrderingFixture({ variantStock: 5 });
    await fundWallet(fx.buyer.id, 10_000_000);
    const { order } = await createOrder(fx.buyer.id, "cxl-2", makeOrderInput(fx));
    await shipOrderBySeller(fx.sellerUser.id, order.id, { carrier: "post", trackingCode: "TRK-9" });
    const e = await catchApi(cancelOrderByBuyer(fx.buyer.id, order.id));
    expect(e.code).toBe("INVALID_TRANSITION");
    expect(e.message).toContain("قبل از ارسال");
  });
});

describe("v2.0.0 wallet — history cursor + dev-topup gate", () => {
  let fx: OrderingFixture;
  beforeAll(async () => {
    if (!pgUp) return; // بدون دیتابیس، hook هم بی‌اثر
    fx = await seedOrderingFixture();
  });

  t("wallet view: balance + cursor-paged history", async () => {
    await fundWallet(fx.buyer.id, 1_000_000);
    await fundWallet(fx.buyer.id, 2_000_000);
    const view = await getWalletView(fx.buyer.id);
    expect(view.balance).toBe(3_000_000);
    expect(view.entries.length).toBe(2);
    expect(view.entries[0]!.amount).toBe(2_000_000); // newest first
    expect(view.nextCursor).toBeNull();

    const page1 = await getWalletView(fx.buyer.id, { limit: 1 });
    expect(page1.entries.length).toBe(1);
    expect(page1.nextCursor).not.toBeNull();
    const page2 = await getWalletView(fx.buyer.id, { limit: 1, cursor: page1.nextCursor! });
    expect(page2.entries.length).toBe(1);
    expect(page2.entries[0]!.id).not.toBe(page1.entries[0]!.id);
    expect(page2.nextCursor).toBeNull();
  });

  t("wallet of a user without account → balance 0", async () => {
    const view = await getWalletView(fx.other.id);
    expect(view.balance).toBe(0);
    expect(view.entries).toEqual([]);
  });

  t("dev-topup works with flag, 404 without flag, 404 in production", async () => {
    const env = grabEnv(["NODE_ENV", "DEV_TOPUP"]);
    try {
      Object.assign(process.env, { NODE_ENV: "test", DEV_TOPUP: "true" });
      const r = await devTopup(fx.other.id, 500_000);
      expect(r.balance).toBe(500_000);
      expect(r.gatewayRef).toContain("dev-");
      expect(await walletOf(fx.other.id)).toBe(500_000);

      delete process.env.DEV_TOPUP;
      let e = await catchApi(devTopup(fx.other.id, 500_000));
      expect(e.code).toBe("NOT_FOUND");

      // production همیشه ۴۰۴ — حتی با فلگ
      Object.assign(process.env, { NODE_ENV: "production", DEV_TOPUP: "true" });
      e = await catchApi(devTopup(fx.other.id, 500_000));
      expect(e.code).toBe("NOT_FOUND");
      expect(await walletOf(fx.other.id)).toBe(500_000);
    } finally {
      env.restore();
    }
  });
});

afterAll(async () => {
  await db.$disconnect();
});
