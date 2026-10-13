/* ─────────────────────────────────────────────────────────────
   تست‌های واحد v2.0.3 — منطق انتخاب زیرمجموعهٔ ثبت‌نام فروشنده
   (src/lib/seller-subcategory-pick.ts) — تابع خالص، بدون استور.
   پوشش: اعتبارسنجی «حداقل یکی برای هر دسته»، toggle بدون سقف،
   پاک‌شدن draft هنگام حذف دسته، بخش خالی برای دستهٔ تازه،
   پاک‌سازی draft نشست، و سلامت منبع واحد زیرمجموعه‌ها.
   ───────────────────────────────────────────────────────────── */

import { describe, expect, test } from "bun:test";
import {
  SUBCATEGORY_REQUIRED_MESSAGE,
  canContinueSubcategories,
  missingSubcategories,
  sanitizeSubcategoryDraft,
  syncSubcategoryDraft,
  toggleSubcategoryInDraft,
  type SubcategoryDraft,
} from "./seller-subcategory-pick";
import {
  ALL_SUBCATEGORY_IDS,
  CATEGORIES,
  SUBCATEGORY_IDS_BY_CATEGORY,
  subcategoriesOf,
  subcategoryById,
} from "./data/categories";

describe("missingSubcategories / canContinueSubcategories — حداقل یکی برای هر دسته", () => {
  test("هیچ دسته‌ای زیرمجموعه ندارد → هر دو ناقص‌اند", () => {
    const draft: SubcategoryDraft = { sneakers: [], plants: [] };
    expect(missingSubcategories(draft, ["sneakers", "plants"])).toEqual([
      "sneakers",
      "plants",
    ]);
    expect(canContinueSubcategories(draft, ["sneakers", "plants"])).toBe(false);
  });

  test("یک دسته کامل و یکی خالی → فقط دستهٔ خالی missing است", () => {
    const draft: SubcategoryDraft = {
      sneakers: ["sneakers-sport"],
      plants: [],
    };
    expect(missingSubcategories(draft, ["sneakers", "plants"])).toEqual([
      "plants",
    ]);
    expect(canContinueSubcategories(draft, ["sneakers", "plants"])).toBe(false);
  });

  test("همهٔ دسته‌ها حداقل یک زیرمجموعه دارند → ادامه ممکن است", () => {
    const draft: SubcategoryDraft = {
      sneakers: ["sneakers-sport", "sneakers-formal"],
      plants: ["plants-other"],
      cards: ["cards-tcg"],
    };
    expect(missingSubcategories(draft, ["sneakers", "plants", "cards"])).toEqual(
      []
    );
    expect(canContinueSubcategories(draft, ["sneakers", "plants", "cards"])).toBe(
      true
    );
  });

  test("پیام بخش ناقص دقیقاً طبق مشخصات است", () => {
    expect(SUBCATEGORY_REQUIRED_MESSAGE).toBe("حداقل یک مورد انتخاب کن");
  });

  test("دستهٔ انتخاب‌نشده در draft اصلاً چک نمی‌شود (فقط انتخاب‌شده‌ها)", () => {
    const draft: SubcategoryDraft = { sneakers: ["sneakers-sport"] };
    expect(canContinueSubcategories(draft, ["sneakers"])).toBe(true);
  });
});

describe("toggleSubcategoryInDraft — انتخاب چندتایی بدون سقف", () => {
  test("افزودن زیرمجموعه به دسته و حفظ ترتیب لمس", () => {
    let draft: SubcategoryDraft = {};
    draft = toggleSubcategoryInDraft(draft, "sneakers", "sneakers-sport");
    draft = toggleSubcategoryInDraft(draft, "sneakers", "sneakers-formal");
    expect(draft.sneakers).toEqual(["sneakers-sport", "sneakers-formal"]);
  });

  test("لمس دوباره = حذف از همان دسته (بقیهٔ دسته‌ها دست‌نخورده)", () => {
    const draft: SubcategoryDraft = {
      sneakers: ["sneakers-sport", "sneakers-formal"],
      plants: ["plants-cactus"],
    };
    const next = toggleSubcategoryInDraft(draft, "sneakers", "sneakers-sport");
    expect(next.sneakers).toEqual(["sneakers-formal"]);
    expect(next.plants).toEqual(["plants-cactus"]);
    /* ورودی mute نشده است */
    expect(draft.sneakers).toEqual(["sneakers-sport", "sneakers-formal"]);
  });

  test("بدون سقف — همهٔ زیرمجموعه‌های یک دسته قابل انتخاب‌اند", () => {
    let draft: SubcategoryDraft = {};
    const techSubs = subcategoriesOf("tech").map((s) => s.id);
    expect(techSubs.length).toBeGreaterThanOrEqual(5);
    for (const id of techSubs) {
      draft = toggleSubcategoryInDraft(draft, "tech", id);
    }
    expect(draft.tech).toEqual(techSubs);
  });

  test("toggle دوبارهٔ همان زیرمجموعه = بازگشت به وضعیت اول (no-op)", () => {
    let draft: SubcategoryDraft = { sneakers: [] };
    draft = toggleSubcategoryInDraft(draft, "sneakers", "sneakers-boots");
    draft = toggleSubcategoryInDraft(draft, "sneakers", "sneakers-boots");
    expect(draft.sneakers).toEqual([]);
  });
});

