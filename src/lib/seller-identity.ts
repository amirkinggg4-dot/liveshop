/* ─────────────────────────────────────────────────────────────
   v2.0.4 — تعریف داده و اعتبارسنجی فیلدهای هویت ثبت‌نام فروشنده
   (منبع مرحلهٔ ۵ — طراحی صفحهٔ مرحلهٔ ۵ بعداً انجام می‌شود)

   بسته به نوع فروشنده (مرحلهٔ ۳) دو مجموعهٔ فیلد داریم:
   ─ حقیقی (individual): نام، نام خانوادگی، کد ملی (همان
     اعتبارسنجی موجود validateNationalId)، شبا به نام خود.
   ─ حقوقی (business): نام شرکت، شناسهٔ ملی شرکت (فقط ۱۱ رقم —
     فرمول رسمی رقم کنترل حدس زده نشده؛ TODO)، کد اقتصادی
     (فقط ارقام، طول انعطاف‌پذیر)، شمارهٔ ثبت (فقط ارقام)،
     کد ملی نماینده (همان اعتبارسنجی کد ملی)، شبا به نام شرکت،
     عکس مدرک (آگهی تأسیس/مجوز — placeholder).

   همهٔ توابع خالص‌اند (بدون استور/React) و تست واحد دارند
   (seller-identity.test.ts).
   هر validate: (raw) → { ok: true, normalized } | { ok: false, error }
   — همان قرارداد seller-validate.ts؛ کد ملی/شبا از همان‌جا
   استفاده می‌شوند و مقدار کاملشان هرگز لاگ/toast نمی‌شود.
   ───────────────────────────────────────────────────────────── */

import {
  latinDigits,
  validateNationalId,
  validateSheba,
  type ValidateResult,
} from "./seller-validate";
import { faNum } from "./format";

/** نوع فروشنده — هم‌ارز enum SellerType سمت سرور (INDIVIDUAL/BUSINESS) */
export type SellerType = "individual" | "business";

/** برچسب فارسی نوع فروشنده — برای کارت خلاصه و صفحات بعدی */
export const SELLER_TYPE_LABEL: Record<SellerType, string> = {
  individual: "شخص حقیقی",
  business: "شخص حقوقی (کسب‌وکار ثبت‌شده)",
};

/* ── فیلدهای هر نوع ── */

export interface IndividualIdentityDraft {
  firstName: string;
  lastName: string;
  /** کد ملی ۱۰ رقمی با رقم کنترل — اعتبارسنجی موجود */
  nationalCode: string;
  /** شبا به نام خودِ فرد */
  sheba: string;
}

export interface BusinessIdentityDraft {
  companyName: string;
  /** شناسهٔ ملی شرکت — فقط ۱۱ رقم؛ فرمول رسمی هنوز پیاده نشده (TODO پایین) */
  companyNationalId: string;
  /** کد اقتصادی — فقط ارقام، طول انعطاف‌پذیر */
  economicCode: string;
  /** شمارهٔ ثبت شرکت — فقط ارقام */
  registrationNumber: string;
  /** کد ملی نمایندهٔ قانونی — همان اعتبارسنجی کد ملی اشخاص */
  representativeNationalCode: string;
  /** شبا به نام شرکت */
  sheba: string;
  /** عکس مدرک (آگهی تأسیس/مجوز) — فقط placeholder (دمو) */
  documentPhotoAccepted: boolean;
}

export type IdentityDraft =
  | { type: "individual"; individual: IndividualIdentityDraft }
  | { type: "business"; business: BusinessIdentityDraft };

/* ── برچسب فیلدها — برای هشدار پاک‌شدن و فرم مرحلهٔ ۵ ── */

export const INDIVIDUAL_IDENTITY_FIELD_LABELS: Readonly<
  Record<keyof IndividualIdentityDraft, string>
> = {
  firstName: "نام",
  lastName: "نام خانوادگی",
  nationalCode: "کد ملی",
  sheba: "شماره شبا",
};

export const BUSINESS_IDENTITY_FIELD_LABELS: Readonly<
  Record<keyof BusinessIdentityDraft, string>
> = {
  companyName: "نام شرکت",
  companyNationalId: "شناسهٔ ملی شرکت",
  economicCode: "کد اقتصادی",
  registrationNumber: "شمارهٔ ثبت",
  representativeNationalCode: "کد ملی نماینده",
  sheba: "شماره شبا",
  documentPhotoAccepted: "عکس مدرک شرکت",
};

/* ── draft خالی ── */

export function emptyIndividualIdentity(): IndividualIdentityDraft {
  return { firstName: "", lastName: "", nationalCode: "", sheba: "" };
}

