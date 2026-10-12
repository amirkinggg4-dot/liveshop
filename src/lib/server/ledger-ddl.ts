/**
 * LiveShop v2.0.0 — raw DDL that lives OUTSIDE prisma/schema.prisma.
 *
 * The double-entry ledger is append-only (spec §4/§5 + §8 reconcile):
 * UPDATE and DELETE on "LedgerEntry" must be rejected by the DATABASE itself,
 * not only by application code. Prisma cannot model triggers, so the DDL is
 * applied by:
 *   - `bun run db:extras` (scripts/apply-db-extras.ts — idempotent, run after db:push)
 *   - migration prisma/migrations/<ts>_v2_0_0_ledger_immutability (migrate deploy path)
 *   - automatically by scripts/test-server.sh before the server test suite
 *
 * Note: TRUNCATE does not fire row-level DELETE triggers, so seeding remains
 * possible (prisma/seed.ts and test fixtures rely on TRUNCATE).
 */
export const LEDGER_DDL_STATEMENTS: readonly string[] = [
  `CREATE OR REPLACE FUNCTION liveshop_ledger_entry_immutable() RETURNS trigger AS $func$
BEGIN
  RAISE EXCEPTION 'LedgerEntry is append-only: % rejected (txnId=%)', TG_OP, COALESCE(OLD."txnId", 'n/a');
END;
$func$ LANGUAGE plpgsql;`,
  `DROP TRIGGER IF EXISTS ledger_entry_no_update ON "LedgerEntry";`,
  `CREATE TRIGGER ledger_entry_no_update
  BEFORE UPDATE OR DELETE ON "LedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION liveshop_ledger_entry_immutable();`,
];
