/* ─────────────────────────────────────────────────────────────
   v2.0.3 — منطق خالص انتخاب زیرمجموعه‌ها (مرحلهٔ ۲ ثبت‌نام فروشنده)
   صفحهٔ SellerSubcategoryPickView این توابع را مصرف می‌کند؛ همین
   توابع تست واحد دارند (seller-subcategory-pick.test.ts).

   قواعد:
   ─ انتخاب چندتایی «بدون سقف» (برخلاف دسته‌ها که سقف ۳ دارند).
   ─ دکمهٔ «بعدی» تا وقتی هر دستهٔ انتخاب‌شده حداقل یک زیرمجموعه
     ندارد غیرفعال است؛ لمس دکمهٔ غیرفعال، بخش‌های ناقص را با پیام
     SUBCATEGORY_REQUIRED_MESSAGE علامت می‌زند.
   ─ همگام با مرحلهٔ دسته: با حذف یک دسته در مرحلهٔ ۱، زیرمجموعه‌هایش
     از draft پاک می‌شود؛ با افزودن دستهٔ جدید، بخش خالی می‌آید.
   ─ draft به‌صورت {categoryId: string[]} نگه داشته می‌شود (ترتیب
     لمس حفظ می‌شود؛ خالی بودن آرایه = بخش موجود ولی چیزی انتخاب
     نشده).
   ───────────────────────────────────────────────────────────── */

/** پیام خطای بخش ناقص — دقیقاً طبق مشخصات */
export const SUBCATEGORY_REQUIRED_MESSAGE = "حداقل یک مورد انتخاب کن";

/** draft زیرمجموعه‌ها: id دسته → فهرست id زیرمجموعه‌های انتخابی */
export type SubcategoryDraft = Record<string, string[]>;

/**
 * کدام دسته‌های انتخاب‌شده هنوز هیچ زیرمجموعه‌ای ندارند؟
 * (فقط بین دسته‌های «انتخاب‌شده» چک می‌شود؛ کلیدهای اضافهٔ draft نادیده)
 */
export function missingSubcategories(
  draft: SubcategoryDraft,
  selected: readonly string[]
): string[] {
  return selected.filter((catId) => (draft[catId] ?? []).length < 1);
}

/** آیا می‌توان به مرحلهٔ بعد («شروع فروش») رفت؟ */
export function canContinueSubcategories(
  draft: SubcategoryDraft,
  selected: readonly string[]
): boolean {
  return missingSubcategories(draft, selected).length === 0;
}

/**
 * toggle یک زیرمجموعه در draft — تابع خالص؛ ورودی mute نمی‌شود.
 * انتخاب چندتایی بدون سقف؛ لمس دوباره = حذف از فهرست همان دسته.
 */
export function toggleSubcategoryInDraft(
  draft: SubcategoryDraft,
  catId: string,
  subId: string
): SubcategoryDraft {
  const current = draft[catId] ?? [];
  const next = current.includes(subId)
    ? current.filter((s) => s !== subId)
    : [...current, subId];
  return { ...draft, [catId]: next };
}

/**
 * همگام‌سازی draft با انتخاب دسته‌های مرحلهٔ ۱:
 * ─ دستهٔ حذف‌شده → کلیدش (زیرمجموعه‌هایش) از draft پاک می‌شود.
 * ─ دستهٔ تازه‌افزوده → کلید خالی می‌آید (بخش جدید خالی).
 * ─ ترتیب کلیدها همان ترتیب انتخاب دسته‌هاست (اصلی اول).
 */
export function syncSubcategoryDraft(
  draft: SubcategoryDraft,
  selected: readonly string[]
): SubcategoryDraft {
  const next: SubcategoryDraft = {};
  for (const catId of selected) {
    next[catId] = draft[catId] ?? [];
  }
  return next;
}

/**
 * پاک‌سازی draft ذخیره‌شده (از sessionStorage):
 * ─ raw باید آبجکت باشد (آرایه/null/… → null).
 * ─ کلید نامعتبر (دستهٔ حذف‌شده/ناشناس) دور ریخته می‌شود.
 * ─ مقدار غیرآرایه دور ریخته می‌شود؛ زیرمجموعهٔ نامعتبر یا زیرمجموعهٔ
 *   دستهٔ دیگر حذف و تکرارها فشرده می‌شوند.
 * ─ خروجی همیشه Record (ممکن است خالی) — null یعنی raw اصلاً شکلی نبود.
 */
export function sanitizeSubcategoryDraft(
  raw: unknown,
  validByCat: Readonly<Record<string, readonly string[]>>
): Record<string, string[]> | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const src = raw as Record<string, unknown>;
  const out: Record<string, string[]> = {};
  for (const [catId, value] of Object.entries(src)) {
    const valid = validByCat[catId];
    if (!valid || !Array.isArray(value)) continue;
    const seen = new Set<string>();
    for (const sub of value) {
      if (typeof sub === "string" && valid.includes(sub) && !seen.has(sub)) {
        seen.add(sub);
      }
    }
    out[catId] = [...seen];
  }
  return out;
}
