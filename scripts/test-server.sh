#!/usr/bin/env bash
# LiveShop — server security tests (src/lib/server/__tests__) against a REAL PostgreSQL.
#
#   bun run test:server
#
# Runs in a dedicated schema `liveshop_test` (same embedded/dev Postgres) so
# dev/seed data is never touched. Starts the embedded Postgres when needed.
set -euo pipefail
cd "$(dirname "$0")/.."

TEST_URL="postgresql://liveshop:liveshop@localhost:5432/liveshop?schema=liveshop_test"
DEV_URL="postgresql://liveshop:liveshop@localhost:5432/liveshop?schema=public"

pg_ready() {
  bun -e 'const n=require("node:net");const s=n.connect(5432,"localhost");s.on("connect",()=>{s.end();process.exit(0)});s.on("error",()=>process.exit(1))' >/dev/null 2>&1
}

PG_PID=""
if ! pg_ready; then
  echo "[tests] starting embedded PostgreSQL…"
  bun scripts/dev-postgres.ts >/tmp/liveshop-tests-pg.log 2>&1 &
  PG_PID=$!
  for _ in $(seq 1 60); do pg_ready && break; sleep 0.5; done
  pg_ready || { echo "[tests] postgres did not come up — see /tmp/liveshop-tests-pg.log"; exit 1; }
fi
trap '[ -n "$PG_PID" ] && kill "$PG_PID" 2>/dev/null || true' EXIT

# The target schema must exist before prisma touches it.
DATABASE_URL="$DEV_URL" bun -e '
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.$executeRawUnsafe("CREATE SCHEMA IF NOT EXISTS liveshop_test")
  .then(() => p.$disconnect())
  .catch((e) => { console.error(e); process.exit(1); });
'

# Sync the test schema with prisma/schema.prisma (idempotent).
DATABASE_URL="$TEST_URL" bunx prisma db push --skip-generate --accept-data-loss >/dev/null

# v2.0.0 — apply raw DDL prisma cannot express (append-only LedgerEntry trigger).
DATABASE_URL="$TEST_URL" bun scripts/apply-db-extras.ts >/dev/null

# Run the suite with a stable test secret (≥32 chars, like production would have).
export DATABASE_URL="$TEST_URL"
export AUTH_SECRET="${AUTH_SECRET:-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef}"
exec bun test src/lib/server/__tests__ "$@"
