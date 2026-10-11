/* ─────────────────────────────────────────────────────────────
   v1.7.0 — اعتبارسنجی درخواست فروشندگی (بخش ۶ قرارداد API)
   ─ کد ملی ۱۰ رقمی با رقم کنترل (الگوریتم رسمی)
   ─ شِبا IR + ۲۴ رقم با چک‌سام mod-97 (ISO 13616)
   ─ slug فروشگاه (لاتین/عدد/خط تیره)
   ─ ماسک برای نمایش و toast — کد ملی و شبا هرگز کامل نمایش داده
     نمی‌شوند و در هیچ toast یا لاگی مقدار کاملشان می‌رود.
   هر تابع: (raw) → { ok: true, normalized } | { ok: false, error }
   ───────────────────────────────────────────────────────────── */

export type ValidateResult =
  | { ok: true; normalized: string }
  | { ok: false; error: string };

/** ارقام فارسی/عربی → لاتین */
export function latinDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/* ── کد ملی ایران: ۱۰ رقم، رقم دهم از الگوریتم وزن ۲..۱۰ ── */
export function validateNationalId(raw: string): ValidateResult {
  const v = latinDigits(raw).replace(/\D/g, "");
  if (v.length !== 10) return { ok: false, error: "کد ملی باید ۱۰ رقم باشد" };
  if (/^(\d)\1{9}$/.test(v))
    return { ok: false, error: "کد ملی نمی‌تواند همهٔ ارقامش یکی باشد" };

  const check = Number(v[9]);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(v[i]) * (10 - i);
  const rem = sum % 11;

  const valid = rem < 2 ? check === rem : check === 11 - rem;
  return valid
    ? { ok: true, normalized: v }
    : { ok: false, error: "کد ملی معتبر نیست (رقم کنترل)" };
}

/* ── شِبا: IR + ۲۴ رقم — چک‌سام mod-97 طبق ISO 13616 ──
   الگوریتم: IRxx + ۲۲ رقم BBAN → «۲۲ رقم + I→18 R→27 + xx» و mod97 == 1 */
export function validateSheba(raw: string): ValidateResult {
  const upper = latinDigits(raw).toUpperCase().replace(/[\s-]+/g, "");
  if (!upper.startsWith("IR"))
    return { ok: false, error: "شبا باید با IR شروع شود" };
  const digits = upper.slice(2);
  if (!/^\d{24}$/.test(digits))
    return { ok: false, error: "بعد از IR باید ۲۴ رقم بیاید" };

  const check = digits.slice(0, 2);
  const bban = digits.slice(2); // ۲۲ رقم
  const rearranged = bban + "1827" + check;
  let remainder = 0;
  for (const ch of rearranged) {
    remainder = (remainder * 10 + Number(ch)) % 97;
  }
  return remainder === 1
    ? { ok: true, normalized: "IR" + digits }
    : { ok: false, error: "شماره شبا معتبر نیست (mod-97)" };
}

/* ── شناسهٔ فروشگاه: a-z0-9 و خط تیره، ۳..۳۰ کاراکتر ── */
export function validateSlug(raw: string): ValidateResult {
  const v = raw.trim().toLowerCase();
  if (v.length < 3) return { ok: false, error: "شناسه حداقل ۳ حرف است" };
  if (v.length > 30) return { ok: false, error: "شناسه حداکثر ۳۰ حرف است" };
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(v))
    return { ok: false, error: "شناسه فقط حرف لاتین، عدد و خط تیره است" };
  return { ok: true, normalized: v };
}

/* ── ماسک — هیچ جایی مقدار کامل را نشان نمی‌دهد ── */
/** کد ملی → ***۱۲۳۴۵۶۷**  (۴ رقم آخر؛ حتی ماسک هم برچسب‌دار است) */
export function maskNationalId(raw: string): string {
  const v = latinDigits(raw).replace(/\D/g, "");
  if (v.length !== 10) return "••••••••••";
  return `••••${v.slice(6)}`;
}

/** شبا → IR•••• •••• ••4567 (۴ رقم آخر) */
export function maskSheba(raw: string): string {
  const v = latinDigits(raw).toUpperCase().replace(/\s+/g, "");
  if (!/^IR\d{24}$/.test(v)) return "IR •••• •••• ••••";
  return `IR •••• •••• ••${v.slice(-4)}`;
}
