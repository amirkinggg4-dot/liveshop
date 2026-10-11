/* ─────────────────────────────────────────────────────────────
   LiveShop — نقشهٔ رسانه‌های واقعی (v1.3.2 — عکس واقعی به‌جای ایموجی بزرگ)
   مصرف‌کننده‌ها: views/LiveView.tsx، views/HomeView.tsx، shared.tsx
   - SHOW_VIDEO    → پس‌زمینهٔ تمام‌صفحهٔ «ویدیوی» لایو (عکس واقعی)
   - SHOW_PHOTO    → عکس کارت شو (خانه/کاوش) — برای شوهای زنده همان عکس ویدیو
   - ITEM_PHOTO    → عکس واقعی کالا (کارت پایین لایو، شاپ، محصول)
   - SELLER_PHOTO  → عکس واقعی پروفایل فروشنده (هدر لایو، استوری، کارت‌ها)
   - CATEGORY_PHOTO→ عکس واقعی هر دسته‌بندی (چیپ‌ها/کاور شوهای دسته‌ای)
   شو/کالا/فروشنده‌ای که در این نقشه‌ها نباشد به گرادیان برند برمی‌گردد (fallback).
   ───────────────────────────────────────────────────────────── */

export const SHOW_VIDEO: Record<string, string> = {
  sh1: "/liveshop/live-sh1.jpg",
  sh2: "/liveshop/live-sh2.jpg",
  sh3: "/liveshop/live-sh3.jpg",
};

/** v1.3.2 — عکس کارت شو برای همهٔ شوها (زنده = همان ویدیو، به‌زودی = عکس دسته) */
export const SHOW_PHOTO: Record<string, string> = {
  sh1: "/liveshop/live-sh1.jpg",
  sh2: "/liveshop/live-sh2.jpg",
  sh3: "/liveshop/live-sh3.jpg",
  sh4: "/liveshop/cat-tech.jpg",
  sh5: "/liveshop/cat-beauty.jpg",
  sh6: "/liveshop/cat-books.jpg",
  sh7: "/liveshop/cat-sneakers.jpg",
  sh8: "/liveshop/cat-plants.jpg",
};

export const ITEM_PHOTO: Record<string, string> = {
  it1: "/liveshop/item-it1.jpg",
  it2: "/liveshop/item-it2.jpg",
  it3: "/liveshop/item-it3.jpg",
  it4: "/liveshop/item-it4.jpg",
  it5: "/liveshop/item-it5.jpg",
  it6: "/liveshop/item-it6.jpg",
  /* v1.7.0 — عکس اصلی برای همهٔ آیتم‌های انبار (تولیدشده برای دمو) */
  it7: "/liveshop/item-it7.jpg",
  it8: "/liveshop/item-it8.jpg",
  it9: "/liveshop/item-it9.jpg",
  it10: "/liveshop/item-it10.jpg",
  /* v1.8.0 — عکس اصلی کالاهای کلکسیونی شو sh3 (برای سفارش‌های seed) */
  ct1: "/liveshop/item-ct1.jpg",
  ct2: "/liveshop/item-ct2.jpg",
};

export const SELLER_PHOTO: Record<string, string> = {
  s1: "/liveshop/seller-s1.jpg",
  s2: "/liveshop/seller-s2.jpg",
  s3: "/liveshop/seller-s3.jpg",
  s4: "/liveshop/seller-s4.jpg",
  s5: "/liveshop/seller-s5.jpg",
  s6: "/liveshop/seller-s6.jpg",
};

/** v1.3.2 — عکس دسته‌بندی‌ها (کفش، گیاه، کارت، ساعت/مد، عطر و…) */
export const CATEGORY_PHOTO: Record<string, string> = {
  sneakers: "/liveshop/cat-sneakers.jpg",
  plants: "/liveshop/cat-plants.jpg",
  cards: "/liveshop/cat-cards.jpg",
  tech: "/liveshop/cat-tech.jpg",
  fashion: "/liveshop/cat-fashion.jpg",
  beauty: "/liveshop/cat-beauty.jpg",
  home: "/liveshop/cat-home.jpg",
  toys: "/liveshop/cat-toys.jpg",
  books: "/liveshop/cat-books.jpg",
  art: "/liveshop/cat-art.jpg",
};
