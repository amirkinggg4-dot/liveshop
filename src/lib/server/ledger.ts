/**
 * LiveShop v2.0.0 — double-entry ledger (spec §4/§5).
 *
 * Invariants (enforced here AND by the database):
 *   1. Every business transaction posts ≥ 2 LedgerEntry rows sharing one txnId
 *      whose amounts sum to EXACTLY 0 (checked before insert, inside the
 *      caller's transaction).
 *   2. Entries are append-only — UPDATE/DELETE rejected by the
 *      ledger_entry_no_update trigger (see ledger-ddl.ts).
 *   3. Balance of an account = SUM(amount) of its entries.
 *   4. Accounts are lazy: USER_WALLET / SELLER_PAYABLE are created on first
 *      use per user; system accounts (ESCROW, PLATFORM_REVENUE,
 *      GATEWAY_CLEARING) are created under an advisory transaction lock so
 *      concurrent first use cannot produce duplicates (the (type,userId)
 *      unique index does not help for NULL userId — Postgres treats NULLs as
 *      distinct).
 *
 * All functions take a Prisma transaction client so the ledger posting is
 * always part of the caller's ONE database transaction (spec §4).
 */
import { randomUUID } from "node:crypto";
import type { AccountType, LedgerKind, Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError } from "./http";

/** Any PrismaClient or interactive-transaction client. */
export type DbLike = Prisma.TransactionClient | PrismaClient;

export class LedgerError extends ApiError {
  constructor(code: string, message: string, status = 500) {
    super(code, message, status);
    this.name = "LedgerError";
  }
}

export interface LedgerEntryInput {
  /** نوع حساب — USER_WALLET/SELLER_PAYABLE با userId؛ بقیه سیستمی */
  accountType: AccountType;
  /** صاحب حساب برای حساب‌های کاربری؛ null برای حساب‌های سیستمی */
  userId?: string | null;
  /** مبلغ علامت‌دار (تومان صحیح) — مثبت = ورود به حساب، منفی = خروج */
  amount: number;
  kind: LedgerKind;
  orderId?: string | null;
  gatewayRef?: string | null;
}

/** شناسهٔ یک تراکنش دفتری (همهٔ پرگارهای یک رویداد کسب‌وکاری) */
export function newTxnId(): string {
  return `txn_${randomUUID()}`;
}

function unbalanced(): LedgerError {
  return new LedgerError(
    "LEDGER_UNBALANCED",
    "تراز دفتر حساب برقرار نیست؛ مجموع پرگارهای تراکنش باید صفر باشد",
  );
}

function invalid(message: string): LedgerError {
  return new LedgerError("LEDGER_INVALID", message);
}

/**
 * حساب را (داخل تراکنش صدا زننده) پیدا یا می‌سازد.
 * مسیر سریع: یک SELECT بدون قفل (حساب‌ها هرگز حذف نمی‌شوند پس وجودش پایدار است).
 * فقط برای «اولین ساختن» قفل advisory تراکنشی گرفته می‌شود تا مسابقهٔ هم‌زمانی
 * دو ردیف نسازد:
 *  - حساب سیستمی (userId = null): ایندکس unique در Postgres مقادیر NULL را
 *    متمایز می‌داند و جلوی دو ردیف (ESCROW, null) را نمی‌گیرد؛
 *  - حساب کاربری: retry با P2002 داخل تراکنش تعاملی ممکن نیست (خطا کل
 *    تراکنش را abort می‌کند)، پس همان قفل advisory ترتیب را تضمین می‌کند.
 */
export async function ensureAccount(
  tx: DbLike,
  type: AccountType,
  userId: string | null,
): Promise<{ id: string }> {
  const where = { type, userId: userId ?? null } as const;
  const found = await tx.account.findFirst({ where, select: { id: true } });
  if (found) return found;

  const lockKey = userId == null
    ? `liveshop:account:${type}`
    : `liveshop:account:${type}:${userId}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
  const again = await tx.account.findFirst({ where, select: { id: true } });
  if (again) return again;
  return tx.account.create({
    data: userId == null ? { type } : { type, userId },
    select: { id: true },
  });
}

/** قفل ردیف حساب با SELECT … FOR UPDATE — سفارش‌های هم‌زمان یک خریدار را می‌بندد. */
export async function lockAccountForUpdate(
  tx: DbLike,
  accountId: string,
): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "Account" WHERE "id" = ${accountId} FOR UPDATE`;
}

/** مجموع پرگارهای یک حساب (داخل تراکنش یا روی کلاینت) */
export async function sumEntries(
  tx: DbLike,
  accountId: string,
): Promise<bigint> {
  const agg = await tx.ledgerEntry.aggregate({
    _sum: { amount: true },
    where: { accountId },
  });
  return agg._sum.amount ?? BigInt(0);
}

/** موجودی حساب = SUM(amount) — تومان صحیح */
export async function getBalance(accountId: string): Promise<number> {
  return Number(await sumEntries(db, accountId));
}

/**
 * ثبت یک تراکنش دفتری کامل — همیشه داخل تراکنشِ صدا زننده.
 * شرط: مجموع amountها دقیقاً صفر؛ در غیر این‌صورت هیچ ردیفی نوشته نمی‌شود.
 */
export async function postTransaction(
  tx: DbLike,
  txnId: string,
  entries: readonly LedgerEntryInput[],
): Promise<void> {
  if (entries.length < 2) {
    throw invalid("هر تراکنش دفتری حداقل دو پرگار لازم دارد");
  }
  let sum = BigInt(0);
  const amounts: bigint[] = [];
  for (const entry of entries) {
    if (!Number.isInteger(entry.amount)) {
      throw invalid("مبلغ پرگارها باید عدد صحیح تومان باشد");
    }
    const big = BigInt(entry.amount);
    amounts.push(big);
    sum += big;
  }
  if (sum !== BigInt(0)) throw unbalanced();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const account = await ensureAccount(tx, entry.accountType, entry.userId ?? null);
    await tx.ledgerEntry.create({
      data: {
        txnId,
        accountId: account.id,
        amount: amounts[i]!,
        kind: entry.kind,
        orderId: entry.orderId ?? null,
        gatewayRef: entry.gatewayRef ?? null,
      },
    });
  }
}

/** نسخهٔ مستقل برای جاهایی که تراکنش بیرونی وجود ندارد (مثل dev-topup ساده) */
export async function postTransactionStandalone(
  txnId: string,
  entries: readonly LedgerEntryInput[],
): Promise<void> {
  await db.$transaction((tx) => postTransaction(tx, txnId, entries));
}
