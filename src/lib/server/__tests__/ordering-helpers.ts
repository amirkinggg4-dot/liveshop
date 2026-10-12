/**
 * LiveShop v2.0.0 — shared fixtures for checkout/wallet/ledger server tests.
 *
 * Real PostgreSQL via DATABASE_URL (scripts/test-server.sh points it at the
 * dedicated `liveshop_test` schema). Every test file starts from
 * `seedOrderingFixture()` which truncates + rebuilds a minimal world:
 * seller + LIVE show + product/variants, buyer + address, second user.
 */
import { db } from "@/lib/db";
import { LEDGER_DDL_STATEMENTS } from "@/lib/server/ledger-ddl";
import { newTxnId, postTransactionStandalone } from "@/lib/server/ledger";
import type { CreateOrderInput } from "@/lib/server/checkout";

let counter = 0;
const uniq = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++counter}`;

/** Idempotent: the append-only trigger must exist even when tests run
 *  without scripts/test-server.sh (e.g. a bare `bun test` re-run). */
export async function ensureLedgerTrigger(): Promise<void> {
  for (const stmt of LEDGER_DDL_STATEMENTS) {
    await db.$executeRawUnsafe(stmt);
  }
}

export async function wipeOrderingTables(): Promise<void> {
  // TRUNCATE is not caught by the row-level DELETE trigger — seeding stays possible
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      "LedgerEntry", "Account", "Dispute", "Shipment", "OrderItem", "Order",
      "ChatMessage", "ShowItem", "Show", "Follow", "Variant", "Product",
      "Category", "Address", "RefreshToken", "OtpCode", "SellerProfile",
      "User", "Report"
    RESTART IDENTITY CASCADE;
  `);
}

export interface OrderingFixture {
  sellerUser: { id: string };
  seller: { id: string };
  category: { id: string };
  product: { id: string; price: number };
  variants: { id: string; label: string; stock: number }[];
  show: { id: string; status: string };
  showItem: { id: string };
  buyer: { id: string };
  buyerAddress: { id: string };
  other: { id: string };
  otherAddress: { id: string };
  /** unit price used by the fixture (variant has no priceOverride) */
  unitPrice: number;
}

export const SHIPPING_METHOD = "tipax" as const;
export const SHIPPING_FEE = 45_000; // fees.ts SHIPPING_PRICES.tipax

export async function seedOrderingFixture(
  opts: { variantStock?: number; showStatus?: "LIVE" | "SCHEDULED" | "ENDED" } = {},
): Promise<OrderingFixture> {
  await wipeOrderingTables();
  await ensureLedgerTrigger();

  const category = await db.category.create({
    data: { slug: uniq("cat"), nameFa: "کتونی تست" },
  });
  const sellerUser = await db.user.create({
    data: { phone: uniq("0912000"), name: "فروشندهٔ تست", role: "SELLER" },
  });
  const seller = await db.sellerProfile.create({
    data: {
      userId: sellerUser.id,
      shopName: "کتونی تست",
      slug: uniq("seller"),
      status: "APPROVED",
    },
  });
  const unitPrice = 2_000_000;
  const product = await db.product.create({
    data: {
      sellerId: seller.id,
      categoryId: category.id,
      title: "کتانی تست",
      price: unitPrice,
      isDraft: false,
      images: [],
      variants: {
        create: [
          { label: "۴۲", stock: opts.variantStock ?? 5 },
          { label: "۴۳", stock: 100 },
        ],
      },
    },
    include: { variants: true },
  });

  const show = await db.show.create({
    data: {
      sellerId: seller.id,
      categoryId: category.id,
      title: "شوی تست",
      status: opts.showStatus ?? "LIVE",
      startedAt: (opts.showStatus ?? "LIVE") === "LIVE" ? new Date() : null,
      items: { create: { productId: product.id, position: 1, pinned: true } },
    },
    include: { items: true },
  });

  const buyer = await db.user.create({ data: { phone: uniq("0913000"), name: "خریدار" } });
  const buyerAddress = await db.address.create({
    data: {
      userId: buyer.id,
      receiver: "خریدار تست",
      phone: "09130000000",
      province: "تهران",
      city: "تهران",
      addressLine: "خیابان تست، پلاک ۱",
      postalCode: "1111111111",
    },
  });
  const other = await db.user.create({ data: { phone: uniq("0914000"), name: "کاربر دیگر" } });
  const otherAddress = await db.address.create({
    data: {
      userId: other.id,
      receiver: "کاربر دیگر",
      phone: "09140000000",
      province: "تهران",
      city: "تهران",
      addressLine: "خیابان دیگر، پلاک ۲",
      postalCode: "2222222222",
    },
  });

  // حساب‌های سیستمی از قبل موجود باشند (مسیر سریع ensureAccount بدون قفل)
  for (const type of ["ESCROW", "PLATFORM_REVENUE", "GATEWAY_CLEARING"] as const) {
    await db.account.create({ data: { type } });
  }

  return {
    sellerUser: { id: sellerUser.id },
    seller: { id: seller.id },
    category: { id: category.id },
    product: { id: product.id, price: unitPrice },
    variants: product.variants.map((v) => ({ id: v.id, label: v.label, stock: v.stock })),
    show: { id: show.id, status: show.status },
    showItem: { id: show.items[0]!.id },
    buyer: { id: buyer.id },
    buyerAddress: { id: buyerAddress.id },
    other: { id: other.id },
    otherAddress: { id: otherAddress.id },
    unitPrice,
  };
}

