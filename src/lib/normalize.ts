/* ─────────────────────────────────────────────────────────────
   v1.6.3 — نرمال‌سازی فارسی «ماژول مشترک» (UI + سرور + seed + تست)
   یک تابع واحد برای همه‌جا:
   ─ ی عربی/فارسی (ي ى) → ی فارسی
   ─ ك عربی → ک فارسی
   ─ ارقام فارسی (۰-۹) و عربی (٠-٩) → لاتین (0-9)
   ─ ۀ ة → ه ؛ أ إ آ ٱ → ا
   ─ حذف کشیده (ـ)، اعراب و علامت‌های قرآنی
   ─ حذف نیم‌فاصله (ZWNJ) — برای ایندکس جستجو کلمه‌ها به هم می‌چسبند
   ─ حروف لاتین کوچک می‌شوند؛ trim + فاصله‌های یکدست (تک‌فاصله)

   مصرف‌کننده‌ها:
   ─ UI (useSearch و …) از همین تابع استفاده می‌کند (src/lib/persian.ts
     فقط re-export می‌کند تا importهای قدیمی نشکنند)
   ─ سرور (GET /search و GET /shows) — نرمال‌سازی ورودی کاربر و ستون
     searchText دیتابیس با «همین یک تابع» پر می‌شود
   ─ prisma/seed.ts و تست‌ها

   buildSearchText: ساخت مقدار ستون searchText از فیلدهای نمایشی —
   نقطهٔ واحد پرکردن در seed و آینده در ساخت/ویرایش کالا و شو و فروشنده.
   ───────────────────────────────────────────────────────────── */

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** یکدست‌سازی حروف و ارقام فارسی/عربی برای مقایسه و ایندکس جستجو */
export function normalizeFa(input: string): string {
  return input
    .replace(/[يىﻯﻰﻲﻱ]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ۀة]/g, "ه")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    /* نیم‌فاصله + اعراب و علامت‌های کشیدگی (تطویل، سکون، تنوین و …) */
    .replace(/[\u200c\u064b-\u0652\u0640\u0670\u0653-\u0655]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * مقدار ستون searchText برای Product / Show / SellerProfile.
 * همهٔ اجزا با همان normalizeFa یکدست می‌شوند و با یک فاصله می‌چسبند —
 * /search روی همین ستون با ILIKE جستجو می‌کند.
 * ─ Product: title + brand + نام دسته
 * ─ Show: title + نام دسته
 * ─ SellerProfile: shopName + slug
 */
export function buildSearchText(
  parts: (string | null | undefined)[]
): string {
  return normalizeFa(
    parts
      .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      .join(" ")
  );
}
