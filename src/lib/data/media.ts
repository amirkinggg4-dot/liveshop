/* ─────────────────────────────────────────────────────────────
   LiveShop — نقشهٔ رسانه‌های واقعی (v1.3.1 — بازطراحی اتاق لایو)
   فقط مصرف‌کننده: views/LiveView.tsx
   - SHOW_VIDEO   → پس‌زمینهٔ تمام‌صفحهٔ «ویدیوی» لایو (عکس واقعی به‌جای ایموجی)
   - ITEM_PHOTO   → عکس واقعی کالا برای دکمهٔ ۶۴px کارت پایین
   - SELLER_PHOTO → عکس واقعی پروفایل فروشنده برای پیل هدر
   شو/کالایی که در این نقشه‌ها نباشد به گرادیان برند برمی‌گردد (fallback).
   ───────────────────────────────────────────────────────────── */

export const SHOW_VIDEO: Record<string, string> = {
  sh1: "/liveshop/live-sh1.jpg",
  sh2: "/liveshop/live-sh2.jpg",
  sh3: "/liveshop/live-sh3.jpg",
};

export const ITEM_PHOTO: Record<string, string> = {
  it1: "/liveshop/item-it1.jpg",
  it3: "/liveshop/item-it3.jpg",
};

export const SELLER_PHOTO: Record<string, string> = {
  s1: "/liveshop/seller-s1.jpg",
};
