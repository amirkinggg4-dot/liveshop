import { describe, it, expect } from "bun:test";

/* ─────────────────────────────────────────────────────────────
   v1.9.0 — تست اعتبارسنجی موبایل/کدپستی + دیتای استان‌ها
   موبایل (ارقام فارسی/عربی، پسوندهای +98/0098/989، فاصله و تیره)،
   کدپستی (۱۰ رقم، شروع با صفر، همه یکسان)، فیلد اجباری فرم آدرس و
   دیتای ۳۱ استان (هر استان حداقل ۲ شهر، مرکز اول، citiesOf)
   ───────────────────────────────────────────────────────────── */

import {
  normalizePhoneFa,
  validatePhoneFa,
  validatePostalCodeFa,
  validateRequiredFa,
  PHONE_INVALID_MESSAGE,
} from "@/lib/account-validate";
import { PROVINCES, citiesOf } from "@/lib/data/provinces";

/* ─── ۱) نرمال‌سازی موبایل ─── */
describe("account-validate — normalizePhoneFa", () => {
  it("ارقام فارسی ۰۹… → لاتین", () => {
    expect(normalizePhoneFa("۰۹۱۲۱۲۳۴۵۶۷")).toBe("09121234567");
  });

  it("ارقام عربی هم نرمال می‌شوند", () => {
    expect(normalizePhoneFa("٠٩١٢١٢٣٤٥٦٧")).toBe("09121234567");
  });

  it("پسوند +98 → 0", () => {
    expect(normalizePhoneFa("+989121234567")).toBe("09121234567");
  });

  it("پسوند 0098 → 0", () => {
    expect(normalizePhoneFa("00989121234567")).toBe("09121234567");
  });

  it("پسوند 989 → 0", () => {
    expect(normalizePhoneFa("989121234567")).toBe("09121234567");
  });

  it("فاصله، تیره و پرانتز داخل شماره حذف می‌شود", () => {
    expect(normalizePhoneFa("0912 123 4567")).toBe("09121234567");
    expect(normalizePhoneFa("0912-123-4567")).toBe("09121234567");
    expect(normalizePhoneFa("(0912) 1234567")).toBe("09121234567");
  });

  it("پیشوند اشتباه مثل ثابت ۰۸۱۲… نامعتبر است", () => {
    expect(normalizePhoneFa("08121234567")).toBeNull();
    expect(normalizePhoneFa("۰۸۱۲۱۲۳۴۵۶۷")).toBeNull();
  });

  it("کمتر از ۱۱ رقم نامعتبر است", () => {
    expect(normalizePhoneFa("0912123456")).toBeNull();
  });

  it("بیشتر از ۱۱ رقم نامعتبر است", () => {
    expect(normalizePhoneFa("091212345678")).toBeNull();
  });

  it("حروف داخل شماره نامعتبر است", () => {
    expect(normalizePhoneFa("0912abc4567")).toBeNull();
  });

  it("رشتهٔ خالی نامعتبر است", () => {
    expect(normalizePhoneFa("")).toBeNull();
  });
});

/* ─── ۲) اعتبارسنجی موبایل با پیام ─── */
describe("account-validate — validatePhoneFa", () => {
  it("شمارهٔ درست → ok با خروجی نرمال ۰۹xxxxxxxxx", () => {
    const res = validatePhoneFa("+98 912 123 4567");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.phone).toBe("09121234567");
  });

  it("شمارهٔ نامعتبر → پیام فارسی دقیق", () => {
    const res = validatePhoneFa("12345");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toBe(PHONE_INVALID_MESSAGE);
      expect(res.message).toBe(
        "شمارهٔ موبایل معتبر نیست؛ نمونهٔ صحیح: ۰۹۱۲۱۲۳۴۵۶۷"
      );
    }
  });
});

