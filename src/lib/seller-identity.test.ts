/* ─────────────────────────────────────────────────────────────
   تست‌های واحد v2.0.4 — مرحلهٔ ۳ ثبت‌نام فروشنده (نوع فروشنده)
   ۱) انتخاب: sanitizeSellerTypeDraft (انتخاب معتبر/نامعتبر)
   ۲) پاک‌شدن فیلدهای ناسازگار: clearIncompatibleIdentity با تغییر
      نوع (فیلدهای پرشدهٔ قبلی پاک و فهرست هشدار برمی‌گردد)
   ۳) validateهای هویت: فردی/حقوقی و فیلدهای مخصوص حقوقی
   (seller-identity.ts + seller-type-pick.ts — توابع خالص)
   ───────────────────────────────────────────────────────────── */

import { describe, expect, test } from "bun:test";
import {
  SELLER_TYPE_REQUIRED_MESSAGE,
  sanitizeSellerTypeDraft,
} from "./seller-type-pick";
import {
  BUSINESS_IDENTITY_FIELD_LABELS,
  INDIVIDUAL_IDENTITY_FIELD_LABELS,
  SELLER_TYPE_LABEL,
  clearIncompatibleIdentity,
  emptyBusinessIdentity,
  emptyIndividualIdentity,
  identityChangeWarningMessage,
  isBusinessIdentityComplete,
  isIndividualIdentityComplete,
  sanitizeIdentityDraft,
  validateBusinessIdentity,
  validateCompanyNationalId,
  validateEconomicCode,
  validateIndividualIdentity,
  validateRegistrationNumber,
  type IdentityDraft,
} from "./seller-identity";
import { validateNationalId } from "./seller-validate";

/* کد ملی/شبا معتبر نمونه — همان نمونه‌های تست‌شدهٔ seller-validate */
const VALID_NID = "0010515526";
const VALID_SHEBA = "IR580540105180021273113007";

describe("sanitizeSellerTypeDraft — انتخاب تک‌گزینه‌ای", () => {
  test("دو مقدار معتبر همان‌طور برمی‌گردند", () => {
    expect(sanitizeSellerTypeDraft("individual")).toBe("individual");
    expect(sanitizeSellerTypeDraft("business")).toBe("business");
  });

  test("هر چیز دیگری → null", () => {
    expect(sanitizeSellerTypeDraft(null)).toBeNull();
    expect(sanitizeSellerTypeDraft(undefined)).toBeNull();
    expect(sanitizeSellerTypeDraft("")).toBeNull();
    expect(sanitizeSellerTypeDraft("INDIVIDUAL")).toBeNull();
    expect(sanitizeSellerTypeDraft("company")).toBeNull();
    expect(sanitizeSellerTypeDraft(1)).toBeNull();
    expect(sanitizeSellerTypeDraft({})).toBeNull();
    expect(sanitizeSellerTypeDraft(["individual"])).toBeNull();
  });

  test("پیام «یکی را انتخاب کن» دقیقاً طبق مشخصات است", () => {
    expect(SELLER_TYPE_REQUIRED_MESSAGE).toBe("یکی را انتخاب کن");
  });

  test("برچسب فارسی هر نوع", () => {
    expect(SELLER_TYPE_LABEL.individual).toBe("شخص حقیقی");
    expect(SELLER_TYPE_LABEL.business).toBe("شخص حقوقی (کسب‌وکار ثبت‌شده)");
  });
});

