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
import { PrismaClient, SellerLinkKind } from "@prisma/client";
import { CATEGORIES } from "@/lib/data/categories";
import { BUSINESS_KIND_IDS, SELL_CHANNEL_IDS } from "@/lib/seller-profile-pick";
import {
  OTHER_PLATFORM_IDS,
  PRESENCE_KIND_LABEL,
  SOCIAL_PLATFORM_IDS,
} from "@/lib/seller-presence";

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

      // v2.0.4 — seller type landed: default INDIVIDUAL everywhere except
      // the one BUSINESS seed (گجت‌بازار) which carries its company fields.
      const business = sellers.find((s) => s.sellerType === "BUSINESS");
      expect(business).toBeDefined();
      expect(business!.companyName!.length).toBeGreaterThan(0);
      expect(business!.companyNationalId).toMatch(/^\d{11}$/);
      expect(business!.economicCode).toMatch(/^\d+$/);
      expect(business!.registrationNumber).toMatch(/^\d+$/);
      const individuals = sellers.filter((s) => s.sellerType === "INDIVIDUAL");
      expect(individuals.length).toBeGreaterThanOrEqual(4);
      for (const s of individuals) {
        expect(s.companyName).toBeNull();
        expect(s.companyNationalId).toBeNull();
      }

      // v2.0.5 — onboarding step 4 landed: every seeded seller carries its
      // sellChannels array (exact values from the seed, all within the
      // single-source SELL_CHANNEL_IDS) and businessKind is RESELLER only
      // for the BUSINESS seed (گجت‌بازار), NULL for every INDIVIDUAL.
      const expectedChannels: Record<string, string[]> = {
        "کفش‌خانهٔ سینا": ["social", "physical_store"],
        "گلخانهٔ مینا": ["social", "other_platforms"],
        "کلکسیون‌یار تهران": ["other_platforms", "social"],
        "گجت‌بازار": ["social", "other_platforms"],
        "عطر و نگین": ["website", "social"],
      };
      expect(sellers.length).toBe(Object.keys(expectedChannels).length);
      for (const s of sellers) {
        expect(s.sellChannels).toEqual(expectedChannels[s.shopName]);
        for (const c of s.sellChannels) {
          expect((SELL_CHANNEL_IDS as readonly string[]).includes(c)).toBeTrue();
        }
      }
      expect(business!.businessKind).toBe("RESELLER");
      expect((BUSINESS_KIND_IDS as readonly string[]).includes(business!.businessKind!)).toBeTrue();
      for (const s of individuals) {
        expect(s.businessKind).toBeNull();
      }

      // v2.0.6 — onboarding step 5 (online presence) landed: every seeded
      // seller carries its exact link multiset (kind + platform + value —
      // 2 links each), all rows are private (isPublic === false) and
      // linksPublic is false profile-wide; platform keys stay within the
      // single-source SOCIAL_PLATFORM_IDS/OTHER_PLATFORM_IDS and every
      // value is an http(s) URL. The physical store columns are set ONLY
      // for کفش‌خانهٔ سینا (the physical_store seller).
      const expectedLinks: Record<
        string,
        { kind: SellerLinkKind; platform: string | null; value: string }[]
      > = {
        "کفش‌خانهٔ سینا": [
          { kind: "SOCIAL", platform: "instagram", value: "https://instagram.com/sina.kicks" },
          { kind: "SOCIAL", platform: "telegram", value: "https://t.me/sinakicks" },
        ],
        "گلخانهٔ مینا": [
          { kind: "SOCIAL", platform: "instagram", value: "https://instagram.com/mina.garden" },
          { kind: "OTHER_PLATFORM", platform: "digikala", value: "https://www.digikala.com/seller/mina-garden" },
        ],
        "کلکسیون‌یار تهران": [
          { kind: "OTHER_PLATFORM", platform: "divar", value: "https://divar.ir/seller/collector-tehran" },
          { kind: "SOCIAL", platform: "instagram", value: "https://instagram.com/collector.tehran" },
        ],
        "گجت‌بازار": [
          { kind: "SOCIAL", platform: "instagram", value: "https://instagram.com/gadget.bazaar" },
          { kind: "OTHER_PLATFORM", platform: "digikala", value: "https://www.digikala.com/seller/gadgetbazaar" },
        ],
        "عطر و نگین": [
          { kind: "WEBSITE", platform: null, value: "https://atr-negin.example.com" },
          { kind: "SOCIAL", platform: "instagram", value: "https://instagram.com/atr.o.negin" },
        ],
      };
      const byValue = (
        a: { kind: SellerLinkKind; platform: string | null; value: string },
        b: { kind: SellerLinkKind; platform: string | null; value: string }
      ) => a.value.localeCompare(b.value);
      for (const s of sellers) {
        const links = await db.sellerLink.findMany({
          where: { sellerProfileId: s.id },
        });
        expect(links.map((l) => ({ kind: l.kind, platform: l.platform, value: l.value })).sort(byValue))
          .toEqual([...expectedLinks[s.shopName]].sort(byValue));
        for (const l of links) {
          expect(l.isPublic).toBeFalse();
          // kind stays within the SellerLinkKind enum values (single source)
          expect(Object.keys(PRESENCE_KIND_LABEL)).toContain(l.kind);
          // platform key stays within the social/other platform id sets
          if (l.platform) {
            expect(
              (SOCIAL_PLATFORM_IDS as readonly string[]).includes(l.platform) ||
                (OTHER_PLATFORM_IDS as readonly string[]).includes(l.platform),
            ).toBeTrue();
          }
          // canonical URL — http/https only (SECURITY.md: never fetched)
          expect(l.value.startsWith("https://") || l.value.startsWith("http://")).toBeTrue();
        }
        // profile-level «نمایش لینک‌ها در پروفایل فروشگاه» stays off in seed
        expect(s.linksPublic).toBeFalse();
        // store address columns: only the physical_store seller has them
        if (s.shopName === "کفش‌خانهٔ سینا") {
          expect(s.storeProvince).toBe("تهران");
          expect(s.storeCity).toBe("تهران");
          expect(s.storeAddress!.length).toBeGreaterThanOrEqual(10);
          expect(s.storeAddress!.length).toBeLessThanOrEqual(300);
          expect(s.storePhone).toMatch(/^0\d{10}$/);
        } else {
          expect(s.storeProvince).toBeNull();
          expect(s.storeCity).toBeNull();
          expect(s.storeAddress).toBeNull();
          expect(s.storePhone).toBeNull();
        }
      }
      expect(await db.sellerLink.count()).toBe(10);

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
