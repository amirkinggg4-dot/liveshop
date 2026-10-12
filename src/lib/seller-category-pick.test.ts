/* ─────────────────────────────────────────────────────────────
   تست‌های واحد v2.0.2 — منطق انتخاب دستهٔ ثبت‌نام فروشنده
   (src/lib/seller-category-pick.ts) — تابع خالص، بدون استور.
   پوشش: سقف ۳ انتخاب، «اصلی» = اولی، حذف و جابه‌جایی اصلی،
   حذف انتخاب غیراصلی، toggle دوباره، پاک‌سازی draft.
   ───────────────────────────────────────────────────────────── */

import { describe, expect, test } from "bun:test";
import {
  MAX_CATEGORIES_MESSAGE,
  MAX_SELLER_CATEGORIES,
  primarySellerCategory,
  sanitizeCategoryDraft,
  toggleSellerCategory,
} from "./seller-category-pick";
import { CATEGORY_IDS } from "./data/categories";

describe("toggleSellerCategory — سقف ۳ دسته", () => {
  test("انتخاب تا ۳ دسته مجاز است و ترتیب انتخاب حفظ می‌شود", () => {
    let list: string[] = [];
    for (const id of ["a", "b", "c"]) {
      const r = toggleSellerCategory(list, id);
      expect(r.ok).toBe(true);
      if (r.ok) list = r.selected;
    }
    expect(list).toEqual(["a", "b", "c"]);
    expect(list).toHaveLength(MAX_SELLER_CATEGORIES);
  });

  test("انتخاب چهارم رد می‌شود — فهرست بدون تغییر و پیام «حداکثر ۳ دسته»", () => {
    const list = ["a", "b", "c"];
    const r = toggleSellerCategory(list, "d");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("max");
      expect(r.message).toBe(MAX_CATEGORIES_MESSAGE);
      expect(r.message).toBe("حداکثر ۳ دسته");
    }
    /* فهرست اصلی هم mute نشده و خروجی همان قبلی است */
    expect(list).toEqual(["a", "b", "c"]);
    expect(r.selected).toEqual(["a", "b", "c"]);
    /* بعد از رد، حذف یک عضو دوباره جا باز می‌کند */
    const afterRemove = toggleSellerCategory(list, "a");
    expect(afterRemove.ok).toBe(true);
    if (afterRemove.ok) {
      const reAdd = toggleSellerCategory(afterRemove.selected, "d");
      expect(reAdd.ok).toBe(true);
      if (reAdd.ok) expect(reAdd.selected).toEqual(["b", "c", "d"]);
    }
  });
});

describe("primarySellerCategory — «اصلی» = نخستین انتخاب", () => {
  test("اولین دستهٔ انتخاب‌شده اصلی است", () => {
    expect(primarySellerCategory(["a"])).toBe("a");
    expect(primarySellerCategory(["a", "b", "c"])).toBe("a");
  });

  test("با حذف اصلی، دستهٔ بعدی اصلی می‌شود (جابه‌جایی)", () => {
    let list: string[] = [];
    for (const id of ["a", "b", "c"]) {
      const r = toggleSellerCategory(list, id);
      if (r.ok) list = r.selected;
    }
    expect(primarySellerCategory(list)).toBe("a");
    const r = toggleSellerCategory(list, "a"); // حذف اصلی
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.selected).toEqual(["b", "c"]);
      expect(primarySellerCategory(r.selected)).toBe("b");
    }
  });

  test("حذف انتخاب غیراصلی، اصلی را جابه‌جا نمی‌کند", () => {
    const list = ["a", "b", "c"];
    const r = toggleSellerCategory(list, "c");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.selected).toEqual(["a", "b"]);
      expect(primarySellerCategory(r.selected)).toBe("a");
    }
  });

  test("فهرست خالی اصلی ندارد (null)", () => {
    expect(primarySellerCategory([])).toBe(null);
    const r = toggleSellerCategory(["a"], "a"); // حذف تنها عضو
    expect(r.ok).toBe(true);
    if (r.ok) expect(primarySellerCategory(r.selected)).toBe(null);
  });
});

describe("toggleSellerCategory — حذف با لمس دوباره", () => {
  test("لمس دوبارهٔ عضو انتخاب‌شده آن را حذف می‌کند (بدون تغییر بقیه)", () => {
    const r = toggleSellerCategory(["a", "b", "c"], "b");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.selected).toEqual(["a", "c"]);
  });

  test("toggle دوبارهٔ همان دسته = بازگشت به فهرست اول (no-op کامل)", () => {
    let list: string[] = [];
    const r1 = toggleSellerCategory(list, "a");
    if (r1.ok) list = r1.selected;
    const r2 = toggleSellerCategory(list, "a");
    if (r2.ok) list = r2.selected;
    const r3 = toggleSellerCategory(list, "a");
    if (r3.ok) list = r3.selected;
    expect(list).toEqual(["a"]);
  });

  test("عضو تکراری به فهرست اضافه نمی‌شود", () => {
    const r = toggleSellerCategory(["a", "b"], "a");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.selected).toEqual(["b"]);
  });
});

describe("sanitizeCategoryDraft — پاک‌سازی draft ذخیره‌شده", () => {
  test("شناسه‌های ناشناس، تکراری‌ها و عضو هفتم حذف و سقف ۳ رعایت می‌شود", () => {
    const raw = ["sneakers", "junk", "sneakers", "plants", "cards", "tech"];
    expect(sanitizeCategoryDraft(raw, CATEGORY_IDS)).toEqual([
      "sneakers",
      "plants",
      "cards",
    ]);
  });

  test("خالی/نامعتبر → null (یعنی هنوز انتخابی ثبت نشده)", () => {
    expect(sanitizeCategoryDraft(null, CATEGORY_IDS)).toBe(null);
    expect(sanitizeCategoryDraft([], CATEGORY_IDS)).toBe(null);
    expect(sanitizeCategoryDraft(["junk", 42], CATEGORY_IDS)).toBe(null);
    expect(sanitizeCategoryDraft("sneakers", CATEGORY_IDS)).toBe(null);
  });

  test("draft معتبر دست‌نخورده عبور می‌کند", () => {
    expect(sanitizeCategoryDraft(["books", "art"], CATEGORY_IDS)).toEqual([
      "books",
      "art",
    ]);
  });
});
