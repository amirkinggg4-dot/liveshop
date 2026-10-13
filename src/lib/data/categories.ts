import { CATEGORY_PHOTO } from "./media";
import type { Category, Subcategory } from "./types";

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

   v2.0.3 — زیرمجموعه‌ها (مرحلهٔ ۲ ثبت‌نام فروشنده):
   ─ هر دسته آرایهٔ subcategories: {id, slug, nameFa} دارد؛ هر دسته
     ۴ تا ۷ مورد + «سایر». slug هر زیرمجموعه سراسری یکتا است و
     از ‎<cat>-<suffix> ساخته می‌شود («سایر» = ‎<cat>-other)؛
     id همان slug است (هم‌قرارداد دسته‌های بالا).
   ─ کاوش، لیستینگ و زمان‌بندی شو از قبل CATEGORIES را مصرف می‌کنند و
     از همین حاضر subcategories را هم می‌توانند بخوانند — فقط دسترسی،
     بدون تغییر رفتارشان.
   ─ سمت سرور: seed همین آرایه‌ها را می‌سازد و GET /api/v1/categories
     آن‌ها را به‌صورت children (slug/nameFa) برمی‌گرداند.
   ───────────────────────────────────────────────────────────── */

/** v2.0.3 — جدول زیرمجموعه‌ها: [پسوند slug، نام فارسی] برای هر دسته
    (فهرست‌ها دقیقاً طبق مشخصات؛ «سایر» به‌صورت خودکار به انتها اضافه می‌شود) */
const SUBCATEGORY_SEED: Readonly<Record<string, readonly (readonly [string, string])[]>> = {
  sneakers: [
    ["sport", "کتونی اسپرت"],
    ["street", "کتونی استریت‌ویر و کلکسیونی"],
    ["formal", "کفش رسمی"],
    ["leather", "کفش چرم و صندل"],
    ["boots", "بوت و نیم‌بوت"],
    ["kids", "کفش بچه‌گانه"],
  ],
  plants: [
    ["houseplant", "گیاه آپارتمانی"],
    ["cactus", "کاکتوس و ساکولنت"],
    ["seasonal", "گل فصلی"],
    ["pots", "گلدان و لوازم"],
    ["seeds", "بذر و نهال"],
    ["bonsai", "بونسای و گیاهان کمیاب"],
  ],
  cards: [
    ["tcg", "کارت بازی (TCG)"],
    ["sports", "کارت ورزشی"],
    ["figures", "فیگور کلکسیونی"],
    ["stamps", "تمبر و اسناد قدیمی"],
    ["posters", "پوستر و یادگاری"],
  ],
  tech: [
    ["mobile", "موبایل و تبلت"],
    ["laptop", "لپ‌تاپ و قطعات"],
    ["audio", "هدفون و اسپیکر"],
    ["camera", "دوربین و عکاسی"],
    ["console", "کنسول و بازی"],
    ["accessories", "لوازم جانبی"],
    ["watches", "ساعت هوشمند"],
  ],
  beauty: [
    ["perfume", "عطر و ادکلن"],
    ["makeup", "آرایش"],
    ["skincare", "مراقبت از پوست"],
    ["haircare", "مراقبت از مو"],
  ],
  fashion: [
    ["men", "لباس مردانه"],
    ["women", "لباس زنانه"],
    ["kids", "لباس بچه‌گانه"],
    ["bags", "کیف و کوله"],
    ["scarves", "شال و اکسسوری"],
    ["sport", "لباس ورزشی"],
  ],
  home: [
    ["tableware", "ظروف و دکور"],
    ["kitchen", "لوازم آشپزخانه"],
    ["appliances", "لوازم برقی خانگی"],
    ["lighting", "روشنایی"],
    ["decor", "دکوراسیون"],
  ],
  toys: [
    ["kids", "اسباب‌بازی کودک"],
    ["figures", "فیگور و ماکت"],
    ["boardgames", "بازی فکری و پازل"],
    ["bricks", "ساخت‌وساز (لگو)"],
    ["plush", "عروسک پولیشی"],
  ],
  books: [
    ["rare", "کتاب نایاب و چاپ اول"],
    ["comics", "کمیک و مانگا"],
    ["magazines", "مجله و نشریه قدیمی"],
    ["stationery", "لوازم‌التحریر"],
  ],
  art: [
    ["ceramics", "سفال و سرامیک"],
    ["painting", "نقاشی و تابلو"],
    ["woodmetal", "چوب و فلز"],
    ["knitting", "بافتنی و گلدوزی"],
    ["calligraphy", "خوشنویسی"],
  ],
};

/** ساخت آرایهٔ subcategories یک دسته: موارد فهرست + «سایر» در انتها */
function buildSubcategories(catId: string): Subcategory[] {
  const base = (SUBCATEGORY_SEED[catId] ?? []).map(
    ([suffix, nameFa]): Subcategory => ({
      id: `${catId}-${suffix}`,
      slug: `${catId}-${suffix}`,
      nameFa,
    })
  );
  return [
    ...base,
    { id: `${catId}-other`, slug: `${catId}-other`, nameFa: "سایر" },
  ];
}

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
    subcategories: buildSubcategories("sneakers"),
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
    subcategories: buildSubcategories("plants"),
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
    subcategories: buildSubcategories("cards"),
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
    subcategories: buildSubcategories("tech"),
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
    subcategories: buildSubcategories("fashion"),
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
    subcategories: buildSubcategories("beauty"),
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
    subcategories: buildSubcategories("home"),
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
    subcategories: buildSubcategories("toys"),
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
    subcategories: buildSubcategories("books"),
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
    subcategories: buildSubcategories("art"),
  },
];

/** دسته بر اساس id — برای مصرف‌کننده‌هایی که شناسه دارند (مثل draft استور) */
export function categoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** شناسه‌های معتبر — برای پاک‌سازی draft ذخیره‌شده */
export const CATEGORY_IDS: readonly string[] = CATEGORIES.map((c) => c.id);

/* ── v2.0.3 — دسترسی به زیرمجموعه‌ها (همه از همین منبع واحد) ── */

/** زیرمجموعه‌های یک دسته (id دسته) — دستهٔ ناشناس = فهرست خالی */
export function subcategoriesOf(catId: string): Subcategory[] {
  return categoryById(catId)?.subcategories ?? [];
}

/** یک زیرمجموعهٔ مشخص از یک دسته */
export function subcategoryById(
  catId: string,
  subId: string
): Subcategory | undefined {
  return subcategoriesOf(catId).find((s) => s.id === subId);
}

/** نقشهٔ id زیرمجموعه‌های معتبرِ هر دسته — برای پاک‌سازی draft نشست */
export const SUBCATEGORY_IDS_BY_CATEGORY: Readonly<
  Record<string, readonly string[]>
> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, (c.subcategories ?? []).map((s) => s.id)])
);

/** همهٔ idهای زیرمجموعه‌ها (سراسری یکتا) — برای تست هم‌خوانی seed */
export const ALL_SUBCATEGORY_IDS: readonly string[] = CATEGORIES.flatMap(
  (c) => (c.subcategories ?? []).map((s) => s.id)
);
