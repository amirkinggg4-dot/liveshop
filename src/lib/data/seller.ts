import type { Cover } from "./types";

/* ─────────────────────────────────────────────────────────────
   LiveShop — داده‌های سمت فروشنده (فاز ۲ — Whatnot-Atlas)
   فروشندهٔ مرجع: «کفش‌خانهٔ سینا» (s1)
   شوهای زمان‌بندی‌شده، سفارش‌های فروشنده، درآمد و تسویه،
   انبار و پیش‌نویس‌ها، بیننده‌های حاضر و آمار هاب فروشنده.
   همهٔ مبالغ به «تومان» هستند و اعداد در UI فارسی نمایش داده می‌شوند.
   ───────────────────────────────────────────────────────────── */

/* ── شوهای زمان‌بندی‌شدهٔ فروشنده ── */
export interface SellerScheduledShow {
  id: string;
  title: string;
  /** مثل «کتونی و کفش» */
  category: string;
  /** مثل «پنج‌شنبه ۲۱:۰۰» */
  whenLabel: string;
  itemsCount: number;
  /** پیش‌بید فعال است */
  prebid: boolean;
  /** گیواوی در شروع شو */
  giveaway: boolean;
  /** هم‌میزبانی */
  cohost: boolean;
  /** پین کامنت */
  pinComment: boolean;
  cover: Cover;
}

export const SELLER_SCHEDULED_SHOWS: SellerScheduledShow[] = [
  {
    id: "sch1",
    title: "شب کتونی ۲ — نسخهٔ ویژه",
    category: "کتونی و کفش",
    whenLabel: "پنج‌شنبه ۲۱:۰۰",
    itemsCount: 26,
    prebid: true,
    giveaway: false,
    cohost: false,
    pinComment: false,
    cover: { from: "#FF3B8B", to: "#6C5CFF", emoji: "👟" },
  },
  {
    id: "sch2",
    title: "شب کتونی ۳ — ویژهٔ آخر هفته",
    category: "کتونی و کفش",
    whenLabel: "جمعه ۲۲:۰۰",
    itemsCount: 18,
    prebid: true,
    giveaway: true,
    cohost: true,
    pinComment: false,
    cover: { from: "#6C5CFF", to: "#1b1729", emoji: "👟" },
  },
];

/* ── سفارش‌های فروشنده (لاتینِ id در دیتا — UI با toFa فارسی می‌کند) ── */
export type SellerOrderStatus = "to_scan" | "shipped" | "completed" | "issue";

export interface SellerOrder {
  id: string;
  itemTitle: string;
  itemBrand?: string;
  emoji: string;
  cover: Cover;
  buyerName: string;
  buyerEmoji: string;
  /** hex برند برای آواتار خریدار */
  buyerColor: string;
  buyerVip?: boolean;
  /** تومان */
  itemPrice: number;
  shippingPrice: number;
  shippingMethod: "tipax" | "post" | "peyk";
  total: number;
  status: SellerOrderStatus;
  /** مثل «۶ ساعت» یا «۱ روز و ۴ ساعت» */
  scanByLabel: string;
  /** رنگ بج مهلت: ok سبز / warn زرد(amber) / late قرمز */
  urgency: "ok" | "warn" | "late";
  trackingCode?: string;
  /** مثل «خریدار ۵ ستاره ثبت کرد ★» */
  reviewLabel?: string;
  /** متن اختلاف برای سفارش مشکل‌دار */
  issueText?: string;
  issueResolved?: boolean;
  /** مثل «دیشب ۲۳:۴۰» */
  createdAtLabel: string;
}

