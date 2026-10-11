/* ─────────────────────────────────────────────────────────────
   نرمال‌سازی متن فارسی برای جستجو — v1.6.3
   پیاده‌سازی به src/lib/normalize.ts منتقل شد (ماژول مشترک UI/سرور/seed)
   تا سرور و کلاینت از «یک تابع» استفاده کنند؛ این فایل فقط re-export
   می‌کند تا importهای موجود نشکنند.
   ───────────────────────────────────────────────────────────── */

import { normalizeFa } from "./normalize";

export { normalizeFa };

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
