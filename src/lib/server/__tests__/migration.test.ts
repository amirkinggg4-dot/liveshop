/**
 * LiveShop — migration test for v1.6.3 (real Postgres).
 *
 * Proves the migration chain (init → v1_6_3_search_text_condition) applies
 * WITHOUT error to a database that then gets seeded, i.e. the exact path a
 * previously-deployed environment takes when upgrading:
 *
 *   fresh schema → `prisma migrate deploy` → `bun prisma/seed.ts` → assert
 *
 * Runs as part of `bun run test:server` (same DATABASE_URL family). Uses its
 * own throwaway schema `liveshop_migration_test` so dev/test data is never
 * touched.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { PrismaClient } from "@prisma/client";
import { CATEGORIES } from "@/lib/data/categories";

const MIGRATION_SCHEMA = "liveshop_migration_test";
const DEV_URL = "postgresql://liveshop:liveshop@localhost:5432/liveshop?schema=public";
const MIG_URL = `postgresql://liveshop:liveshop@localhost:5432/liveshop?schema=${MIGRATION_SCHEMA}`;

function run(cmd: string[], env: Record<string, string>) {
  const proc = Bun.spawnSync(cmd, {
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    ok: proc.exitCode === 0,
    out: new TextDecoder().decode(proc.stdout),
    err: new TextDecoder().decode(proc.stderr),
  };
}

describe("v1.6.3 migration chain on a seeded database", () => {
  const admin = new PrismaClient({ datasources: { db: { url: DEV_URL } } });

  beforeAll(async () => {
    await admin.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS ${MIGRATION_SCHEMA} CASCADE`,
    );
    await admin.$executeRawUnsafe(`CREATE SCHEMA ${MIGRATION_SCHEMA}`);
  });

  afterAll(async () => {
    await admin.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS ${MIGRATION_SCHEMA} CASCADE`,
    );
    await admin.$disconnect();
  });

  test("prisma migrate deploy + seed run clean, searchText/condition land", async () => {
    // 1) apply the full migration chain to the empty schema
    const deploy = run(["bunx", "prisma", "migrate", "deploy"], {
      DATABASE_URL: MIG_URL,
    });
    if (!deploy.ok) {
      console.error("migrate deploy stdout:", deploy.out, "stderr:", deploy.err);
    }
    expect(deploy.ok).toBeTrue();

    // 2) seed it (same seed the dev database uses — fills searchText via
    //    the shared normalizeFa module)
    const seed = run(["bun", "prisma/seed.ts"], { DATABASE_URL: MIG_URL });
    if (!seed.ok) {
      console.error("seed stdout:", seed.out, "stderr:", seed.err);
    }
    expect(seed.ok).toBeTrue();

    // 3) assert the seeded + migrated state
    const db = new PrismaClient({ datasources: { db: { url: MIG_URL } } });
    try {
      const products = await db.product.findMany();
      expect(products.length).toBeGreaterThan(0);
      for (const p of products) {
        expect(p.searchText.length).toBeGreaterThan(0);
        expect(["NEW", "USED"]).toContain(p.condition);
      }
      const used = products.filter((p) => p.condition === "USED");
      expect(used.length).toBeGreaterThanOrEqual(1); // seed marks jordan1 USED

      const shows = await db.show.findMany();
      expect(shows.length).toBeGreaterThan(0);
      for (const s of shows) expect(s.searchText.length).toBeGreaterThan(0);

      const sellers = await db.sellerProfile.findMany();
      for (const s of sellers) expect(s.searchText.length).toBeGreaterThan(0);

      // pg_trgm GIN indexes exist (created by the migration)
      const idx = (await db.$queryRawUnsafe(
        `SELECT indexname FROM pg_indexes WHERE schemaname = '${MIGRATION_SCHEMA}'
         AND indexname LIKE '%_trgm_idx'`,
      )) as { indexname: string }[];
      expect(idx.length).toBe(3);

      // v2.0.3 — the seeded category tree matches the single source
      // (src/lib/data/categories.ts): 10 top-level rows, each with its
      // subcategory rows (same slugs/names), no subcategory at top level.
      const tops = await db.category.findMany({
        where: { parentId: null },
        orderBy: { slug: "asc" },
      });
      expect(tops.length).toBe(CATEGORIES.length);
      const expectedTotal =
        CATEGORIES.length +
        CATEGORIES.reduce((n, c) => n + (c.subcategories?.length ?? 0), 0);
      expect(await db.category.count()).toBe(expectedTotal);
      for (const c of CATEGORIES) {
        const row = tops.find((t) => t.slug === c.slug);
        expect(row).toBeDefined();
        expect(row!.nameFa).toBe(c.nameFa ?? c.label);
        const children = await db.category.findMany({
          where: { parentId: row!.id },
        });
        expect(children.map((ch) => ch.slug).sort()).toEqual(
          (c.subcategories ?? []).map((s) => s.slug).sort(),
        );
        expect(children.map((ch) => ch.nameFa).sort()).toEqual(
          (c.subcategories ?? []).map((s) => s.nameFa).sort(),
        );
      }
    } finally {
      await db.$disconnect();
    }
  });
});
