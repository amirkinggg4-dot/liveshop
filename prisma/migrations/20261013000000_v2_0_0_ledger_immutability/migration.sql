-- v2.0.0 — the double-entry ledger is append-only (spec §4/§5, reconcile §8):
-- UPDATE and DELETE on "LedgerEntry" are rejected by the database itself.
-- Mirrors src/lib/server/ledger-ddl.ts (single source) and
-- `bun run db:extras` for the db:push path.

CREATE OR REPLACE FUNCTION liveshop_ledger_entry_immutable() RETURNS trigger AS $func$
BEGIN
  RAISE EXCEPTION 'LedgerEntry is append-only: % rejected (txnId=%)', TG_OP, COALESCE(OLD."txnId", 'n/a');
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ledger_entry_no_update ON "LedgerEntry";

CREATE TRIGGER ledger_entry_no_update
  BEFORE UPDATE OR DELETE ON "LedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION liveshop_ledger_entry_immutable();