export function emptyBusinessIdentity(): BusinessIdentityDraft {
  return {
    companyName: "",
    companyNationalId: "",
    economicCode: "",
    registrationNumber: "",
    representativeNationalCode: "",
    sheba: "",
    documentPhotoAccepted: false,
  };
}

/* ── اعتبارسنجی فیلدهای متنی مشترک (نام/نام شرکت) ── */

/** نام/نام خانوادگی/نام شرکت: حداقل ۲ حرف، حداکثر ۶۰ */
export function validateIdentityName(raw: string): ValidateResult {
  const v = raw.trim().replace(/\s+/g, " ");
  if (v.length < 2)
    return { ok: false, error: "این فیلد حداقل ۲ حرف است" };
  if (v.length > 60)
    return { ok: false, error: "این فیلد حداکثر ۶۰ حرف است" };
  return { ok: true, normalized: v };
}

/* ── اعتبارسنجی انعطاف‌پذیر «فقط ارقام» ──
   جداکننده‌های بی‌اثر (فاصله/خط تیره/نقطه/ویرگول/نیم‌فاصله) پاک
   می‌شوند ولی حرف یا نماد دیگر خطاست (نه پاک‌شدن خاموش). */
function flexibleDigits(
  raw: string,
  min: number,
  max: number,
  label: string
): ValidateResult {
  const v = latinDigits(raw).replace(/[\s\-–—.،,\u200c]/g, "");
  if (v.length === 0)
    return { ok: false, error: `${label} را وارد کن (فقط ارقام)` };
  if (!/^\d+$/.test(v))
    return { ok: false, error: `${label} فقط باید رقم باشد` };
  if (v.length < min)
    return {
      ok: false,
      error:
        min === max
          ? `${label} باید ${faNum(min)} رقم باشد`
          : `${label} حداقل ${faNum(min)} رقم است`,
    };
  if (v.length > max)
    return { ok: false, error: `${label} حداکثر ${faNum(max)} رقم است` };
  return { ok: true, normalized: v };
}

/* ── شناسهٔ ملی شرکت: فعلاً فقط «دقیقاً ۱۱ رقم» ──
   TODO(v2.1+): فرمول رسمی رقم کنترل شناسهٔ ملی اشخاص حقوقی
   پیاده‌سازی شود — عمداً حدس زده نشده تا اعتبارسنجی غلط مستند نشود. */
export function validateCompanyNationalId(raw: string): ValidateResult {
  const r = flexibleDigits(raw, 11, 11, "شناسهٔ ملی شرکت");
  if (r.ok) return r;
  /* همهٔ حالت‌های خطا (خالی/حرف/طول ≠ ۱۱) با یک پیام دقیق ۱۱رقمی */
  return { ok: false, error: "شناسهٔ ملی شرکت باید ۱۱ رقم باشد" };
}

/* ── کد اقتصادی: فقط ارقام، طول انعطاف‌پذیر (۱ تا ۱۶ رقم) ── */
export function validateEconomicCode(raw: string): ValidateResult {
  return flexibleDigits(raw, 1, 16, "کد اقتصادی");
}

/* ── شمارهٔ ثبت شرکت: فقط ارقام، طول انعطاف‌پذیر (۱ تا ۱۰ رقم) ── */
export function validateRegistrationNumber(raw: string): ValidateResult {
  return flexibleDigits(raw, 1, 10, "شمارهٔ ثبت");
}

/* ── بستهٔ خطای هر فیلد: کلید فیلد → پیام خطا (خطا = null یعنی سالم) ── */

export type IndividualIdentityErrors = Partial<
  Record<keyof IndividualIdentityDraft, string>
>;
export type BusinessIdentityErrors = Partial<
  Record<keyof BusinessIdentityDraft, string>
>;

export function validateIndividualIdentity(
  d: IndividualIdentityDraft
): IndividualIdentityErrors {
  const errors: IndividualIdentityErrors = {};
  const name = validateIdentityName(d.firstName);
  if (!name.ok) errors.firstName = name.error;
  const family = validateIdentityName(d.lastName);
  if (!family.ok) errors.lastName = family.error;
  const nid = validateNationalId(d.nationalCode);
  if (!nid.ok) errors.nationalCode = nid.error;
  const sheba = validateSheba(d.sheba);
  if (!sheba.ok) errors.sheba = sheba.error;
  return errors;
}

