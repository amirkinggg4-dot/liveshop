import { CATEGORY_PHOTO } from "./media";
import type { Category } from "./types";

/* ─────────────────────────────────────────────────────────────
   v2.0.2 — منبع واحد دسته‌ها (تک‌فایل مشترک)
   کاوش (ExploreView از طریق useCategories)، فرم شروع فروش
   (SellerOnboardingView)، زمان‌بندی شو (SellerScheduleView)،
   پنل ادمین (AdminApp) و صفحهٔ انتخاب دستهٔ ثبت‌نام فروشنده
   (SellerCategoryPickView) همه فقط از همین فهرست می‌خوانند.
   ─ هر ردیف: {id, slug, nameFa, image, rules?} + فیلدهای نمایشی
     قدیمی (label/emoji/liveCount) که مصرف‌کننده‌های موجود دارند.
   ─ image فقط از public خود پروژه (CATEGORY_PHOTO — همان عکس‌های
     کاشی دستهٔ کاوش) تا مسیر عکس‌ها هم تک‌منبع بماند.
   ─ rules فعلاً خالی است — جای قوانین هر دسته برای لیستینگ در آینده.
   ───────────────────────────────────────────────────────────── */

export const CATEGORIES: Category[] = [
  {
    id: "sneakers",
    slug: "sneakers",
    nameFa: "کتونی و کفش",
    label: "کتونی و کفش",
    emoji: "👟",
    liveCount: 128,
    image: CATEGORY_PHOTO.sneakers,
    rules: "",
  },
  {
    id: "plants",
    slug: "plants",
    nameFa: "گیاه و گلخانه",
    label: "گیاه و گلخانه",
    emoji: "🪴",
    liveCount: 64,
    image: CATEGORY_PHOTO.plants,
    rules: "",
  },
  {
    id: "cards",
    slug: "cards",
    nameFa: "کارت و کلکسیون",
    label: "کارت و کلکسیون",
    emoji: "🃏",
    liveCount: 89,
    image: CATEGORY_PHOTO.cards,
    rules: "",
  },
  {
    id: "tech",
    slug: "tech",
    nameFa: "دیجیتال و گجت",
    label: "دیجیتال و گجت",
    emoji: "🎧",
    liveCount: 45,
    image: CATEGORY_PHOTO.tech,
    rules: "",
  },
  {
    id: "fashion",
    slug: "fashion",
    nameFa: "مد و پوشاک",
    label: "مد و پوشاک",
    emoji: "🧥",
    liveCount: 73,
    image: CATEGORY_PHOTO.fashion,
    rules: "",
  },
  {
    id: "beauty",
    slug: "beauty",
    nameFa: "زیبایی و عطر",
    label: "زیبایی و عطر",
    emoji: "💎",
    liveCount: 52,
    image: CATEGORY_PHOTO.beauty,
    rules: "",
  },
  {
    id: "home",
    slug: "home",
    nameFa: "خانه و آشپزخانه",
    label: "خانه و آشپزخانه",
    emoji: "🏠",
    liveCount: 38,
    image: CATEGORY_PHOTO.home,
    rules: "",
  },
  {
    id: "toys",
    slug: "toys",
    nameFa: "عروسک و اسباب‌بازی",
    label: "عروسک و اسباب‌بازی",
    emoji: "🧸",
    liveCount: 41,
    image: CATEGORY_PHOTO.toys,
    rules: "",
  },
  {
    id: "books",
    slug: "books",
    nameFa: "کتاب و کامیک",
    label: "کتاب و کامیک",
    emoji: "📚",
    liveCount: 27,
    image: CATEGORY_PHOTO.books,
    rules: "",
  },
  {
    id: "art",
    slug: "art",
    nameFa: "هنر و دست‌ساز",
    label: "هنر و دست‌ساز",
    emoji: "🎨",
    liveCount: 33,
    image: CATEGORY_PHOTO.art,
    rules: "",
  },
];

/** دسته بر اساس id — برای مصرف‌کننده‌هایی که شناسه دارند (مثل draft استور) */
export function categoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** شناسه‌های معتبر — برای پاک‌سازی draft ذخیره‌شده */
export const CATEGORY_IDS: readonly string[] = CATEGORIES.map((c) => c.id);
