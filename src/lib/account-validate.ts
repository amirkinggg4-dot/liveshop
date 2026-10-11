/* ─────────────────────────────────────────────────────────────
   LiveShop v1.9.0 — اعتبارسنجی موبایل و کدپستی سمت کلاینت (خالص)
   ─ normalizePhoneFa: آینهٔ normalizePhone سرور (src/lib/server/otp.ts)
     ولی بدون throw — ورودی نامعتبر → null
     (ارقام فارسی/عربی → لاتین، حذف فاصله/تیره/پرانتز،
      پسوندهای +98/0098/989 → 0، خروجی فقط «09xxxxxxxxx»)
   ─ validatePostalCodeFa: ۱۰ رقم، شروع با ۱ تا ۹، همهٔ رقم‌ها یکسان
     نیست — پیام‌های فارسی دقیق برای هر قاعده
   ─ validateRequiredFa: فیلدهای اجباری فرم آدرس

   هیچ importی از src/lib/server ندارد — فقط latinDigits از fa-number.
   ───────────────────────────────────────────────────────────── */

import { latinDigits } from "@/lib/fa-number";

/* ── موبایل ── */

/** نرمال‌سازی شمارهٔ موبایل فارسی/عربی/لاتین → «09xxxxxxxxx» یا null
    (آینهٔ سرور؛ ورودی کاربر با هر ارقامی پذیرفته می‌شود) */
export function normalizePhoneFa(input: string): string | null {
  let p = latinDigits(input).replace(/[\s\-().]/g, "");
  if (/^\+98/.test(p)) p = `0${p.slice(3)}`;
  else if (/^0098/.test(p)) p = `0${p.slice(4)}`;
  else if (/^989\d{9}$/.test(p)) p = `0${p.slice(2)}`;
  if (!/^09\d{9}$/.test(p)) return null;
  return p;
}

export type PhoneValidation =
  | { ok: true; phone: string }
  | { ok: false; message: string };

/** پیام واحد شمارهٔ نامعتبر — تک منبع برای UI */
export const PHONE_INVALID_MESSAGE =
  "شمارهٔ موبایل معتبر نیست؛ نمونهٔ صحیح: ۰۹۱۲۱۲۳۴۵۶۷";

/** اعتبارسنجی موبایل با پیام فارسی — خروجی نرمال ۰۹xxxxxxxxx */
export function validatePhoneFa(input: string): PhoneValidation {
  const phone = normalizePhoneFa(input);
  if (phone === null) {
    return { ok: false, message: PHONE_INVALID_MESSAGE };
  }
  return { ok: true, phone };
}

/* ── کدپستی ── */

export type PostalValidation =
  | { ok: true; postalCode: string }
  | { ok: false; message: string };

/** کدپستی ایران: دقیقاً ۱۰ رقم بعد از نرمال‌سازی ارقام فارسی؛
    رقم اول ۱ تا ۹ (شروع با صفر نامعتبر)؛ همهٔ رقم‌ها یکسان نامعتبر.
    فاصله و تیرهٔ داخل ورودی نادیده گرفته می‌شود؛ حروف/نویسهٔ دیگر رد. */
export function validatePostalCodeFa(input: string): PostalValidation {
  const cleaned = latinDigits(input).replace(/[\s\-()]/g, "");
  /* حروف یا نویسهٔ غیررقمی */
  if (/\D/.test(cleaned)) {
    return { ok: false, message: "کدپستی معتبر نیست" };
  }
  /* طول — خالی/کوتاه/بلند همه با همین پیام */
  if (cleaned.length !== 10) {
    return { ok: false, message: "کدپستی باید ۱۰ رقم باشد" };
  }
  /* شروع با صفر نامعتبر است */
  if (cleaned[0] === "0") {
    return { ok: false, message: "کدپستی نمی‌تواند با صفر شروع شود" };
  }
  /* همهٔ رقم‌ها یکسان (۱۱۱۱۱۱۱۱۱۱ و …) */
  if (/^(\d)\1{9}$/.test(cleaned)) {
    return { ok: false, message: "کدپستی معتبر نیست" };
  }
  return { ok: true, postalCode: cleaned };
}

/* ── فیلد اجباری فرم آدرس ── */

export type RequiredValidation =
  | { ok: true; value: string }
  | { ok: false; message: string };

/** مقدار اجباری — خالی/فقط فاصله → پیام «{label} را وارد کن»؛
    مقدار پرشده با trim برگردانده می‌شود */
export function validateRequiredFa(value: string, label: string): RequiredValidation {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, message: `${label} را وارد کن` };
  }
  return { ok: true, value: trimmed };
}
