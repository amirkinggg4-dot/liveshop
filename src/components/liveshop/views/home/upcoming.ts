/* ─────────────────────────────────────────────────────────────
   v1.6.1 — داده و ابزارهای شوهای «به‌زودی» خانه
   ─ زمان شروع ساختگی برای شمارش معکوس نسبی («۲ ساعت دیگر»)
   ─ فهرست کالاهای برنامه‌ریزی‌شده با قیمت برای شیت پیش‌نمایش
   (mock — در فاز API از scheduledAt و آیتم‌های واقعی خوانده می‌شود)
   ───────────────────────────────────────────────────────────── */

import { faNum } from "@/lib/format";

/* زمان شروع ساختگی هر شو به‌زودی (برای شمارش معکوس نسبی)
   v1.6.1 — افست ساعت از «الان» (محاسبه در لحظهٔ فراخوانی) تا لیبل نسبی
   مستقل از ساعت اجرا همیشه خوانا بماند («۲ ساعت دیگر»، «۲ روز دیگر»، …) */
const UPCOMING_STARTS_IN_HOURS: Record<string, number> = {
  sh6: 2, /* امشب → «۲ ساعت دیگر» */
  sh7: 45, /* دو روز دیگر → «۲ روز دیگر» */
  sh8: 78, /* سه روز دیگر → «۳ روز دیگر» */
};

/** Date شروع شو به‌زودی (mock) — اگر شناسه شناخته نبود null */
export function upcomingStartsAt(showId: string): Date | null {
  const h = UPCOMING_STARTS_IN_HOURS[showId];
  return h == null ? null : new Date(Date.now() + h * 3600_000);
}

/** شمارش معکوس نسبی فارسی — «۴۵ دقیقه دیگر»، «۲ ساعت دیگر»، «۳ روز دیگر» */
export function relativeStartFa(d: Date | null): string {
  if (!d) return "به‌زودی";
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return "همین حالا";
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "همین حالا";
  if (min < 60) return `${faNum(min)} دقیقه دیگر`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${faNum(hr)} ساعت دیگر`;
  const day = Math.round(hr / 24);
  return `${faNum(day)} روز دیگر`;
}

/* ── کالاهای برنامه‌ریزی‌شدهٔ شوهای به‌زودی (برای شیت پیش‌نمایش) ── */

export interface PlannedItem {
  title: string;
  brand: string;
  price: number;
}

export const PLANNED_ITEMS: Record<string, PlannedItem[]> = {
  /* شبِ کتاب: نایاب‌ها و امضادار */
  sh6: [
    { title: "کلیات سعدی — چاپ سنگی امضادار", brand: "انتشارات میراث", price: 4_800_000 },
    { title: "بوف کور — نسخهٔ اول", brand: "کتاب‌خانهٔ تهران", price: 9_200_000 },
    { title: "کمیک زدایش — جلد ۱ تا ۳ (با امضا)", brand: "نشر داستان‌آبی", price: 1_650_000 },
    { title: "شازده کوچولو — ترجمهٔ شاملو", brand: "نشر نگاه", price: 890_000 },
  ],
  /* شب کتونی ۲ — نسخهٔ ویژه */
  sh7: [
    { title: "ایر جردن ۴ «بریذ کریشن»", brand: "جردن", price: 14_500_000 },
    { title: "نیوبالانس ۹۹۰ نسخهٔ سالگرد", brand: "نیوبالانس", price: 8_900_000 },
    { title: "چاک تیلور ۷۰ اورئل", brand: "کانورس", price: 3_400_000 },
    { title: "آدیداس گزیرو ۱ ورژن ویژه", brand: "ادیداس", price: 6_200_000 },
  ],
  /* گیاه‌بازار آخر هفته */
  sh8: [
    { title: "مونسترا آلبو واریگاتا", brand: "گلخانهٔ مینا", price: 12_800_000 },
    { title: "فیلودندرو بلوت شیشه‌ای", brand: "گلخانهٔ مینا", price: 1_450_000 },
    { title: "ساکولنت‌بار مینیاتوری (۶ عددی)", brand: "سبزخانه", price: 980_000 },
    { title: "آبشار دیواری ابلونه", brand: "گلخانهٔ مینا", price: 3_600_000 },
  ],
};

export function getPlannedItems(showId: string): PlannedItem[] {
  return PLANNED_ITEMS[showId] ?? [];
}
