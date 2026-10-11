import type { Cover } from "./types";
import { AUCTION_ENABLED } from "@/lib/config";

/* ─────────────────────────────────────────────────────────────
   LiveShop — فاز ۳ (P1) — باشگاه ریواردز (تصاویر ۳۳+۲۱)،
   پیش‌بید شوهای آینده و ضمانت خریدار/اختلافات (تصویر ۰۵).
   همهٔ مبالغ به «تومان» و اعداد ساده (فارسی‌سازی در UI با toFa/faNum).
   v1.7.1 — نشان‌ها/مأموریت‌ها/مزایا برای فروش قیمت ثابت بازنویسی
   شده‌اند؛ نسخهٔ حراج با همان ساختار پشت AUCTION_ENABLED حفظ می‌شود.
   ───────────────────────────────────────────────────────────── */

/* ── پروفایل ریواردز خریدار ── */
export interface RewardsProfile {
  points: number;
  streakWeeks: number;
  watchedShows: number;
  tierLabel: string;
}

export const REWARDS_PROFILE: RewardsProfile = {
  points: 640,
  streakWeeks: 5,
  watchedShows: 37,
  tierLabel: "نقره‌ای",
};

/* ── سطوح باشگاه ── */
export interface RewardTier {
  label: string;
  min: number;
  perks: string[];
}

export const REWARD_TIERS: RewardTier[] = [
  {
    label: "برنزی",
    min: 0,
    perks: AUCTION_ENABLED
      ? [
          "دسترسی به همهٔ شوهای عمومی",
          "مزایده و خرید فوری استاندارد",
          "نشان برنزی کنار اسم",
        ]
      : [
          "دسترسی به همهٔ شوهای عمومی",
          "خرید با قیمت ثابت در همهٔ لایوها",
          "نشان برنزی کنار اسم",
        ],
  },
  {
    label: "نقره‌ای",
    min: 500,
    perks: [
      "نشان نقره‌ای کنار اسم",
      "اولویت پشتیبانی",
      "۲٪ کش‌بک روی هر خرید",
    ],
  },
  {
    label: "طلایی",
    min: 1500,
    perks: [
      "نشان طلایی کنار اسم",
      "اولویت پشتیبانی",
      "دعوت شوهای خصوصی",
      "ارسال رایگان ماهانه",
    ],
  },
  {
    label: "الماسی",
    min: 4000,
    perks: [
      "نشان الماسی کنار اسم",
      "دعوت شوهای خصوصی",
      "مدیر اختصاصی پشتیبانی",
      "دسترسی زودهنگام به کالکشن‌های نایاب",
    ],
  },
];

/* ── نشان‌ها (۴ کسب‌شده + ۴ قفل) ── */
export interface RewardBadge {
  id: string;
  emoji: string;
  label: string;
  earned: boolean;
  earnedAtLabel?: string;
  howToEarn?: string;
}

const AUCTION_BADGES: RewardBadge[] = [
  { id: "bg1", emoji: "🥇", label: "اولین مزایدهٔ برده", earned: true, earnedAtLabel: "۳ هفته پیش" },
  { id: "bg5", emoji: "💎", label: "کلکسیونر الماسی", earned: false, howToEarn: "۱۰ مزایده را ببر" },
];

const FIXED_BADGES: RewardBadge[] = [
  { id: "bg1", emoji: "🥇", label: "اولین خرید لایو", earned: true, earnedAtLabel: "۳ هفته پیش" },
  { id: "bg5", emoji: "💎", label: "کلکسیونر الماسی", earned: false, howToEarn: "۱۰ خرید لایو" },
];