/* ─── ۳) کدپستی ─── */
describe("account-validate — validatePostalCodeFa", () => {
  it("۱۰ رقم درست → ok", () => {
    const res = validatePostalCodeFa("1234567890");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.postalCode).toBe("1234567890");
  });

  it("ارقام فارسی → لاتین و ok", () => {
    const res = validatePostalCodeFa("۱۲۳۴۵۶۷۸۹۰");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.postalCode).toBe("1234567890");
  });

  it("شروع با صفر → «کدپستی نمی‌تواند با صفر شروع شود»", () => {
    const res = validatePostalCodeFa("0123456789");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toBe("کدپستی نمی‌تواند با صفر شروع شود");
  });

  it("۹ رقم → «کدپستی باید ۱۰ رقم باشد»", () => {
    const res = validatePostalCodeFa("123456789");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toBe("کدپستی باید ۱۰ رقم باشد");
  });

  it("۱۱ رقم → «کدپستی باید ۱۰ رقم باشد»", () => {
    const res = validatePostalCodeFa("12345678901");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toBe("کدپستی باید ۱۰ رقم باشد");
  });

  it("همهٔ رقم‌ها یکسان → «کدپستی معتبر نیست»", () => {
    const res = validatePostalCodeFa("1111111111");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toBe("کدپستی معتبر نیست");
  });

  it("حروف داخل کدپستی → «کدپستی معتبر نیست»", () => {
    const res = validatePostalCodeFa("12345abc90");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toBe("کدپستی معتبر نیست");
  });

  it("رشتهٔ خالی → «کدپستی باید ۱۰ رقم باشد»", () => {
    const res = validatePostalCodeFa("");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toBe("کدپستی باید ۱۰ رقم باشد");
  });
});

/* ─── ۴) فیلد اجباری فرم آدرس ─── */
describe("account-validate — validateRequiredFa", () => {
  it("خالی/فقط فاصله → پیام «{label} را وارد کن»", () => {
    const empty = validateRequiredFa("", "نام و نام خانوادگی");
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.message).toBe("نام و نام خانوادگی را وارد کن");

    const spaces = validateRequiredFa("   ", "شهر");
    expect(spaces.ok).toBe(false);
    if (!spaces.ok) expect(spaces.message).toBe("شهر را وارد کن");
  });

  it("مقدار پر → ok با مقدار trim‌شده", () => {
    const res = validateRequiredFa("  تهران، خیابان ولیعصر  ", "آدرس");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe("تهران، خیابان ولیعصر");
  });
});

/* ─── ۵) دیتای استان‌ها ─── */
describe("account-validate — دیتای استان‌های ایران", () => {
  it("دقیقاً ۳۱ استان با id و نام یکتا", () => {
    expect(PROVINCES.length).toBe(31);
    const ids = new Set(PROVINCES.map((p) => p.id));
    const names = new Set(PROVINCES.map((p) => p.name));
    expect(ids.size).toBe(31);
    expect(names.size).toBe(31);
  });

  it("هر استان حداقل ۲ شهر دارد و مرکز استان اول است", () => {
    for (const p of PROVINCES) {
      expect(p.cities.length).toBeGreaterThanOrEqual(2);
    }
    expect(PROVINCES.find((p) => p.name === "تهران")?.cities[0]).toBe("تهران");
    expect(PROVINCES.find((p) => p.name === "البرز")?.cities[0]).toBe("کرج");
    expect(PROVINCES.find((p) => p.name === "اصفهان")?.cities[0]).toBe("اصفهان");
    expect(PROVINCES.find((p) => p.name === "فارس")?.cities[0]).toBe("شیراز");
    expect(
      PROVINCES.find((p) => p.name === "خراسان رضوی")?.cities[0]
    ).toBe("مشهد");
    expect(
      PROVINCES.find((p) => p.name === "کهگیلویه و بویراحمد")?.cities[0]
    ).toBe("یاسوج");
    expect(
      PROVINCES.find((p) => p.name === "چهارمحال و بختیاری")?.cities[0]
    ).toBe("شهرکرد");
  });

  it("شهرهای نمونهٔ درخواستی در دیتا هستند", () => {
    const tehran = PROVINCES.find((p) => p.name === "تهران")!;
    expect(tehran.cities).toContain("شهریار");
    expect(tehran.cities).toContain("ورامین");
    expect(tehran.cities).toContain("اسلامشهر");
    expect(tehran.cities).toContain("قدس");

    const alborz = PROVINCES.find((p) => p.name === "البرز")!;
    expect(alborz.cities).toContain("هشتگرد");
    expect(alborz.cities).toContain("نظرآباد");

    const fars = PROVINCES.find((p) => p.name === "فارس")!;
    expect(fars.cities).toContain("مرودشت");
    expect(fars.cities).toContain("جهرم");
  });

  it("citiesOf با نرمال‌سازی غلط‌گیری می‌کند و نام ناشناخته → []", () => {
    expect(citiesOf("تهران")[0]).toBe("تهران");
    expect(citiesOf("البرز")).toContain("کرج");
    expect(citiesOf("فارس")).toContain("جهرم");
    /* حروف عربی (ك/ي) هم با normalizeFa یکدست می‌شود */
    expect(citiesOf("كرمانشاه")).toContain("کرمانشاه");
    expect(citiesOf("استان نامعلوم")).toEqual([]);
  });
});
