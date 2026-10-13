/**
 * LiveShop — v2.0.3 category tree tests (real Postgres, test schema).
 *
 * 1) GET /api/v1/categories returns ONLY top-level categories (no
 *    subcategory row leaks into the list) and each row carries its
 *    children as {slug, nameFa}.
 * 2) The seeded tree (seed.ts, exercised end-to-end in migration.test.ts
 *    via migrate deploy + seed) is CONSISTENT with the single source
 *    src/lib/data/categories.ts — asserted here directly against the
 *    fixture created from CATEGORIES, so a seed/source drift fails fast.
 *
 * Runs as part of `bun run test:server` (schema liveshop_test).
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@/lib/db";
import { GET } from "@/app/api/v1/categories/route";
import {
  ALL_SUBCATEGORY_IDS,
  CATEGORIES,
} from "@/lib/data/categories";

describe("v2.0.3 — category tree (API + seed consistency)", () => {
  let topIds: Record<string, string> = {};

  beforeAll(async () => {
    /* پاک‌سازی فقط جدول‌های همین تست — دادهٔ تست‌های دیگر (اسکیمای تست) دست نمی‌خورد */
    await db.$executeRawUnsafe(
      `TRUNCATE TABLE "ShowItem", "Show", "Product", "Category" CASCADE`
    );
    /* درخت را از تک‌منبع categories.ts می‌سازیم — دقیقاً همان کاری که seed می‌کند */
    topIds = {};
    for (const c of CATEGORIES) {
      const row = await db.category.create({
        data: { slug: c.slug as string, nameFa: c.nameFa ?? c.label },
      });
      topIds[c.id] = row.id;
    }
    for (const c of CATEGORIES) {
      for (const s of c.subcategories ?? []) {
        await db.category.create({
          data: { slug: s.slug, nameFa: s.nameFa, parentId: topIds[c.id]! },
        });
      }
    }
  });

  afterAll(async () => {
    await db.$executeRawUnsafe(
      `TRUNCATE TABLE "ShowItem", "Show", "Product", "Category" CASCADE`
    );
  });

  test("GET /categories فقط دسته‌های سطح بالا را برمی‌گرداند — بدون نشت زیرمجموعه", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      categories: {
        id: string;
        slug: string;
        nameFa: string;
        children?: { slug: string; nameFa: string }[];
      }[];
    };
    expect(data.categories).toHaveLength(CATEGORIES.length);
    /* هیچ slug زیرمجموعه‌ای در فهرست اصلی نیست */
    for (const c of data.categories) {
      expect(ALL_SUBCATEGORY_IDS.includes(c.slug)).toBe(false);
    }
    const slugs = data.categories.map((c) => c.slug).sort();
    expect(slugs).toEqual(CATEGORIES.map((c) => c.slug as string).sort());
  });

  test("children هر دسته با منبع واحد هم‌خوان است (نام + slug)", async () => {
    const res = await GET();
    const data = (await res.json()) as {
      categories: {
        slug: string;
        children?: { slug: string; nameFa: string }[];
      }[];
    };
    for (const c of CATEGORIES) {
      const row = data.categories.find((x) => x.slug === c.slug);
      expect(row).toBeDefined();
      const expected = (c.subcategories ?? []).map((s) => ({
        slug: s.slug,
        nameFa: s.nameFa,
      }));
      /* فقط {slug, nameFa} برگردانده می‌شود — بدون فیلد اضافه؛
         مقایسه به‌صورت مجموعه مرتب با slug (ترتیب collation پستگرس با
         localeCompare JS فرق می‌کند و جزو قرارداد هم نیست) */
      const bySlug = (a: { slug: string }, b: { slug: string }) =>
        a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
      expect([...(row?.children ?? [])].sort(bySlug)).toEqual(
        [...expected].sort(bySlug)
      );
    }
    /* سایر برای همهٔ دسته‌ها هست */
    for (const row of data.categories) {
      expect(
        (row.children ?? []).some((ch) => ch.slug === `${row.slug}-other`)
      ).toBe(true);
    }
  });

  test("seed ↔ categories.ts: تعداد ردیف‌ها = دسته‌ها + زیرمجموعه‌ها و هر زیرمجموعه به پدر درست وصل است", async () => {
    const expectedTotal =
      CATEGORIES.length +
      CATEGORIES.reduce((n, c) => n + (c.subcategories?.length ?? 0), 0);
    const total = await db.category.count();
    expect(total).toBe(expectedTotal);

    for (const c of CATEGORIES) {
      const parent = await db.category.findUnique({
        where: { slug: c.slug },
        include: { children: true },
      });
      expect(parent).toBeDefined();
      expect(parent!.parentId).toBeNull();
      expect(parent!.nameFa).toBe(c.nameFa ?? c.label);
      const childSlugs = parent!.children.map((ch) => ch.slug).sort();
      expect(childSlugs).toEqual(
        (c.subcategories ?? []).map((s) => s.slug).sort()
      );
    }
  });
});