export function validateBusinessIdentity(
  d: BusinessIdentityDraft
): BusinessIdentityErrors {
  const errors: BusinessIdentityErrors = {};
  const company = validateIdentityName(d.companyName);
  if (!company.ok) errors.companyName = company.error;
  const cid = validateCompanyNationalId(d.companyNationalId);
  if (!cid.ok) errors.companyNationalId = cid.error;
  const eco = validateEconomicCode(d.economicCode);
  if (!eco.ok) errors.economicCode = eco.error;
  const reg = validateRegistrationNumber(d.registrationNumber);
  if (!reg.ok) errors.registrationNumber = reg.error;
  const rep = validateNationalId(d.representativeNationalCode);
  if (!rep.ok) errors.representativeNationalCode = rep.error;
  const sheba = validateSheba(d.sheba);
  if (!sheba.ok) errors.sheba = sheba.error;
  if (!d.documentPhotoAccepted)
    errors.documentPhotoAccepted = "عکس مدرک شرکت (آگهی تأسیس/مجوز) لازم است";
  return errors;
}

export function isIndividualIdentityComplete(
  d: IndividualIdentityDraft
): boolean {
  return Object.keys(validateIndividualIdentity(d)).length === 0;
}

export function isBusinessIdentityComplete(d: BusinessIdentityDraft): boolean {
  return Object.keys(validateBusinessIdentity(d)).length === 0;
}

/* ── تغییر نوع فروشنده → پاک‌کردن فیلدهای ناسازگار ──
   دو مجموعهٔ فیلد کاملاً جدایند و شبا هم در هر نوع به نام متفاوتی است
   (خودِ فرد در برابر شرکت)؛ پس با تغییر نوع، draft هویت به یک draft
   خالی از نوع جدید تبدیل می‌شود و فیلدهای پرشدهٔ قبلی برای هشدار
   (در UI) فهرست برمی‌گردند. */

export interface IdentityTypeChangeResult {
  /** draft جدید (از نوع جدید) — null اگر ورودی هم null بود */
  next: IdentityDraft | null;
  /** برچسب فارسی فیلدهای پرشدهٔ قبلی که پاک شدند (برای هشدار) */
  clearedFields: string[];
}

export function clearIncompatibleIdentity(
  current: IdentityDraft | null,
  nextType: SellerType
): IdentityTypeChangeResult {
  if (!current) return { next: null, clearedFields: [] };
  if (current.type === nextType) return { next: current, clearedFields: [] };

  const clearedFields: string[] =
    current.type === "individual"
      ? ([
          "firstName",
          "lastName",
          "nationalCode",
          "sheba",
        ] as const)
          .filter((k) => current.individual[k].trim() !== "")
          .map((k) => INDIVIDUAL_IDENTITY_FIELD_LABELS[k])
      : ([
          "companyName",
          "companyNationalId",
          "economicCode",
          "registrationNumber",
          "representativeNationalCode",
          "sheba",
        ] as const)
          .filter((k) => current.business[k].trim() !== "")
          .map((k) => BUSINESS_IDENTITY_FIELD_LABELS[k])
          .concat(
            current.business.documentPhotoAccepted
              ? [BUSINESS_IDENTITY_FIELD_LABELS.documentPhotoAccepted]
              : []
          );

  return {
    next:
      nextType === "individual"
        ? { type: "individual", individual: emptyIndividualIdentity() }
        : { type: "business", business: emptyBusinessIdentity() },
    clearedFields,
  };
}

/** پیام هشدار تغییر نوع — در UI با toast.warning نمایش داده می‌شود */
export function identityChangeWarningMessage(
  clearedFields: readonly string[]
): string {
  return `با تغییر نوع فروشنده، این فیلدهای مرحلهٔ هویت پاک شدند: ${clearedFields.join("، ")}`;
}

/* ── پاک‌سازی draft هویت ذخیره‌شده (sessionStorage) ──
   تحمل مقدار ناقص/خراب: هر فیلد غیرمعتبر دور ریخته می‌شود (نه کل draft)
   تا یک نشست قدیمی کل پیشرفت را خراب نکند. */

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function sanitizeIdentityDraft(raw: unknown): IdentityDraft | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const src = raw as Record<string, unknown>;
  if (src.type === "individual" && typeof src.individual === "object" && src.individual !== null) {
    const i = src.individual as Record<string, unknown>;
    return {
      type: "individual",
      individual: {
        firstName: asString(i.firstName),
        lastName: asString(i.lastName),
        nationalCode: asString(i.nationalCode),
        sheba: asString(i.sheba),
      },
    };
  }
  if (src.type === "business" && typeof src.business === "object" && src.business !== null) {
    const b = src.business as Record<string, unknown>;
    return {
      type: "business",
      business: {
        companyName: asString(b.companyName),
        companyNationalId: asString(b.companyNationalId),
        economicCode: asString(b.economicCode),
        registrationNumber: asString(b.registrationNumber),
        representativeNationalCode: asString(b.representativeNationalCode),
        sheba: asString(b.sheba),
        documentPhotoAccepted: b.documentPhotoAccepted === true,
      },
    };
  }
  return null;
}