export const SELLER_ORDERS: SellerOrder[] = [
  {
    id: "8841",
    itemTitle: "آسیکس جی‌تی-۲۰۰۰ رانینگ",
    itemBrand: "آسیکس",
    emoji: "👟",
    cover: { from: "#6C5CFF", to: "#0b5f4a", emoji: "🏃" },
    buyerName: "reza_vault",
    buyerEmoji: "💎",
    buyerColor: "#00C896",
    buyerVip: true,
    itemPrice: 5_200_000,
    shippingPrice: 45_000,
    shippingMethod: "tipax",
    total: 5_245_000,
    status: "to_scan",
    scanByLabel: "۳ ساعت — نزدیک مهلت!",
    urgency: "late",
    createdAtLabel: "دیشب ۲۳:۴۰",
  },
  {
    id: "8840",
    itemTitle: "صندل تابستانی چرم طبیعی",
    itemBrand: "چرم مشهد",
    emoji: "🩴",
    cover: { from: "#FFB454", to: "#7c2d12", emoji: "🩴" },
    buyerName: "mina_k72",
    buyerEmoji: "🌸",
    buyerColor: "#B45CFF",
    itemPrice: 1_800_000,
    shippingPrice: 30_000,
    shippingMethod: "post",
    total: 1_830_000,
    status: "to_scan",
    scanByLabel: "۶ ساعت",
    urgency: "warn",
    createdAtLabel: "امروز ۰۹:۲۰",
  },
  {
    id: "8839",
    itemTitle: "نایک دَنک لو «پاندا»",
    itemBrand: "نایک",
    emoji: "👟",
    cover: { from: "#FF3B8B", to: "#6C5CFF", emoji: "👟" },
    buyerName: "sole_hunter",
    buyerEmoji: "👟",
    buyerColor: "#FF3B8B",
    buyerVip: true,
    itemPrice: 4_800_000,
    shippingPrice: 45_000,
    shippingMethod: "tipax",
    total: 4_845_000,
    status: "to_scan",
    scanByLabel: "۱ روز و ۴ ساعت",
    urgency: "ok",
    createdAtLabel: "امروز ۱۲:۰۵",
  },
  {
    id: "8838",
    itemTitle: "ست ۳ عددی جوراب ورزشی",
    itemBrand: "لایف اسپرت",
    emoji: "🧦",
    cover: { from: "#FF3B8B", to: "#FFB454", emoji: "🧦" },
    buyerName: "sara_snkrs",
    buyerEmoji: "🎀",
    buyerColor: "#6C5CFF",
    itemPrice: 380_000,
    shippingPrice: 25_000,
    shippingMethod: "peyk",
    total: 405_000,
    status: "to_scan",
    scanByLabel: "۲ روز",
    urgency: "ok",
    createdAtLabel: "امروز ۱۴:۴۸",
  },
  {
    id: "8835",
    itemTitle: "جردن ۱ مید «شیکاگو»",
    itemBrand: "جردن",
    emoji: "👟",
    cover: { from: "#FF3B8B", to: "#7a1030", emoji: "🧡" },
    buyerName: "ali_rezaei",
    buyerEmoji: "🧢",
    buyerColor: "#6C5CFF",
    itemPrice: 4_200_000,
    shippingPrice: 45_000,
    shippingMethod: "tipax",
    total: 4_245_000,
    status: "shipped",
    scanByLabel: "به‌موقع اسکن شد",
    urgency: "ok",
    trackingCode: "TPX-482910",
    createdAtLabel: "دیشب ۲۲:۱۰",
  },
  {
    id: "8833",
    itemTitle: "کولهٔ ورزشی ضدآب ۳۰ لیتری",
    itemBrand: "ادون",
    emoji: "🎒",
    cover: { from: "#1b1729", to: "#6C5CFF", emoji: "🎒" },
    buyerName: "kian_plant",
    buyerEmoji: "🌵",
    buyerColor: "#00C896",
    itemPrice: 1_450_000,
    shippingPrice: 30_000,
    shippingMethod: "post",
    total: 1_480_000,
    status: "shipped",
    scanByLabel: "به‌موقع اسکن شد",
    urgency: "ok",
    trackingCode: "TPX-481752",
    createdAtLabel: "۲ روز پیش",
  },
  {
    id: "8830",
    itemTitle: "نیوبالانس ۵۳۰ خاکستری",
    itemBrand: "نیوبالانس",
    emoji: "👟",
    cover: { from: "#00C896", to: "#155e75", emoji: "👟" },
    buyerName: "sara_snkrs",
    buyerEmoji: "🎀",
    buyerColor: "#6C5CFF",
    itemPrice: 3_900_000,
    shippingPrice: 25_000,
    shippingMethod: "peyk",
    total: 3_925_000,
    status: "completed",
    scanByLabel: "به‌موقع اسکن شد",
    urgency: "ok",
    trackingCode: "TPX-479920",
    reviewLabel: "خریدار ۵ ستاره ثبت کرد ★",
    createdAtLabel: "۳ روز پیش",
  },
  {
    id: "8827",
    itemTitle: "ادیداس سامبا اورجینال",
    itemBrand: "ادیداس",
    emoji: "👟",
    cover: { from: "#6C5CFF", to: "#1b1729", emoji: "👟" },
    buyerName: "sole_hunter",
    buyerEmoji: "👟",
    buyerColor: "#FF3B8B",
    buyerVip: true,
    itemPrice: 3_600_000,
    shippingPrice: 45_000,
    shippingMethod: "tipax",
    total: 3_645_000,
    status: "issue",
    scanByLabel: "۱ روز برای پاسخ",
    urgency: "warn",
    trackingCode: "TPX-476115",
    issueText: "خریدار می‌گوید جعبه آسیب دیده — منتظر پاسخ شماست",
    issueResolved: false,
    createdAtLabel: "۴ روز پیش",
  },
];

