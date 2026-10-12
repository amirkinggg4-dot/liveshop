/**
 * LiveShop v2.0.0 — ledger reconciliation (spec §8, run manually / by cron).
 *
 * Checks, against DATABASE_URL:
 *   1. every txnId's entries sum to EXACTLY 0;
 *   2. the whole ledger sums to 0;
 *   3. ESCROW balance equals the sum of totals of orders whose money is
 *      still held (PAID_HELD, READY_TO_SHIP, SHIPPED, DELIVERED).
 *
 * Exit 0 = balanced; exit 1 = violations printed (cron/alert friendly).
 *
 *   bun scripts/reconcile-ledger.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";

const db = new PrismaClient();

/** وضعیت‌هایی که پول هنوز در امانت است (هنوز آزاد/مسترد/لغو نشده) */
const HOLDING_STATUSES = ["PAID_HELD", "READY_TO_SHIP", "SHIPPED", "DELIVERED"];

async function main() {
  let violations = 0;

  // ── 1) هر txnId دقیقاً صفر ──
  const badTxns = await db.$queryRaw<{ txnId: string; sum: bigint }[]>`
    SELECT "txnId", SUM("amount")::text AS "sum"
    FROM "LedgerEntry" GROUP BY "txnId" HAVING SUM("amount") <> 0`;
  if (badTxns.length > 0) {
    violations += badTxns.length;
    console.error(`✗ ${badTxns.length} تراکنش نامتراز:`);
    for (const row of badTxns) {
      console.error(`   txnId=${row.txnId} sum=${row.sum}`);
    }
  } else {
    console.log("✓ هر txnId جمعش صفر است");
  }

  // ── 2) جمع کل دفتر صفر ──
  const totalRows = await db.$queryRaw<{ sum: string }[]>`
    SELECT COALESCE(SUM("amount"), 0)::text AS "sum" FROM "LedgerEntry"`;
  const total = BigInt(totalRows[0]!.sum);
  if (total !== BigInt(0)) {
    violations += 1;
    console.error(`✗ جمع کل دفتر صفر نیست: ${total}`);
  } else {
    console.log("✓ جمع کل دفتر صفر است");
  }

  // ── 3) موجودی ESCROW = جمع سفارش‌های در حال نگهداری ──
  const escrowAccount = await db.account.findFirst({
    where: { type: "ESCROW", userId: null },
    select: { id: true },
  });
  const escrowBalance = escrowAccount
    ? Number(
        (
          await db.ledgerEntry.aggregate({
            _sum: { amount: true },
            where: { accountId: escrowAccount.id },
          })
        )._sum.amount ?? BigInt(0),
      )
    : 0;
  const heldRows = await db.$queryRaw<{ sum: string }[]>`
    SELECT COALESCE(SUM("total"), 0)::text AS "sum"
    FROM "Order" WHERE "status"::text IN (${Prisma.join(HOLDING_STATUSES)})`;
  const heldSum = BigInt(heldRows[0]!.sum);
  if (escrowBalance !== Number(heldSum)) {
    violations += 1;
    console.error(
      `✗ ناهمخوانی امانت: موجودی ESCROW=${escrowBalance} ≠ جمع سفارش‌های در نگهداری=${heldSum}`,
    );
  } else {
    console.log(
      `✓ ESCROW (${escrowBalance}) = جمع سفارش‌های در نگهداری (${heldSum})`,
    );
  }

  const entryCount = await db.ledgerEntry.count();
  console.log(
    violations === 0
      ? `\nتراز کامل است — ${entryCount} پرگار سالم ✓`
      : `\n${violations} تخلف پیدا شد ✗`,
  );
  process.exit(violations === 0 ? 0 : 1);
}

main()
  .catch((err) => {
    console.error("[reconcile] failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
