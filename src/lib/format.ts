const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;

/** تبدیل ارقام لاتین رشته/عدد به ارقام فارسی */
export function toFa(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** عدد با جداکنندهٔ هزارگان فارسی (۱٬۲۳۴٬۵۶۷) */
export function faNum(n: number): string {
  try {
    return n.toLocaleString("fa-IR");
  } catch {
    return toFa(n.toLocaleString("en-US"));
  }
}

/** مبلغ تومان با ارقام فارسی — toman(4800000) → «۴٬۸۰۰٬۰۰۰ تومان» */
export function toman(n: number, withUnit = true): string {
  const s = faNum(n);
  return withUnit ? `${s} تومان` : s;
}

/** v1.8.0 — مبلغ علامت‌دار امن در RTL
    علامت + / − با LRM (‎) از عدد جدا نمی‌شود و در متن راست‌به‌چپ
    سر جای درست می‌نشیند. در UI داخل <bdi> رندر می‌شود. */
export function signedToman(amount: number, withUnit = true): string {
  const sign = amount >= 0 ? "+" : "−";
  return `${sign}\u200E${toman(Math.abs(amount), withUnit)}`;
}

/** زمان mm:ss با ارقام فارسی — faClock(45) → «۰۰:۴۵» */
export function faClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${toFa(String(m).padStart(2, "0"))}:${toFa(String(r).padStart(2, "0"))}`;
}

/** خلاصه‌سازی تعداد — compactFa(12400) → «۱۲ هزار» */
export function compactFa(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    const txt = Number.isInteger(v) ? String(v) : v.toFixed(1);
    return `${toFa(txt)} میلیون`;
  }
  if (n >= 10_000) {
    return `${toFa(Math.round(n / 1000))} هزار`;
  }
  return faNum(n);
}
