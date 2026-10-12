/**
 * Applies the raw DDL that prisma db push cannot express (idempotent).
 * Currently: the append-only trigger on LedgerEntry (v2.0.0).
 *
 *   DATABASE_URL=... bun scripts/apply-db-extras.ts
 */
import { PrismaClient } from "@prisma/client";
import { LEDGER_DDL_STATEMENTS } from "../src/lib/server/ledger-ddl";

async function main() {
  const db = new PrismaClient();
  try {
    for (const stmt of LEDGER_DDL_STATEMENTS) {
      await db.$executeRawUnsafe(stmt);
    }
    console.log(
      `[db-extras] applied ${LEDGER_DDL_STATEMENTS.length} statements (ledger immutability trigger)`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("[db-extras] failed:", err);
  process.exit(1);
});
