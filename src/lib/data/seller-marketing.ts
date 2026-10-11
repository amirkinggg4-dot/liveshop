/* ─────────────────────────────────────────────────────────────
   LiveShop — دیتای بازاریابی، نرخ‌ها، صفحهٔ فروشنده و تنظیمات (فاز ۳)
   فروشندهٔ مرجع: «کفش‌خانهٔ سینا» (s1) — هماهنگ با seller.ts
   همهٔ مبالغ به «تومان» هستند و اعداد در UI فارسی نمایش داده می‌شوند.
   v1.7.1 — کارمزدها از lib/config/fees.ts می‌آیند (تک منبع عدد) و
   متن‌های نمایشی فروشگاه برای حالت قیمت ثابت بازنویسی شده‌اند؛
   متن‌های حالت حراج پشت AUCTION_ENABLED حفظ شده‌اند.
   ───────────────────────────────────────────────────────────── */

import { AUCTION_ENABLED } from "@/lib/config";
import {
  COMMISSION_TIERS as FEES_TIERS,
  GATEWAY_FEE,
  SHIPPING_DEADLINE_HOURS,
} from "@/lib/config/fees";
import { toFa } from "@/lib/format";

/* ── کدهای تخفیف ── */
export interface PromoCode {
  id: string;
  /** متن کد لاتین/انگلیسی — در UI با dir="ltr" نمایش داده می‌شود */
  code: string;
  percent: number;
  usedCount: number;
  maxCount: number;
  active: boolean;
  /** مثل «۵ روز مانده» */
  expiresLabel: string;
}

export const PROMO_CODES: PromoCode[] = [
  {
    id: "pm1",
    code: "NOROOZ15",
    percent: 15,
    usedCount: 34,
    maxCount: 100,
    active: true,
    expiresLabel: "۵ روز مانده",
  },
  {
    id: "pm2",
    code: "SNEAKER10",
    percent: 10,
    usedCount: 78,
    maxCount: 100,
    active: true,
    expiresLabel: "۱۲ روز مانده",
  },
  {
    id: "pm3",
    code: "LIVE5",
    percent: 5,
    usedCount: 100,
    maxCount: 100,
    active: false,
    expiresLabel: "پر شده",
  },
];

/* ── بسته‌های تقویت شو ── */
export interface BoostPackage {
  id: string;
  name: string;
  emoji: string;
  /** تومان */
  price: number;
  reachLabel: string;
}

export const BOOST_PACKAGES: BoostPackage[] = [
  {
    id: "bp1",
    name: "تقویت سبک",
    emoji: "🚀",
    price: 200_000,
    reachLabel: "+۲٬۰۰۰ بینندهٔ بالقوه",
  },
  {
    id: "bp2",
    name: "تقویت سنگین",
    emoji: "🛰️",
    price: 500_000,
    reachLabel: "+۶٬۰۰۰ بینندهٔ بالقوه",
  },
  {
    id: "bp3",
    name: "گپ دسته",
    emoji: "📣",
    price: 900_000,
    reachLabel: "+۱۲٬۰۰۰ بینندهٔ بالقوه + جای ویژه",
  },
];

/* ── تقویت فعال فعلی (null = هیچ تقویتی روشن نیست) ── */
export interface ActiveBoost {
  showTitle: string;
  endsLabel: string;
}

export const ACTIVE_BOOST: ActiveBoost | null = {
  showTitle: "کفش‌بار جمعه‌شب",
  endsLabel: "۲ روز مانده",
};

/* ── نرخ‌های من و هزینه‌ها (Atlas تصویر ۱۰) ──
   v1.7.1 — اعداد از lib/config/fees.ts خوانده می‌شوند؛ فقط برچسب
   فارسی پلکان‌ها همین‌جا ساخته می‌شود. */
/** فروش ماهانهٔ جاری فروشندهٔ نمونه — تومان */
export const MY_GMV_MONTH = 42_500_000;

export interface CommissionTier {
  rate: number;
  rangeLabel: string;
}

