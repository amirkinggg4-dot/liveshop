/* ─────────────────────────────────────────────────────────────
   LiveShop — آنالیتیکس و سلامت اکانت فروشنده (فاز ۳ — Atlas ۳۰ و ۳۱)
   فروشندهٔ مرجع: «کفش‌خانهٔ سینا» (s1) — هماهنگ با اعداد seller.ts
   همهٔ اعداد به‌صورت JS number می‌مانند و در UI با faNum/toman فارسی می‌شوند.
   ───────────────────────────────────────────────────────────── */

import { AUCTION_ENABLED } from "@/lib/config";

/* ── دوره‌های آماری ── */
export const ANALYTIC_PERIODS = ["۷ روز", "۳۰ روز", "فصل"] as const;
export type AnalyticPeriod = (typeof ANALYTIC_PERIODS)[number];

export interface AnalyticKpis {
  /** فروش ناخالص — تومان */
  gmv: number;
  orders: number;
  viewers: number;
  /** درصد، مثل 2.4 */
  conversion: number;
  /** میانگین دقیقهٔ تماشا */
  watchMin: number;
  /** برچسب رشد ثابت هر دوره، مثل «+٪۱۲ نسبت به دورهٔ قبل» */
  deltaLabel: string;
}

export const ANALYTIC_KPIS: Record<AnalyticPeriod, AnalyticKpis> = {
  "۷ روز": {
    gmv: 18_500_000,
    orders: 64,
    viewers: 9_800,
    conversion: 2.4,
    watchMin: 11,
    deltaLabel: "+٪۱۲ نسبت به دورهٔ قبل",
  },
  "۳۰ روز": {
    gmv: 64_200_000,
    orders: 246,
    viewers: 38_500,
    conversion: 2.7,
    watchMin: 13,
    deltaLabel: "+٪۹ نسبت به دورهٔ قبل",
  },
  فصل: {
    gmv: 142_000_000,
    orders: 578,
    viewers: 86_000,
    conversion: 2.9,
    watchMin: 14,
    deltaLabel: "+٪۲۳ نسبت به دورهٔ قبل",
  },
};

/* ── روند فروش ۸ هفته (تومان) — هماهنگ با تسویه‌های SELLER_REVENUE ── */
export interface WeekPoint {
  label: string;
  /** تومان */
  value: number;
}

export const REVENUE_SERIES: WeekPoint[] = [
  { label: "هفته ۱", value: 8_200_000 },
  { label: "هفته ۲", value: 9_500_000 },
  { label: "هفته ۳", value: 8_900_000 },
  { label: "هفته ۴", value: 12_400_000 },
  { label: "هفته ۵", value: 14_800_000 },
  { label: "هفته ۶", value: 13_200_000 },
  { label: "هفته ۷", value: 21_500_000 },
  { label: "هفته ۸", value: 25_800_000 },
];

/* ── قیف تبدیل شو ──
   v1.7.1 — برچسب‌ها برای فروش قیمت ثابت: «شروع خرید» و «خریدار»
   (نسخهٔ حراج با برچسب‌های قبلی در همان ساختار پشت فلگ می‌ماند)؛
   اعداد و رنگ‌ها هم‌شکل قبلی. */
export interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

export const FUNNEL: FunnelStep[] = [
  { label: "بازدید شو", value: 12_400, color: "#6C5CFF" },
  { label: "تماشای +۱ دقیقه", value: 7_200, color: "#8a7dff" },
  ...(AUCTION_ENABLED
    ? [
        { label: "بیدگذار", value: 1_860, color: "#FF3B8B" },
        { label: "برنده", value: 312, color: "#00C896" },
      ]
    : [
        { label: "شروع خرید", value: 1_860, color: "#FF3B8B" },
        { label: "خریدار", value: 312, color: "#00C896" },
      ]),
];

/* ── پرفروش‌ترین‌ها (تم کتونی، هماهنگ با انبار سینا) ── */
export interface TopItem {
  title: string;
  emoji: string;
  soldCount: number;
  /** تومان */
  gmv: number;
}

export const TOP_ITEMS: TopItem[] = [
  { title: "نایک دَنک لو «پاندا»", emoji: "👟", soldCount: 14, gmv: 41_600_000 },
  { title: "ادیداس سامبا اورجینال", emoji: "👟", soldCount: 11, gmv: 33_000_000 },
  { title: "جردن ۱ مید «شیکاگو»", emoji: "🧡", soldCount: 9, gmv: 28_800_000 },
  { title: "نیوبالانس ۵۳۰ خاکستری", emoji: "👟", soldCount: 8, gmv: 19_200_000 },
  { title: "آسیکس جی‌تی-۲۰۰۰ رانینگ", emoji: "🏃", soldCount: 6, gmv: 17_400_000 },
];

