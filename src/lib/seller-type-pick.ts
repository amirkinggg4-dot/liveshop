/* ─────────────────────────────────────────────────────────────
   v2.0.4 — منطق خالص انتخاب نوع فروشنده (مرحلهٔ ۳ ثبت‌نام)
   صفحهٔ SellerTypePickView این توابع را مصرف می‌کند؛ همین توابع
   تست واحد دارند (seller-identity.test.ts).

   قواعد:
   ─ انتخاب تک‌گزینه‌ای: «individual» (شخص حقیقی) یا «business»
     (شخص حقوقی) — برخلاف دسته‌ها/زیرمجموعه‌ها سقف و ترکیب ندارد.
   ─ draft null یعنی هنوز چیزی انتخاب نشده؛ «بعدی» تا انتخاب
     غیرفعال است و لمسش کارت‌ها را با پیام SELLER_TYPE_REQUIRED_MESSAGE
     علامت می‌زند.
   ─ مقدار ذخیره‌شدهٔ نشست با sanitizeSellerTypeDraft پاک‌سازی
     می‌شود (هر چیز غیر از دو مقدار معتبر → null).
   نوع SellerType و فیلدهای هویت وابسته به آن در
   src/lib/seller-identity.ts تعریف شده‌اند (مرحلهٔ ۵ از آن استفاده
   می‌کند).
   ───────────────────────────────────────────────────────────── */

import type { SellerType } from "./seller-identity";

/** پیام خطای «هنوز انتخاب نشده» — دقیقاً طبق مشخصات */
export const SELLER_TYPE_REQUIRED_MESSAGE = "یکی را انتخاب کن";

/** مقدار draft نوع فروشنده — null = هنوز انتخاب نشده */
export type SellerTypeDraft = SellerType | null;

/**
 * پاک‌سازی مقدار ذخیره‌شدهٔ نوع فروشنده (از sessionStorage):
 * فقط دو رشتهٔ دقیق معتبرند؛ بقیه (null/عدد/آبجکت/رشتهٔ دیگر) → null.
 */
export function sanitizeSellerTypeDraft(raw: unknown): SellerTypeDraft {
  return raw === "individual" || raw === "business" ? raw : null;
}