/** شارژ تستی کیف پول از مسیر GATEWAY_CLEARING (شبیه dev-topup) */
export async function fundWallet(userId: string, amount: number): Promise<void> {
  await postTransactionStandalone(newTxnId(), [
    { accountType: "GATEWAY_CLEARING", userId: null, amount: -amount, kind: "TOPUP" },
    { accountType: "USER_WALLET", userId, amount, kind: "TOPUP" },
  ]);
}

export async function walletOf(userId: string): Promise<number> {
  const agg = await db.ledgerEntry.aggregate({
    _sum: { amount: true },
    where: { account: { type: "USER_WALLET", userId } },
  });
  return Number(agg._sum.amount ?? BigInt(0));
}

export async function variantStock(variantId: string): Promise<number> {
  const v = await db.variant.findUniqueOrThrow({ where: { id: variantId } });
  return v.stock;
}

export async function sellerPayableOf(userId: string): Promise<number> {
  const agg = await db.ledgerEntry.aggregate({
    _sum: { amount: true },
    where: { account: { type: "SELLER_PAYABLE", userId } },
  });
  return Number(agg._sum.amount ?? BigInt(0));
}

export async function accountBalanceByType(type: "ESCROW" | "PLATFORM_REVENUE" | "GATEWAY_CLEARING"): Promise<number> {
  const agg = await db.ledgerEntry.aggregate({
    _sum: { amount: true },
    where: { account: { type } },
  });
  return Number(agg._sum.amount ?? BigInt(0));
}

export async function ledgerEntryCount(): Promise<number> {
  return db.ledgerEntry.count();
}

/** نقض مستقیم invariantها — GROUP BY بر روی جدول واقعی */
export async function unbalancedTxnIds(): Promise<{ txnId: string; sum: string }[]> {
  return db.$queryRaw<{ txnId: string; sum: string }[]>`
    SELECT "txnId", SUM("amount")::text AS "sum"
    FROM "LedgerEntry" GROUP BY "txnId" HAVING SUM("amount") <> 0`;
}

export async function totalLedgerSum(): Promise<bigint> {
  const rows = await db.$queryRaw<{ sum: string }[]>`
    SELECT COALESCE(SUM("amount"), 0)::text AS "sum" FROM "LedgerEntry"`;
  return BigInt(rows[0]!.sum);
}

export function makeOrderInput(
  fx: OrderingFixture,
  overrides: Partial<CreateOrderInput> & { variantIndex?: number; qty?: number } = {},
): CreateOrderInput {
  const variant = fx.variants[overrides.variantIndex ?? 0]!;
  return {
    showId: fx.show.id,
    items: [{ variantId: variant.id, qty: overrides.qty ?? 1 }],
    addressId: fx.buyerAddress.id,
    shippingMethod: overrides.shippingMethod ?? SHIPPING_METHOD,
    ...overrides,
  };
}

/** پرچم‌های ApiError برای assert راحت */
export async function catchApi(
  p: Promise<unknown>,
): Promise<{ code: string; status: number; message: string }> {
  try {
    await p;
    return { code: "NO_THROW", status: 0, message: "" };
  } catch (err) {
    const e = err as { code?: string; status?: number; message?: string };
    return {
      code: e.code ?? `NON_API:${e.message ?? String(err)}`,
      status: e.status ?? 0,
      message: e.message ?? "",
    };
  }
}