/** برچسب فارسی پلکان‌های کمیسیون — اعداد از fees.ts */
export const COMMISSION_TIERS: CommissionTier[] = FEES_TIERS.map((t) => ({
  rate: t.pct,
  rangeLabel:
    t.upTo == null
      ? "بالای ۱۵۰ میلیون تومان فروش ماهانه"
      : t.upTo <= 50_000_000
        ? `تا ${toFa(Math.round(t.upTo / 1_000_000))} میلیون تومان فروش ماهانه`
        : `${toFa(Math.round((FEES_TIERS[FEES_TIERS.findIndex((x) => x.upTo === t.upTo) - 1].upTo ?? 0) / 1_000_000))} تا ${toFa(Math.round(t.upTo / 1_000_000))} میلیون تومان فروش ماهانه`,
}));

/** آستانه‌های عددی پلکان‌ها برای محاسبه — هم‌تراز با fees.ts */
export const TIER_CUTS: number[] = FEES_TIERS.filter(
  (t) => t.upTo != null
).map((t) => t.upTo as number);

/** پردازش درگاه: درصد + مبلغ ثابت — از fees.ts */
export const PROCESSING = {
  pct: GATEWAY_FEE.pct,
  flat: GATEWAY_FEE.flatToman,
} as const;

/** جملهٔ تکمیلی کارت «کارمزد خریدار صفر» — برای حالت قیمت ثابت و حراج */
export const NOTE_BUYER_FEE = AUCTION_ENABLED
  ? "قیمت نهایی همان برندهٔ مزایده است"
  : "قیمت نهایی همان قیمت ثابت کالاست";

/* ── صفحهٔ فروشنده (Atlas تصویر ۰۷) ── */
export interface StorefrontPolicy {
  emoji: string;
  title: string;
  desc: string;
}

export interface StorefrontReview {
  name: string;
  emoji: string;
  /** hex برند برای آواتار */
  color: string;
  rating: number;
  text: string;
  atLabel: string;
  itemTitle: string;
}

export interface StorefrontData {
  sellerId: string;
  story: string;
  totalSalesLabel: string;
  sinceLabel: string;
  policies: StorefrontPolicy[];
  reviews: StorefrontReview[];
}

export const STOREFRONT: StorefrontData = {
  sellerId: "s1",
  /* v1.7.1 — داستان فروشگاه برای فروش قیمت ثابت؛ نسخهٔ حراج پشت فلگ */
  story: AUCTION_ENABLED
    ? `سلام، سینا هستم — از ۱۴۰۱ شب‌های مزایدهٔ LiveShop را با کتونی‌های کمیاب گرم کرده‌ام. تخصص من از روز اول یک چیز بوده: کتونی اورجینال با قیمت شروع منصفانه. هر جعبه را قبل از پخش خودم باز می‌کنم، عکس‌های واقعی می‌گیرم و تگ و جعبه را جلوی دوربین نشان می‌دهم.

خرید در شوهای من ساده است: پیش‌بید بگذار، در مزایده شرکت کن و بعد از برد، کد رهگیری تیپاکس را حداکثر تا ${toFa(SHIPPING_DEADLINE_HOURS)} ساعت بعد بگیر. اگر کالا مطابق توضیحات نبود، ۷ روز فرصت داری برگردانی — بدون چانه‌زنی.

همین وسواس، بیش از ۱٬۲۴۰ خرید موفق و ۴٫۹ ستاره برایم رقم زده. قول من ساده است: اورجینال یا برگشت کامل پول.`
    : `سلام، سینا هستم — از ۱۴۰۱ شوهای LiveShop را با کتونی‌های کمیاب گرم کرده‌ام. تخصص من از روز اول یک چیز بوده: کتونی اورجینال با قیمت منصفانه. هر جعبه را قبل از پخش خودم باز می‌کنم، عکس‌های واقعی می‌گیرم و تگ و جعبه را جلوی دوربین نشان می‌دهم.

خرید ساده است: کالا را در لایو ببین، همان لحظه بخر و کد رهگیری تیپاکس را حداکثر تا ${toFa(SHIPPING_DEADLINE_HOURS)} ساعت بعد بگیر. اگر کالا مطابق توضیحات نبود، ۷ روز فرصت داری برگردانی — بدون چانه‌زنی.

همین وسواس، بیش از ۱٬۲۴۰ خرید موفق و ۴٫۹ ستاره برایم رقم زده. قول من ساده است: اورجینال یا برگشت کامل پول.`,
  totalSalesLabel: "۱٬۲۴۰",
  sinceLabel: "از ۱۴۰۱",
  policies: [
    {
      emoji: "📦",
      title: "ارسال ۲۴ ساعتهٔ تیپاکس",
      desc: "هر سفارش تا ۲۴ ساعت بعد از اسکن، روی جاده است.",
    },
    {
      emoji: "🔄",
      title: "بازگشت ۷ روزه",
      desc: "اگر کالا با توضیحات فرق داشت، بدون پرسش برگردان.",
    },
    {
      emoji: "🛡️",
      title: "تضمین اصالت",
      desc: "همهٔ کتونی‌ها با چک اصالت و کارت اورجینال ارسال می‌شوند.",
    },
  ],
  reviews: [
    {
      name: "reza_vault",
      emoji: "💎",
      color: "#00C896",
      rating: 5,
      text: "جردن ۱ رسید، جعبه سالم و تگ اورجینال — سریع‌ترین ارسالی بود که تا حالا داشتم.",
      atLabel: "۲ روز پیش",
      itemTitle: "جردن ۱ مید «شیکاگو»",
    },
    {
      name: "sara_snkrs",
      emoji: "🎀",
      color: "#6C5CFF",
      rating: 5,
      text: "نیوبالانس دقیقاً مثل عکس‌های شو بود؛ بسته‌بندی با استیکر هدیه هم اومد",
      atLabel: "۵ روز پیش",
      itemTitle: "نیوبالانس ۵۳۰ خاکستری",
    },
    {
      name: "ali_rezaei",
      emoji: "🧢",
      color: "#FF3B8B",
      rating: 5,
      text: "شو آخر هفته فوق‌العاده بود و پشتیبانی سریع جواب سؤال سایز را داد.",
      atLabel: "۱ هفته پیش",
      itemTitle: "آسیکس جی‌تی-۲۰۰۰ رانینگ",
    },
    {
      name: "mina_k72",
      emoji: "🌸",
      color: "#B45CFF",
      rating: 5,
      text: "صندل چرم عالی بود و کارت اصالت داخل جعبه — حس اعتماد کامل.",
      atLabel: "۲ هفته پیش",
      itemTitle: "صندل تابستانی چرم طبیعی",
    },
  ],
};