/* ── درآمد و تسویه فروشنده ── */
export interface SellerPayout {
  id: string;
  amount: number;
  atLabel: string;
  method: string;
  status: string;
}

export interface SellerRevenue {
  /** موجودی قابل برداشت تومان */
  available: number;
  /** در حال تسویه */
  pendingClearing: number;
  /** درآمد کل */
  lifetime: number;
  nextPayoutLabel: string;
  shebaMasked: string;
  lastShow: {
    title: string;
    gross: number;
    commissionPct: number;
    commission: number;
    processingPct: number;
    processingFlat: number;
    processing: number;
    net: number;
  };
  tiers: { label: string; pct: number }[];
  payouts: SellerPayout[];
}

export const SELLER_REVENUE: SellerRevenue = {
  available: 12_405_000,
  pendingClearing: 8_802_000,
  lifetime: 482_130_000,
  nextPayoutLabel: "پنج‌شنبه — تسویهٔ خودکار هفتگی",
  shebaMasked: "IR۶۲۰۴ **** ۴۵۰۹ **** ۲۱",
  lastShow: {
    title: "شب کتونی‌های کمیاب",
    gross: 21_500_000,
    commissionPct: 8,
    commission: 1_720_000,
    processingPct: 2.9,
    processingFlat: 30_000,
    processing: 653_500,
    net: 19_126_500,
  },
  tiers: [
    { label: "تا ۱۰۰ میلیون تومان فروش", pct: 8 },
    { label: "بعد از ۱۰۰ میلیون تومان", pct: 5 },
    { label: "بعد از ۵۰۰ میلیون تومان", pct: 3 },
  ],
  payouts: [
    { id: "po1", amount: 19_126_500, atLabel: "هفتهٔ قبل", method: "شبا", status: "واریز شد" },
    { id: "po2", amount: 17_480_000, atLabel: "۲ هفتهٔ قبل", method: "شبا", status: "واریز شد" },
    { id: "po3", amount: 15_930_000, atLabel: "۳ هفتهٔ قبل", method: "شبا", status: "واریز شد" },
    { id: "po4", amount: 21_640_000, atLabel: "۴ هفتهٔ قبل", method: "شبا", status: "واریز شد" },
  ],
};

