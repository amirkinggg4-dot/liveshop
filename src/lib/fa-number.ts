/* ─────────────────────────────────────────────────────────────
   v1.7.0 — ورودی عددی فارسی (قیمت/موجودی/وزن)
   ─ digitsOnlyFa: هر ورودی → فقط رقوم لاتین (ارقام فارسی/عربی هم
     پذیرفته می‌شوند؛ بقیهٔ کاراکترها حذف)
   ─ formatFaThousands: 6500000 → «۶٬۵۰۰٬۰۰۰» (جداکنندهٔ ٬ + ارقام فارسی)
   ─ parseFaInt: «۶٬۵۰۰٬۰۰۰ abc» → 6500000 (مقدار ذخیره‌شده عدد صحیح)
   ───────────────────────────────────────────────────────────── */

/** ارقام فارسی/عربی → لاتین */
export function latinDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** فقط رقم — هر کاراکتر دیگری حذف می‌شود (ورودی امن برای فیلدهای عددی) */
export function digitsOnlyFa(raw: string): string {
  return latinDigits(raw).replace(/\D/g, "");
}

/** صحیح نامنفی از ورودی آزاد — «۶٬۵۰۰٬۰۰۰ تومان» → 6500000 */
export function parseFaInt(raw: string): number {
  const digits = digitsOnlyFa(raw);
  if (!digits) return 0;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;
const SEP = "٬";

/** عدد → «۶٬۵۰۰٬۰۰۰» با ارقام فارسی و جداکنندهٔ هزارگان */
export function formatFaThousands(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return FA_DIGITS[0];
  const s = Math.floor(n).toString();
  const grouped = s.replace(/\B(?=(\d{3})+(?!\d))/g, SEP);
  return grouped.replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}