/* ── تنظیمات فروشنده ── */
/** شبای تسویهٔ ماسک‌شده — با dir="ltr" نمایش داده می‌شود */
export const SHEBA_MASKED = "IR-****-۵۴۲۱-****";

export interface NotifPref {
  id: string;
  title: string;
  desc: string;
  on: boolean;
}

export const NOTIF_PREFS: NotifPref[] = [
  {
    id: "new-order",
    title: "سفارش جدید",
    desc: "به‌محض ثبت سفارش خبرت کن",
    on: true,
  },
  /* v1.7.1 — اعلان «بید بالاتر» فقط به حالت حراج تعلق دارد */
  ...(AUCTION_ENABLED
    ? [
        {
          id: "outbid",
          title: "بید بالاتر",
          desc: "مزایدهٔ کالایت گرم شد — بید جدید ثبت شد",
          on: true,
        } satisfies NotifPref,
      ]
    : [
        {
          id: "low-stock",
          title: "کالای نایاب",
          desc: "وقتی موجودی یک کالا رو به تمام شدن می‌رود خبرت کن",
          on: true,
        } satisfies NotifPref,
      ]),
  {
    id: "buyer-msg",
    title: "پیام خریدار",
    desc: "پیام‌های صندوق ورودی خریداران",
    on: true,
  },
  {
    id: "payout",
    title: "تسویه انجام شد",
    desc: "واریز هفتگی به شبای ثبت‌شده",
    on: false,
  },
];

/** متن‌های کارت ناحیهٔ خطر */
export const DANGER = {
  storeCloseTitle: "تعطیلی موقت فروشگاه",
  storeCloseDesc: "با روشن بودن، شوی جدید نمی‌توانی شروع کنی و لیستینگ‌ها مخفی می‌شوند.",
  deleteAccountTitle: "حذف حساب",
  deleteAccountDesc: "حذف حساب قطعی است — دمو: اتفاقی نمی‌افتد",
  deleteAccountHint: "همهٔ شوها، سفارش‌ها و آمار فروش برای همیشه پاک می‌شود.",
  confirmLabel: "بله، حذف کن",
  cancelLabel: "انصراف",
} as const;
