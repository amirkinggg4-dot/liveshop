import { describe, it, expect } from "bun:test";
import {
  validateNationalId,
  validateSheba,
  validateSlug,
  maskNationalId,
  maskSheba,
  latinDigits,
} from "@/lib/seller-validate";

/* ─────────────────────────────────────────────────────────────
   v1.7.0 — تست واحد اعتبارسنجی onboarding فروشنده
   کد ملی (رقم کنترل) و شبا (mod-97) با اعداد معتبر و نامعتبر +
   ماسک (اینورینت: کد ملی/شبا هرگز کامل نمایش داده نمی‌شوند)
   ───────────────────────────────────────────────────────────── */

describe("validateNationalId — کد ملی ۱۰ رقمی", () => {
  it("کد ملی معتبر را قبول می‌کند", () => {
    expect(validateNationalId("0010515526").ok).toBe(true);
    expect(validateNationalId("0451234561").ok).toBe(true);
    expect(validateNationalId("1236789008").ok).toBe(true);
  });

  it("ارقام فارسی/عربی را هم قبول می‌کند و نرمال می‌کند", () => {
    const fa = validateNationalId("۰۰۱۰۵۱۵۵۲۶");
    expect(fa.ok).toBe(true);
    if (fa.ok) expect(fa.normalized).toBe("0010515526");
  });

  it("رقم کنترل غلط را رد می‌کند", () => {
    const res = validateNationalId("0010515525");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("رقم کنترل");
  });

  it("کمتر/بیشتر از ۱۰ رقم را رد می‌کند", () => {
    expect(validateNationalId("12345").ok).toBe(false);
    expect(validateNationalId("12345678901").ok).toBe(false);
    expect(validateNationalId("").ok).toBe(false);
  });

  it("ارقام تکراری (مثل ۱۱۱۱۱۱۱۱۱۱) را رد می‌کند", () => {
    expect(validateNationalId("1111111111").ok).toBe(false);
    expect(validateNationalId("0000000000").ok).toBe(false);
  });

  it("حروف و نویسه‌های اضافه را نادیده می‌گیرد (فقط رقم می‌شمارد)", () => {
    expect(validateNationalId("0010515526x").ok).toBe(true);
  });
});

describe("validateSheba — شبا IR + ۲۴ رقم", () => {
  it("شبای معتبر (mod-97) را قبول می‌کند", () => {
    const res = validateSheba("IR580540105180021273113007");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.normalized).toBe("IR580540105180021273113007");
    expect(validateSheba("IR580190000000000000000000").ok).toBe(true);
  });

  it("شبا با فاصله و حروف کوچک را هم نرمال و قبول می‌کند", () => {
    const res = validateSheba("ir58 0540 1051 8002 1273 1130 07");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.normalized).toBe("IR580540105180021273113007");
  });

  it("رقم کنترل غلط را رد می‌کند", () => {
    const res = validateSheba("IR580540105180021273113008");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("mod-97");
  });

  it("بدون پیشوند IR را رد می‌کند", () => {
    expect(validateSheba("580540105180021273113007").ok).toBe(false);
  });

  it("تعداد رقم نادرست را رد می‌کند (۲۳ یا ۲۵ رقم)", () => {
    expect(validateSheba("IR58054010518002127311300").ok).toBe(false);
    expect(validateSheba("IR5805401051800212731130075").ok).toBe(false);
  });

  it("نویسهٔ غیررقمی بعد از IR را رد می‌کند", () => {
    expect(validateSheba("IR58054010518002127311300A").ok).toBe(false);
  });
});

describe("maskNationalId / maskSheba — ماسک (اینورینت حریم خصوصی)", () => {
  it("کد ملی فقط ۴ رقم آخر را نشان می‌دهد", () => {
    expect(maskNationalId("0010515526")).toBe("••••5526");
  });

  it("کد ملی ناقص را کامل ماسک می‌کند", () => {
    expect(maskNationalId("123")).toBe("••••••••••");
  });

  it("شبا فقط ۴ رقم آخر را نشان می‌دهد", () => {
    expect(maskSheba("IR580540105180021273113007")).toBe(
      "IR •••• •••• ••3007"
    );
  });

  it("ماسک شبای ناقص بدون رقم واقعی است", () => {
    expect(maskSheba("IR123")).toBe("IR •••• •••• ••••");
  });

  it("اینورینت: ماسک هرگز شامل ۱۰ رقم کامل کد ملی یا ۲۴ رقم شبا نیست", () => {
    const nid = "0010515526";
    const masked = maskNationalId(nid);
    expect(masked).not.toContain(nid);
    expect(masked.length).toBeLessThan(nid.length);

    const sheba = "IR580540105180021273113007";
    const shebaMasked = maskSheba(sheba);
    expect(shebaMasked).not.toContain(sheba);
    expect(shebaMasked.replace(/\D/g, "").length).toBeLessThanOrEqual(4);
  });
});

describe("validateSlug — شناسهٔ فروشگاه", () => {
  it("شناسهٔ معتبر را قبول می‌کند", () => {
    const res = validateSlug("sina-kicks");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.normalized).toBe("sina-kicks");
  });

  it("حروف بزرگ را کوچک می‌کند و می‌پذیرد", () => {
    const res = validateSlug("SinaKicks");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.normalized).toBe("sinakicks");
  });

  it("شناسهٔ کوتاه‌تر از ۳ حرف را رد می‌کند", () => {
    expect(validateSlug("ab").ok).toBe(false);
  });

  it("فارسی/فاصله/نویسهٔ خاص را رد می‌کند", () => {
    expect(validateSlug("فروشگاه").ok).toBe(false);
    expect(validateSlug("sina kicks").ok).toBe(false);
    expect(validateSlug("sina_kicks").ok).toBe(false);
  });

  it("خط تیرهٔ ابتدا/انتها را رد می‌کند", () => {
    expect(validateSlug("-sina").ok).toBe(false);
    expect(validateSlug("sina-").ok).toBe(false);
  });
});

describe("latinDigits", () => {
  it("ارقام فارسی و عربی را لاتین می‌کند", () => {
    expect(latinDigits("۰۰۱۰۵۱۵۵۲۶")).toBe("0010515526");
    expect(latinDigits("٠٠١٠٥١٥٥٢٦")).toBe("0010515526");
    expect(latinDigits("IR۵۸۰۵")).toBe("IR5805");
  });
});