export const REWARD_BADGES: RewardBadge[] = [
  ...(AUCTION_ENABLED ? AUCTION_BADGES : FIXED_BADGES),
  {
    id: "bg2",
    emoji: "🛍",
    label: AUCTION_ENABLED ? "اولین خرید لایو" : "پنجمین خرید لایو",
    earned: true,
    earnedAtLabel: "۲ هفته پیش",
  },
  { id: "bg3", emoji: "🔥", label: "استریک ۴ هفته‌ای", earned: true, earnedAtLabel: "هفتهٔ پیش" },
  { id: "bg4", emoji: "⭐", label: "حاضر در ۳۰ شو", earned: true, earnedAtLabel: "این هفته" },
  { id: "bg6", emoji: "🎁", label: "مهمان‌نواز", earned: false, howToEarn: "۳ دوست را دعوت کن" },
  { id: "bg7", emoji: "🕵", label: "خریدار دقیق", earned: false, howToEarn: "۵ خرید بدون اختلاف ثبت کن" },
  { id: "bg8", emoji: "👑", label: "تاج طلایی", earned: false, howToEarn: "به سطح طلایی برس" },
];

/* ── مأموریت‌ها (مایلستون‌های امتیازی) ──
   ready = شرط دریافت کامل شده و دکمهٔ «دریافت امتیاز» فعال است. */
export interface RewardTask {
  id: string;
  title: string;
  desc: string;
  points: number;
  claimed: boolean;
  progressLabel?: string;
  ready?: boolean;
}

const AUCTION_TASKS: RewardTask[] = [
  {
    id: "rt3",
    title: "شرکت در ۵ مزایده",
    desc: "در ۵ مزایدهٔ زنده حداقل یک بید ثبت کن",
    points: 40,
    claimed: false,
    progressLabel: "۵ از ۵ مزایده ✅",
    ready: true,
  },
  {
    id: "rt4",
    title: "خرید با پیش‌بید",
    desc: "روی یک شو آینده پیش‌بید ثبت کن و برنده شو",
    points: 60,
    claimed: false,
    progressLabel: "۰ از ۱",
  },
];

const FIXED_TASKS: RewardTask[] = [
  {
    id: "rt3",
    title: "خرید در ۵ شو زنده",
    desc: "در ۵ شو زنده حداقل یک خرید با قیمت ثابت انجام بده",
    points: 40,
    claimed: false,
    progressLabel: "۵ از ۵ شو ✅",
    ready: true,
  },
  {
    id: "rt4",
    title: "یادآور شو آینده",
    desc: "برای یک شو آینده یادآور بگذار و در همان شو خرید کن",
    points: 60,
    claimed: false,
    progressLabel: "۰ از ۱",
  },
];

export const REWARD_TASKS: RewardTask[] = [
  {
    id: "rt1",
    title: "اولین خرید موفق",
    desc: "اولین سفارش لایو یا خرید فوری‌ات را کامل کن",
    points: 50,
    claimed: true,
    progressLabel: "تکمیل شد ✓",
  },
  {
    id: "rt2",
    title: "تماشای ۳ شو زنده این هفته",
    desc: "هفتهٔ جاری در ۳ شو زنده حداقل ۵ دقیقه حاضر باش",
    points: 30,
    claimed: false,
    progressLabel: "۳ از ۳ شو ✅",
    ready: true,
  },
  ...(AUCTION_ENABLED ? AUCTION_TASKS : FIXED_TASKS),
  {
    id: "rt5",
    title: "۵ هفته استریک پیوسته",
    desc: "۵ هفتهٔ متوالی هر هفته حداقل یک شو ببین",
    points: 100,
    claimed: false,
    progressLabel: "۵ از ۵ هفته ✅",
    ready: true,
  },
  {
    id: "rt6",
    title: "دعوت یک دوست",
    desc: "یک دوست را با لینک دعوت به LiveShop بیاور",
    points: 80,
    claimed: false,
    progressLabel: "۰ از ۱ دعوت",
  },
];

/* ── پیش‌بید (Pre-bid) — شو آینده: شبِ کتاب sh6 ── */
export const PREBID_SHOW_ID = "sh6";

export interface PrebidItem {
  id: string;
  title: string;
  brand: string;
  emoji: string;
  cover: Cover;
  startPrice: number;
  step: number;
  prebidCount: number;
}

