import { describe, it, expect } from "bun:test";
import {
  digitsOnlyFa,
  formatFaThousands,
  parseFaInt,
  latinDigits,
} from "@/lib/fa-number";

/* ─────────────────────────────────────────────────────────────
   v1.7.0 — تست واحد ورودی عددی فارسی (قیمت/موجودی/وزن)
   فقط رقم، جداکنندهٔ هزارگان «۶٬۵۰۰٬۰۰۰»، مقدار ذخیره‌شده صحیح
   ───────────────────────────────────────────────────────────── */

describe("digitsOnlyFa — فقط رقم", () => {
  it("ارقام لاتین را نگه می‌دارد", () => {
    expect(digitsOnlyFa("6500000")).toBe("6500000");
  });

  it("ارقام فارسی را لاتین می‌کند", () => {
    expect(digitsOnlyFa("۶۵۰۰۰۰۰")).toBe("6500000");
  });

  it("ارقام عربی را هم لاتین می‌کند", () => {
    expect(digitsOnlyFa("٦٥٠٠٠٠٠")).toBe("6500000");
  });

  it("حروف و نویسه‌های دیگر حذف می‌شوند", () => {
    expect(digitsOnlyFa("abc۶۵۰x۰۰۰!#")).toBe("650000");
  });

  it("جداکنندهٔ هزارگان حذف می‌شود (مقدار ذخیره‌شده بدون جداکننده)", () => {
    expect(digitsOnlyFa("۶٬۵۰۰٬۰۰۰")).toBe("6500000");
  });

  it("رشتهٔ خالی و بدون رقم → خالی", () => {
    expect(digitsOnlyFa("")).toBe("");
    expect(digitsOnlyFa("تومان")).toBe("");
  });
});

describe("formatFaThousands — نمایش با جداکننده", () => {
  it("۶۵۰۰۰۰۰ → «۶٬۵۰۰٬۰۰۰»", () => {
    expect(formatFaThousands(6500000)).toBe("۶٬۵۰۰٬۰۰۰");
  });

  it("۵۰۰ → «۵۰۰» (بدون جداکنندهٔ اضافه)", () => {
    expect(formatFaThousands(500)).toBe("۵۰۰");
  });

  it("۱۰۰۰۰۰۰ → «۱٬۰۰۰٬۰۰۰»", () => {
    expect(formatFaThousands(1_000_000)).toBe("۱٬۰۰۰٬۰۰۰");
  });

  it("۴۲۸۰۰۰۰ (فروش هفته) → «۴٬۲۸۰٬۰۰۰»", () => {
    expect(formatFaThousands(4_280_000)).toBe("۴٬۲۸۰٬۰۰۰");
  });

  it("صفر و منفی و NaN → «۰»", () => {
    expect(formatFaThousands(0)).toBe("۰");
    expect(formatFaThousands(-5)).toBe("۰");
    expect(formatFaThousands(Number.NaN)).toBe("۰");
  });

  it("اعشار به پایین گرد می‌شود (مقدار صحیح)", () => {
    expect(formatFaThousands(1234.9)).toBe("۱٬۲۳۴");
  });

  it("رفت‌وبرگشت: format → parse → همان عدد", () => {
    for (const n of [1, 999, 1000, 6500000, 4280000, 123456789]) {
      const shown = formatFaThousands(n);
      expect(parseFaInt(shown)).toBe(n);
    }
  });
});

describe("parseFaInt — مقدار ذخیره‌شدهٔ صحیح", () => {
  it("ورودی آزاد فارسی/لاتین/شلوغ → عدد صحیح", () => {
    expect(parseFaInt("۶٬۵۰۰٬۰۰۰ abc")).toBe(6500000);
    expect(parseFaInt("2,500,000")).toBe(2500000);
    expect(parseFaInt("۹۰۰")).toBe(900);
  });

  it("بدون رقم → ۰", () => {
    expect(parseFaInt("")).toBe(0);
    expect(parseFaInt("گرم")).toBe(0);
  });

  it("عدد بزرگ (مثلاً قیمت بالا) از دست نمی‌رود", () => {
    expect(parseFaInt("۹۹۹٬۹۹۹٬۹۹۹")).toBe(999999999);
  });
});

describe("latinDigits", () => {
  it("ترکیب فارسی/عربی/لاتین", () => {
    expect(latinDigits("abc۱۲٣45")).toBe("abc12345");
  });
});