/* ── اطلاعات تکمیلی انبار — keyed by SKU از ITEMS_SH1 ──
   SNK-A101 دَنک پاندا / A102 سامبا / A103 جردن ۱ / A104 نیوبالانس ۵۳۰
   A105 صندل / A106 آسیکس / A107 جوراب / A108 کولهٔ ضدآب */
export const INVENTORY_EXTRAS: Record<string, { weightGrams: number }> = {
  "SNK-A101": { weightGrams: 950 },
  "SNK-A102": { weightGrams: 900 },
  "SNK-A103": { weightGrams: 1050 },
  "SNK-A104": { weightGrams: 880 },
  "SNK-A105": { weightGrams: 600 },
  "SNK-A106": { weightGrams: 850 },
  "SNK-A107": { weightGrams: 120 },
  "SNK-A108": { weightGrams: 650 },
};

/* ── پیش‌نویس‌های آگهی ── */
export interface InventoryDraft {
  id: string;
  title: string;
  brand: string;
  emoji: string;
  cover: Cover;
  /** چه چیزهایی ناقص است، مثل ["عکس اصلی","قیمت شروع"] */
  missing: string[];
}

export const INVENTORY_DRAFTS: InventoryDraft[] = [
  {
    id: "dr1",
    title: "آدیداس گازل",
    brand: "ادیداس",
    emoji: "👟",
    cover: { from: "#B45CFF", to: "#6C5CFF", emoji: "👟" },
    missing: ["عکس اصلی", "قیمت شروع"],
  },
  {
    id: "dr2",
    title: "واکس کتانی حرفه‌ای",
    brand: "کیری",
    emoji: "🧴",
    cover: { from: "#00C896", to: "#155e75", emoji: "🧴" },
    missing: ["عکس اصلی"],
  },
];

/* ── بیننده‌های حاضر در لایو فروشنده (هماهنگ با BOTS در live-store) ── */
export interface WatchingViewer {
  name: string;
  emoji: string;
  color: string;
  badge?: "VIP" | "خریدار ثابت" | "تازه‌وارد";
  /** تعداد خرید قبلی */
  purchases: number;
}

export const WATCHING_VIEWERS: WatchingViewer[] = [
  { name: "reza_vault", emoji: "💎", color: "#00C896", badge: "VIP", purchases: 14 },
  { name: "mina_k72", emoji: "🌸", color: "#B45CFF", badge: "خریدار ثابت", purchases: 9 },
  { name: "sole_hunter", emoji: "👟", color: "#FF3B8B", badge: "VIP", purchases: 21 },
  { name: "kian_plant", emoji: "🌵", color: "#00C896", purchases: 3 },
  { name: "sara_snkrs", emoji: "🎀", color: "#6C5CFF", badge: "تازه‌وارد", purchases: 1 },
  { name: "ali_rezaei", emoji: "🧢", color: "#6C5CFF", badge: "خریدار ثابت", purchases: 7 },
];

/* ── آماده‌باش اتاق لایو (قبل از شروع شو) ── */
export const READY_ROOM = {
  connectionLabel: "عالی",
  latencyMs: 45,
  remindersSent: 1204,
  followersNotified: 512,
  queueShowTitle: "شب کتونی‌های کمیاب 🔥",
} as const;

/* ── آمار هاب فروشنده ── */
export const HUB_STATS = {
  scheduledShows: 2,
  liveShows: 1,
  /** آگهی‌های فعال مثل اطلس */
  activeListings: 142,
  marketingLabel: "۱ کد تخفیف فعال",
  analyticsLabel: "GMV +۱۸٪",
  healthOk: true,
  healthLabel: "همه‌چیز خوب",
  onTimeScanPct: 92,
  defectFreePct: 97,
} as const;

/* ── توضیح پلکان کارمزد ── */
export const COMMISSION_NOTE =
  "پلکان کارمزد: با رشد فروش کل، کمیسیون از ۸٪ به ۵٪ و سپس ۳٪ می‌رسد — آستانه‌ها در همین صفحه شفاف است.";
