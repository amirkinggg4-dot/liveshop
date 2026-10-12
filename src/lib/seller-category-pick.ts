/* ─────────────────────────────────────────────────────────────
   v2.0.2 — منطق خالص انتخاب دسته‌های فروشنده (مرحلهٔ ۲ ثبت‌نام)
   صفحهٔ SellerCategoryPickView این توابع را مصرف می‌کند؛ همین
   توابع تست واحد دارند (seller-category-pick.test.ts).

   قواعد:
   ─ حداکثر ۳ دسته؛ انتخاب چهارم رد می‌شود (فهرست دست‌نخورده).
   ─ ترتیب انتخاب حفظ می‌شود؛ «دستهٔ اصلی» همیشه نخستین عضو است
     (primarySellerCategory) — با حذف اولی، بعدی اصلی می‌شود.
   ─ لمس دوبارهٔ یک دستهٔ انتخاب‌شده = حذف آن از فهرست.
   ───────────────────────────────────────────────────────────── */

/** سقف انتخاب دسته در ثبت‌نام فروشنده */
export const MAX_SELLER_CATEGORIES = 3;

/** پیام toast انتخاب چهارم — دقیقاً طبق مشخصات */
export const MAX_CATEGORIES_MESSAGE = "حداکثر ۳ دسته";

export type CategoryToggleResult =
  | { ok: true; selected: string[] }
  | { ok: false; reason: "max"; selected: string[]; message: string };

/**
 * toggle یک دسته در فهرست انتخاب‌ها:
 * ─ اگر انتخاب‌شده بود → حذف (خروجی ok با فهرست جدید)
 * ─ اگر نبود و سقف پر بود → رد با reason "max" و فهرست بدون تغییر
 * ─ اگر نبود و جا بود → افزودن به انتها (ترتیب انتخاب حفظ می‌شود)
 * تابع خالص است — هیچ state بیرونی نمی‌خواند و ورودی را mute نمی‌کند.
 */
export function toggleSellerCategory(
  selected: readonly string[],
  id: string
): CategoryToggleResult {
  if (selected.includes(id)) {
    return { ok: true, selected: selected.filter((c) => c !== id) };
  }
  if (selected.length >= MAX_SELLER_CATEGORIES) {
    return {
      ok: false,
      reason: "max",
      selected: [...selected],
      message: MAX_CATEGORIES_MESSAGE,
    };
  }
  return { ok: true, selected: [...selected, id] };
}

/** دستهٔ اصلی = نخستین انتخاب (null اگر هیچ انتخابی نیست) */
export function primarySellerCategory(
  selected: readonly string[]
): string | null {
  return selected.length > 0 ? selected[0] : null;
}

/**
 * پاک‌سازی draft ذخیره‌شده (از sessionStorage) — فقط شناسه‌های معتبر،
 * بدون تکرار و حداکثر ۳ عضو؛ خالی → null (یعنی انتخابی ثبت نشده).
 */
export function sanitizeCategoryDraft(
  raw: unknown,
  validIds: readonly string[]
): string[] | null {
  if (!Array.isArray(raw)) return null;
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item === "string" && validIds.includes(item) && !seen.has(item)) {
      seen.add(item);
      if (seen.size >= MAX_SELLER_CATEGORIES) break;
    }
  }
  const list = [...seen];
  return list.length > 0 ? list : null;
}