describe("clearIncompatibleIdentity — پاک‌شدن فیلدهای ناسازگار با تغییر نوع", () => {
  test("draft خالی (null) → بدون تغییر و بدون هشدار", () => {
    const r = clearIncompatibleIdentity(null, "business");
    expect(r.next).toBeNull();
    expect(r.clearedFields).toEqual([]);
  });

  test("هم‌نوع بودن → همان draft برمی‌گردد (هیچ‌چیز پاک نمی‌شود)", () => {
    const draft: IdentityDraft = {
      type: "individual",
      individual: {
        firstName: "علی",
        lastName: "رضایی",
        nationalCode: VALID_NID,
        sheba: VALID_SHEBA,
      },
    };
    const r = clearIncompatibleIdentity(draft, "individual");
    expect(r.next).toBe(draft);
    expect(r.clearedFields).toEqual([]);
  });

  test("حقیقی → حقوقی: فیلدهای پرشدهٔ فردی پاک و draft خالی حقوقی می‌شود", () => {
    const draft: IdentityDraft = {
      type: "individual",
      individual: {
        firstName: "علی",
        lastName: "",
        nationalCode: VALID_NID,
        sheba: VALID_SHEBA,
      },
    };
    const r = clearIncompatibleIdentity(draft, "business");
    expect(r.next?.type).toBe("business");
    if (r.next?.type === "business") {
      expect(r.next.business).toEqual(emptyBusinessIdentity());
    }
    /* فقط فیلدهای «پرشده» در هشدار می‌آیند — با برچسب فارسی */
    expect(r.clearedFields).toEqual([
      INDIVIDUAL_IDENTITY_FIELD_LABELS.firstName,
      INDIVIDUAL_IDENTITY_FIELD_LABELS.nationalCode,
      INDIVIDUAL_IDENTITY_FIELD_LABELS.sheba,
    ]);
  });

  test("حقوقی → حقیقی: فیلدهای شرکت و placeholder مدرک پاک می‌شوند", () => {
    const draft: IdentityDraft = {
      type: "business",
      business: {
        companyName: "شرکت نمونه",
        companyNationalId: "10101234567",
        economicCode: "",
        registrationNumber: "123456",
        representativeNationalCode: "",
        sheba: VALID_SHEBA,
        documentPhotoAccepted: true,
      },
    };
    const r = clearIncompatibleIdentity(draft, "individual");
    expect(r.next?.type).toBe("individual");
    if (r.next?.type === "individual") {
      expect(r.next.individual).toEqual(emptyIndividualIdentity());
    }
    expect(r.clearedFields).toEqual([
      BUSINESS_IDENTITY_FIELD_LABELS.companyName,
      BUSINESS_IDENTITY_FIELD_LABELS.companyNationalId,
      BUSINESS_IDENTITY_FIELD_LABELS.registrationNumber,
      BUSINESS_IDENTITY_FIELD_LABELS.sheba,
      BUSINESS_IDENTITY_FIELD_LABELS.documentPhotoAccepted,
    ]);
  });

  test("پیام هشدار از فهرست فیلدهای پاک‌شده ساخته می‌شود", () => {
    const msg = identityChangeWarningMessage(["نام", "کد ملی"]);
    expect(msg).toContain("نام، کد ملی");
    expect(msg).toContain("پاک شدند");
  });
});

describe("validateIndividualIdentity — هویت شخص حقیقی", () => {
  test("draft کامل و معتبر → بدون خطا و complete", () => {
    const d = {
      firstName: "علی",
      lastName: "رضایی",
      nationalCode: VALID_NID,
      sheba: VALID_SHEBA,
    };
    expect(validateIndividualIdentity(d)).toEqual({});
    expect(isIndividualIdentityComplete(d)).toBeTrue();
  });

  test("نام/نام خانوادگی خیلی کوتاه خطا می‌گیرد", () => {
    const errors = validateIndividualIdentity({
      firstName: "ا",
      lastName: "   ",
      nationalCode: VALID_NID,
      sheba: VALID_SHEBA,
    });
    expect(errors.firstName).toBeTruthy();
    expect(errors.lastName).toBeTruthy();
    expect(errors.nationalCode).toBeUndefined();
  });

  test("کد ملی از همان اعتبارسنجی موجود (رقم کنترل) رد می‌شود", () => {
    expect(validateNationalId("0010515527").ok).toBeFalse();
    const errors = validateIndividualIdentity({
      firstName: "علی",
      lastName: "رضایی",
      nationalCode: "0010515527",
      sheba: VALID_SHEBA,
    });
    expect(errors.nationalCode).toBeTruthy();
  });

  test("شبای نامعتبر خطا می‌گیرد", () => {
    const errors = validateIndividualIdentity({
      firstName: "علی",
      lastName: "رضایی",
      nationalCode: VALID_NID,
      sheba: "IR000000000000000000000000",
    });
    expect(errors.sheba).toBeTruthy();
  });
});