export const PREBID_ITEMS: PrebidItem[] = [
  {
    id: "pb1",
    title: "شازده کوچولو — چاپ اول امضادار",
    brand: "انتشارات نغمه",
    emoji: "📕",
    cover: { from: "#00C896", to: "#155e75", emoji: "📕" },
    startPrice: 1_200_000,
    step: 100_000,
    prebidCount: 12,
  },
  {
    id: "pb2",
    title: "هزار و یک شب — نسخهٔ مصور نفیس",
    brand: "کتاب‌خانهٔ تهران",
    emoji: "📖",
    cover: { from: "#6C5CFF", to: "#3b2a86", emoji: "📖" },
    startPrice: 2_400_000,
    step: 150_000,
    prebidCount: 8,
  },
  {
    id: "pb3",
    title: "کمیک کلکسیونی نایاب — شمارهٔ ۱",
    brand: "کلکسیون‌یار تهران",
    emoji: "🗂",
    cover: { from: "#FF3B8B", to: "#7a1030", emoji: "🗂" },
    startPrice: 3_500_000,
    step: 200_000,
    prebidCount: 21,
  },
  {
    id: "pb4",
    title: "دفتر اسکریب امضادار نویسنده",
    brand: "شبِ کتاب",
    emoji: "✍️",
    cover: { from: "#00C896", to: "#0b5f4a", emoji: "✍️" },
    startPrice: 850_000,
    step: 50_000,
    prebidCount: 5,
  },
];

/* ── ضمانت خریدار و اختلافات (تصویر ۰۵) ── */
export const PROTECTION_REASONS: string[] = [
  "نرسیدن مرسوله",
  "مطابقت نداشتن با توضیحات",
  "آسیب‌دیدگی در حمل",
  "تقلبی بودن کالا",
  "دلایل دیگر",
];

export interface ProtectionCopy {
  title: string;
  subtitle: string;
  bullets: string[];
}

export const PROTECTION_COPY: ProtectionCopy = {
  title: "ضمانت خریدار",
  subtitle: "اگر کالا نرسید یا مطابقت نداشت، پولت محفوظ است",
  bullets: [
    "پول تا تأیید تو نزد LiveShop امانت می‌ماند",
    "باز کردن اختلاف تا ۷ روز پس از تحویل ممکن است",
    "کارشناسان تا ۲۴ ساعت پرونده را بررسی می‌کنند",
  ],
};

export type ProtectionCaseStatus = "submitted" | "in_review" | "resolved";

export interface ProtectionStep {
  label: string;
  done: boolean;
  atLabel?: string;
}

export interface ProtectionMessage {
  from: "buyer" | "support";
  text: string;
  atLabel: string;
}

export interface ProtectionCase {
  id: string;
  orderId: string;
  itemTitle: string;
  amount: number;
  reason: string;
  desc?: string;
  status: ProtectionCaseStatus;
  steps: ProtectionStep[];
  messages: ProtectionMessage[];
}

/* orderId واقعی از orders.ts (سفارش ۱۰۲۲۹ — در حال آماده‌سازی) */
export const PROTECTION_CASES: ProtectionCase[] = [
  {
    id: "case-1",
    orderId: "۱۰۲۲۹",
    itemTitle: "فیگور ناروتو سِیج مود",
    amount: 2_780_000,
    reason: "آسیب‌دیدگی در حمل",
    desc: "جعبهٔ فیگور در حین حمل له شده و دست فیگور شکسته است.",
    status: "in_review",
    steps: [
      { label: "ثبت شد", done: true, atLabel: "دیروز ۱۸:۲۰" },
      { label: "بررسی توسط کارشناس LiveShop", done: false },
      { label: "نتیجه و بازگشت وجه", done: false },
    ],
    messages: [
      {
        from: "buyer",
        text: "فیگور رسید اما جعبه و دستش آسیب دیده — عکس‌ها را در چت پشتیبانی فرستادم.",
        atLabel: "دیروز ۱۸:۲۰",
      },
      {
        from: "support",
        text: "سلام، پرونده‌ات ثبت شد. عکس‌ها بررسی می‌شود و تا ۲۴ ساعت نتیجه را اعلام می‌کنیم.",
        atLabel: "دیروز ۲۰:۰۵",
      },
    ],
  },
];