describe("syncSubcategoryDraft — همگام با مرحلهٔ دسته", () => {
  test("حذف دسته در مرحلهٔ ۱ → زیرمجموعه‌هایش از draft پاک می‌شود", () => {
    const draft: SubcategoryDraft = {
      sneakers: ["sneakers-sport"],
      plants: ["plants-cactus", "plants-seeds"],
      cards: ["cards-tcg"],
    };
    /* کاربر در مرحلهٔ ۱ «plants» را حذف کرده است */
    const next = syncSubcategoryDraft(draft, ["sneakers", "cards"]);
    expect(Object.keys(next).sort()).toEqual(["cards", "sneakers"]);
    expect(next.plants).toBeUndefined();
    expect(next.sneakers).toEqual(["sneakers-sport"]);
    expect(next.cards).toEqual(["cards-tcg"]);
  });

  test("افزودن دستهٔ تازه → بخش جدید خالی می‌آید (کلید با [])", () => {
    const draft: SubcategoryDraft = { sneakers: ["sneakers-sport"] };
    const next = syncSubcategoryDraft(draft, ["sneakers", "beauty"]);
    expect(next.beauty).toEqual([]);
    expect(next.sneakers).toEqual(["sneakers-sport"]);
  });

  test("ترتیب کلیدها همان ترتیب انتخاب دسته‌هاست (اصلی اول)", () => {
    const draft: SubcategoryDraft = {};
    const next = syncSubcategoryDraft(draft, ["cards", "sneakers", "plants"]);
    expect(Object.keys(next)).toEqual(["cards", "sneakers", "plants"]);
  });

  test("حذف همهٔ دسته‌ها → draft خالی", () => {
    const draft: SubcategoryDraft = { sneakers: ["sneakers-sport"] };
    expect(syncSubcategoryDraft(draft, [])).toEqual({});
  });
});

describe("sanitizeSubcategoryDraft — پاک‌سازی draft نشست", () => {
  test("زیرمجموعهٔ نامعتبر، دستهٔ نامعتبر و تکرارها پاک می‌شوند", () => {
    const raw = {
      sneakers: ["sneakers-sport", "junk", "sneakers-sport", "plants-cactus"],
      deletedCat: ["whatever"],
      plants: "not-an-array",
    };
    expect(sanitizeSubcategoryDraft(raw, SUBCATEGORY_IDS_BY_CATEGORY)).toEqual({
      sneakers: ["sneakers-sport"],
    });
  });

  test("زیرمجموعهٔ دستهٔ دیگر (اشتباه کلید) حذف می‌شود", () => {
    const raw = { books: ["sneakers-sport", "books-comics"] };
    expect(sanitizeSubcategoryDraft(raw, SUBCATEGORY_IDS_BY_CATEGORY)).toEqual({
      books: ["books-comics"],
    });
  });

  test("آرایهٔ خالی معتبر است (بخش موجود، چیزی انتخاب نشده)", () => {
    expect(
      sanitizeSubcategoryDraft({ art: [] }, SUBCATEGORY_IDS_BY_CATEGORY)
    ).toEqual({ art: [] });
  });

  test("raw غیرآبجکت → null", () => {
    expect(sanitizeSubcategoryDraft(null, SUBCATEGORY_IDS_BY_CATEGORY)).toBe(
      null
    );
    expect(
      sanitizeSubcategoryDraft(["sneakers"], SUBCATEGORY_IDS_BY_CATEGORY)
    ).toBe(null);
    expect(
      sanitizeSubcategoryDraft("sneakers", SUBCATEGORY_IDS_BY_CATEGORY)
    ).toBe(null);
    expect(
      sanitizeSubcategoryDraft(42, SUBCATEGORY_IDS_BY_CATEGORY)
    ).toBe(null);
  });
});

describe("منبع واحد زیرمجموعه‌ها (categories.ts) — سلامت ساختار", () => {
  test("هر دسته ۴ تا ۷ زیرمجموعه به‌اضافهٔ «سایر» دارد", () => {
    for (const c of CATEGORIES) {
      const subs = c.subcategories ?? [];
      expect(subs.length).toBeGreaterThanOrEqual(5); // ۴ تا ۷ + سایر
      expect(subs.length).toBeLessThanOrEqual(8);
      expect(subs[subs.length - 1]?.nameFa).toBe("سایر");
      const base = subs.slice(0, -1);
      expect(base.length).toBeGreaterThanOrEqual(4);
      expect(base.length).toBeLessThanOrEqual(7);
    }
  });

  test("همهٔ slug/idها سراسری یکتا هستند و id = slug", () => {
    const all = [...CATEGORIES.map((c) => c.id), ...ALL_SUBCATEGORY_IDS];
    expect(new Set(all).size).toBe(all.length);
    for (const c of CATEGORIES) {
      for (const s of c.subcategories ?? []) {
        expect(s.id).toBe(s.slug);
        expect(s.slug.startsWith(`${c.id}-`)).toBe(true);
      }
    }
  });

  test("زیرمجموعه فقط به یک دسته تعلق دارد و با helper پیدا می‌شود", () => {
    const s = subcategoryById("sneakers", "sneakers-sport");
    expect(s?.nameFa).toBe("کتونی اسپرت");
    expect(subcategoryById("plants", "sneakers-sport")).toBeUndefined();
    expect(subcategoriesOf("nonexistent")).toEqual([]);
    /* نقشهٔ sanitize با منبع واحد هم‌خوان است */
    expect(Object.keys(SUBCATEGORY_IDS_BY_CATEGORY).sort()).toEqual(
      CATEGORIES.map((c) => c.id).sort()
    );
  });
});