describe("validateBusinessIdentity — هویت شخص حقوقی", () => {
  const valid: ReturnType<typeof emptyBusinessIdentity> & { documentPhotoAccepted: boolean } = {
    companyName: "شرکت گجت‌بازار",
    companyNationalId: "10101234567",
    economicCode: "411123456",
    registrationNumber: "123456",
    representativeNationalCode: VALID_NID,
    sheba: VALID_SHEBA,
    documentPhotoAccepted: true,
  };

  test("draft کامل و معتبر → بدون خطا و complete", () => {
    expect(validateBusinessIdentity(valid)).toEqual({});
    expect(isBusinessIdentityComplete(valid)).toBeTrue();
  });

  test("شناسهٔ ملی شرکت فقط دقیقاً ۱۱ رقم می‌پذیرد", () => {
    expect(validateCompanyNationalId("1010123456").ok).toBeFalse(); // ۱۰ رقم
    expect(validateCompanyNationalId("101012345678").ok).toBeFalse(); // ۱۲ رقم
    expect(validateCompanyNationalId("۱۰۱۰۱۲۳۴۵۶۷").ok).toBeTrue(); // ارقام فارسی ok
    expect(validateCompanyNationalId("101012345a6").ok).toBeFalse();
  });

  test("کد اقتصادی فقط ارقام با طول انعطاف‌پذیر", () => {
    expect(validateEconomicCode("").ok).toBeFalse();
    expect(validateEconomicCode("123").ok).toBeTrue();
    expect(validateEconomicCode("41112345678901234567").ok).toBeFalse(); // > ۱۶
    expect(validateEconomicCode("abc12").ok).toBeFalse();
  });

  test("شمارهٔ ثبت فقط ارقام", () => {
    expect(validateRegistrationNumber("").ok).toBeFalse();
    expect(validateRegistrationNumber("7654321").ok).toBeTrue();
    expect(validateRegistrationNumber("12ab").ok).toBeFalse();
  });

  test("کد ملی نماینده همان اعتبارسنجی کد ملی است", () => {
    const errors = validateBusinessIdentity({
      ...valid,
      representativeNationalCode: "1234567890",
    });
    expect(errors.representativeNationalCode).toBeTruthy();
  });

  test("placeholder عکس مدرک الزامی است", () => {
    const errors = validateBusinessIdentity({
      ...valid,
      documentPhotoAccepted: false,
    });
    expect(errors.documentPhotoAccepted).toBeTruthy();
  });
});

describe("sanitizeIdentityDraft — draft هویت ذخیره‌شدهٔ نشست", () => {
  test("شکل درست فردی/حقوقی برمی‌گردد", () => {
    const individual = sanitizeIdentityDraft({
      type: "individual",
      individual: { firstName: "علی", lastName: "رضایی", nationalCode: VALID_NID, sheba: VALID_SHEBA },
    });
    expect(individual?.type).toBe("individual");
    const business = sanitizeIdentityDraft({
      type: "business",
      business: { ...emptyBusinessIdentity(), documentPhotoAccepted: "yes" },
    });
    expect(business?.type).toBe("business");
    if (business?.type === "business") {
      /* مقدار غیر بولین → false */
      expect(business.business.documentPhotoAccepted).toBeFalse();
    }
  });

  test("فیلد ناقص تحمل می‌شود (رشتهٔ خالی) — کل draft دور ریخته نمی‌شود", () => {
    const d = sanitizeIdentityDraft({
      type: "individual",
      individual: { firstName: 42, lastName: "رضایی" },
    });
    expect(d?.type).toBe("individual");
    if (d?.type === "individual") {
      expect(d.individual.firstName).toBe("");
      expect(d.individual.lastName).toBe("رضایی");
      expect(d.individual.nationalCode).toBe("");
    }
  });

  test("شکل خراب → null", () => {
    expect(sanitizeIdentityDraft(null)).toBeNull();
    expect(sanitizeIdentityDraft("x")).toBeNull();
    expect(sanitizeIdentityDraft({ type: "weird" })).toBeNull();
    expect(sanitizeIdentityDraft({ type: "individual", individual: "no" })).toBeNull();
  });
});
