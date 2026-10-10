/**
 * LiveShop — local development PostgreSQL.
 *
 * Starts a real PostgreSQL 17 server (prebuilt binaries, no system install)
 * stored in db/postgres/. Safe to re-run: initialising the cluster and
 * creating the database are skipped when already done.
 *
 *   bun run postgres          → start and keep running (foreground daemon)
 *   bun run postgres -- --provision-only
 *                             → initialise + create DB, then stop
 *
 * Connection: postgresql://liveshop:liveshop@localhost:5432/liveshop
 * (override with PGDATA_DIR / PGPORT)
 */
import EmbeddedPostgres from "embedded-postgres";

const PORT = Number(process.env.PGPORT ?? 5432);
const DATA_DIR = process.env.PGDATA_DIR ?? "db/postgres";
const USER = "liveshop";
const PASSWORD = "liveshop";
const DB_NAME = "liveshop";

const provisionOnly = process.argv.includes("--provision-only");

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
  });

  try {
    await pg.initialise();
    console.log(`[postgres] cluster initialised at ${DATA_DIR}`);
  } catch {
    console.log("[postgres] cluster already initialised — skipping");
  }

  await pg.start();
  console.log(`[postgres] server listening on :${PORT}`);

  try {
    await pg.createDatabase(DB_NAME);
    console.log(`[postgres] database "${DB_NAME}" created`);
  } catch {
    console.log(`[postgres] database "${DB_NAME}" already exists`);
  }

  console.log(`[postgres] ready → postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DB_NAME}`);

  if (provisionOnly) {
    await pg.stop();
    console.log("[postgres] stopped (--provision-only)");
    return;
  }

  // Keep the daemon alive until the process is killed.
  process.on("SIGINT", async () => {
    await pg.stop();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await pg.stop();
    process.exit(0);
  });
  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  console.error("[postgres] fatal:", err);
  process.exit(1);
});
