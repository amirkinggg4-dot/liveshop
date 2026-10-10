/* ─────────────────────────────────────────────────────────────
   v1.6.2 — نرمال‌سازی متن فارسی برای جستجوی کاوش
   ─ ی/ي (و ی‌های عربی) → ی
   ─ ك عربی → ک
   ─ ارقام فارسی (۰-۹) و عربی (٠-٩) → لاتین
   ─ حذف نیم‌فاصله و اعراب — مقایسهٔ بدون حساسیت به بزرگ/کوچکی
   مصرف‌کننده: useSearch (mock) و تست‌ها
   ───────────────────────────────────────────────────────────── */

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** یکدست‌سازی حروف و ارقام فارسی/عربی برای مقایسه */
export function normalizeFa(input: string): string {
  return input
    .replace(/[يىѐﻯﻰﻲ]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ۀة]/g, "ه")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    /* نیم‌فاصله + اعراب و علامت‌های کشیدگی */
    .replace(/[\u200c\u064b-\u0652\u0640\u0670]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** حاوی‌بودن بدون حساسیت به ی/ي، ک/ك و ارقام فارسی/لاتین */
export function faIncludes(haystack: string, needle: string): boolean {
  const n = normalizeFa(needle);
  if (n.length === 0) return false;
  return normalizeFa(haystack).includes(n);
}

/** دو متن فارسی را بدون حساسیت برابر می‌گیرد (برای dedupe جستجوهای اخیر) */
export function faEquals(a: string, b: string): boolean {
  const na = normalizeFa(a);
  return na.length > 0 && na === normalizeFa(b);
}