/* ── نقشهٔ حرارتی بیننده بر اساس ساعت — پیک در ۲۱ ── */
export interface HeatHour {
  label: string;
  /** شدت ۰..۱۰۰ */
  value: number;
}

export const HEAT_HOURS: HeatHour[] = [
  { label: "۱۲", value: 24 },
  { label: "۱۴", value: 31 },
  { label: "۱۵", value: 42 },
  { label: "۱۶", value: 38 },
  { label: "۱۷", value: 47 },
  { label: "۱۸", value: 55 },
  { label: "۱۹", value: 68 },
  { label: "۲۰", value: 84 },
  { label: "۲۱", value: 100 },
  { label: "۲۲", value: 76 },
  { label: "۲۳", value: 49 },
  { label: "۰۰", value: 27 },
];

/** برچسب ثابت زیر نقشهٔ حرارتی */
export const HEAT_PEAK_LABEL = "پیک بیننده: ۲۱:۰۰ — جمعه‌شب";

/* ─────────────────────────────────────────────────────────────
   سلامت اکانت فروشنده (Atlas ۳۰)
   ───────────────────────────────────────────────────────────── */

/** امتیاز کلی سلامت ۰..۱۰۰ */
export const HEALTH_SCORE = 92;

export type HealthStatus = "good" | "warn";

export interface HealthMetric {
  id: string;
  label: string;
  /** مقدار از پیش قالب‌بندی‌شدهٔ فارسی، مثل «٪۹۲» یا «۲ سفارش» */
  value: string;
  status: HealthStatus;
  detail: string;
}

export const HEALTH_METRICS: HealthMetric[] = [
  {
    id: "scan",
    label: "نرخ اسکن به‌موقع",
    value: "٪۹۲",
    status: "good",
    detail: "آستانهٔ سالم ٪۸۰ است — سفارش‌ها را همان روز اسکن کن",
  },
  {
    id: "defect",
    label: "نرخ اختلاف",
    value: "٪۰٫۸",
    status: "good",
    detail: "از هر ۱۰۰ سفارش کمتر از ۱ مورد اختلاف باز شده",
  },
  {
    id: "delay",
    label: "تأخیر ارسال",
    value: "۲ سفارش",
    status: "warn",
    detail: "هفتهٔ گذشته ۲ سفارش دیرتر از موعد به دست خریدار رسید",
  },
  {
    id: "listing",
    label: "کیفیت لیستینگ",
    value: "۸٫۶ از ۱۰",
    status: "good",
    detail: "عکس اصلی و وزن در بیشتر آگهی‌ها کامل ثبت شده",
  },
  {
    id: "response",
    label: "سرعت پاسخ",
    value: "۴۵ دقیقه",
    status: "good",
    detail: "میانگین زمان پاسخ به پیام خریدارها",
  },
  {
    id: "violation",
    label: "تخلف قوانین",
    value: "۰",
    status: "good",
    detail: "هیچ گزارش تخلف فعالی وجود ندارد",
  },
];

export interface HealthTask {
  id: string;
  title: string;
  impact: string;
  done: boolean;
}

export const HEALTH_TASKS: HealthTask[] = [
  { id: "t1", title: "به‌روزرسانی وزن ۳ لیستینگ", impact: "+۲ امتیاز", done: false },
  { id: "t2", title: "پاسخ به اختلاف باز", impact: "+۲ امتیاز", done: false },
  { id: "t3", title: "فعال‌سازی تسویهٔ خودکار", impact: "+۲ امتیاز", done: false },
  {
    id: "t4",
    title: "ارسال فاکتور رسمی سفارش‌های بالای ۵ میلیون",
    impact: "+۲ امتیاز",
    done: false,
  },
];

/* ── وضعیت قوانین — هر سه فعال ── */
export interface PolicyRow {
  label: string;
  ok: boolean;
}

export const POLICY_ROWS: PolicyRow[] = [
  { label: "سیاست بازگشت ۷ روزه", ok: true },
  { label: "ارسال ۲۴ ساعته", ok: true },
  { label: "احراز هویت کامل", ok: true },
];

/** سه توصیهٔ ثابت برای ماندن بالای آستانهٔ ۸۰ */
export const HEALTH_TIPS: string[] = [
  "اسکن مرسوله‌ها را همان روزِ ثبت سفارش انجام بده",
  "به پیام خریدارها زیر ۲ ساعت پاسخ بده",
  "لیستینگ را کامل ثبت کن: عکس اصلی + وزن دقیق",
];
