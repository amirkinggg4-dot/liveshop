/**
 * LiveShop v2.0.0 — wallet endpoints logic (spec §5).
 *
 * GET /wallet  → balance (SUM of USER_WALLET entries) + cursor-paged history.
 * POST /wallet/dev-topup → DEV-ONLY fake topup. Gated by
 *   NODE_ENV !== "production" AND DEV_TOPUP=true — in production (and in dev
 *   without the flag) the endpoint is ALWAYS 404, before any body parsing.
 *   No real gateway in this phase; the counterpart entry is GATEWAY_CLEARING
 *   (negative), kind TOPUP, with a unique gatewayRef per call.
 */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { errors } from "./http";
import { ensureAccount, newTxnId, postTransaction, sumEntries } from "./ledger";
import { WALLET_CHARGE } from "@/lib/config/fees";

export interface ApiWalletEntry {
  id: string;
  txnId: string;
  amount: number;
  kind: string;
  orderId: string | null;
  gatewayRef: string | null;
  createdAt: string;
}

export interface WalletView {
  balance: number;
  entries: ApiWalletEntry[];
  nextCursor: string | null;
}

export async function getWalletView(
  userId: string,
  opts: { cursor?: string | null; limit?: number } = {},
): Promise<WalletView> {
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  const account = await db.account.findFirst({
    where: { type: "USER_WALLET", userId },
    select: { id: true },
  });
  if (!account) {
    return { balance: 0, entries: [], nextCursor: null };
  }
  // take limit+1 تا «صفحهٔ بعدی وجود دارد؟» بدون رفت‌وبرگشت اضافه معلوم شود
  const entries = account
    ? await db.ledgerEntry.findMany({
        where: { accountId: account.id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      })
    : [];
  const hasMore = entries.length > limit;
  const page = hasMore ? entries.slice(0, limit) : entries;
  return {
    balance: Number(await sumEntries(db, account?.id ?? "")),
    entries: page.map((entry) => ({
      id: entry.id,
      txnId: entry.txnId,
      amount: Number(entry.amount),
      kind: entry.kind,
      orderId: entry.orderId,
      gatewayRef: entry.gatewayRef,
      createdAt: entry.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
  };
}

export const devTopupSchema = z.object({
  amount: z
    .number()
    .int()
    .min(WALLET_CHARGE.minToman)
    .max(WALLET_CHARGE.maxToman),
});

export function devTopupEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DEV_TOPUP === "true";
}

export interface DevTopupResult {
  balance: number;
  gatewayRef: string;
}

export async function devTopup(
  userId: string,
  amount: number,
): Promise<DevTopupResult> {
  if (!devTopupEnabled()) {
    // production همیشه — و dev بدون فلگ — ۴۰۴، قبل از هر کاری
    throw errors.notFound("چنین مسیری وجود ندارد");
  }
  return db.$transaction(async (tx) => {
    const wallet = await ensureAccount(tx, "USER_WALLET", userId);
    const gatewayRef = `dev-${randomUUID()}`;
    const txnId = newTxnId();
    await postTransaction(tx, txnId, [
      {
        accountType: "GATEWAY_CLEARING",
        userId: null,
        amount: -amount,
        kind: "TOPUP",
        gatewayRef,
      },
      {
        accountType: "USER_WALLET",
        userId,
        amount,
        kind: "TOPUP",
        gatewayRef,
      },
    ]);
    return { balance: Number(await sumEntries(tx, wallet.id)), gatewayRef };
  });
}
