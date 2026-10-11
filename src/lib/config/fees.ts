/* ─────────────────────────────────────────────────────────────
   LiveShop — تنظیمات مالی و کارمزد (v1.7.1)
   تک منبع عدد برای همهٔ کارمزدها و مهلت‌ها:
   UI و ماشین‌حساب فقط از همین فایل می‌خوانند (هیچ عدد کارمزدی
   دیگری در viewها یا دیتا هاردکد نمی‌شود).

   مقدار موقت — باید با درگاه و قوانین واقعی جایگزین شود
   ───────────────────────────────────────────────────────────── */

/* ── پلکان کمیسیون فروشنده ──
   هر پلکان: درصد کمیسیون برای فروش ماهانه تا سقف upTo تومان؛
   پلکان آخر (upTo = null) سقف ندارد. مرتب صعودی. */
export interface CommissionTier {
  /** سقف فروش ماهانهٔ این پلکان (تومان) — null = بدون سقف */
  upTo: number | null;
  /** درصد کمیسیون */
  pct: number;
}

export const COMMISSION_TIERS: CommissionTier[] = [
  { upTo: 50_000_000, pct: 8 },
  { upTo: 150_000_000, pct: 5 },
  { upTo: null, pct: 3 },
];

/* ── کارمزد پردازش درگاه ──
   درصدی از مبلغ + مبلغ ثابت به ازای هر تراکنش (تومان) */
export const GATEWAY_FEE = {
  pct: 2.9,
  flatToman: 30_000,
} as const;

/* ── هزینهٔ ارسال (تومان) به تفکیک روش ── */
export const SHIPPING_PRICES = {
  tipax: 45_000,
  post: 30_000,
  peyk: 25_000,
} as const;

export type ShippingPriceKey = keyof typeof SHIPPING_PRICES;

/* ── مهلت اسکن مرسوله (ساعت) ──
   حداکثر فاصلهٔ ثبت سفارش تا اسکن؛ زیر warnHours بج هشدار می‌شود */
export const SCAN_DEADLINE = {
  /** مهلت اسکن هر سفارش — ساعت */
  deadlineHours: 24,
  /** آستانهٔ هشدار «نزدیک مهلت» — ساعت */
  warnHours: 6,
} as const;

/* ── مهلت ارسال (ساعت) ──
   قول ارسال فروشنده بعد از اسکن — «ارسال ۲۴ ساعته» */
export const SHIPPING_DEADLINE_HOURS = 24;

/* ── مهلت واریز برداشت به شبا (ساعت) ── */
export const WITHDRAWAL_DEPOSIT_HOURS = 24;

/* ── v1.8.0 — امانی (escrow) ──
   آزادسازی خودکار مبلغ: N روز بعد از «تحویل‌شده» اگر خریدار آزادسازی نکرد
   و اختلافی ثبت نشده بود. */
export const ESCROW_AUTO_RELEASE_DAYS = 3;

/* ── v1.8.0 — پنجرهٔ ثبت اختلاف (ساعت) ──
   فقط از لحظهٔ «ارسال‌شده» تا ۷۲ ساعت بعد از «تحویل‌شده»؛
   قبل از ارسال، دکمهٔ اختلاف دیده نمی‌شود (به‌جایش «لغو سفارش»). */
export const DISPUTE_WINDOW_HOURS = 72;

/* ── v1.8.0 — سقف و کف شارژ کیف پول (تومان) ── */
export const WALLET_CHARGE = {
  minToman: 50_000,
  maxToman: 50_000_000,
} as const;

/* ─────────────────────────────────────────────────────────────
   محاسبات خالص — مصرف مشترک UI و تست (بدون وابستگی به استور)
   ───────────────────────────────────────────────────────────── */

/** درصد کمیسیون بر اساس فروش ماهانه (پلکان متناظر) */
export function commissionPctFor(monthlySalesToman: number): number {
  for (const tier of COMMISSION_TIERS) {
    if (tier.upTo == null || monthlySalesToman < tier.upTo) return tier.pct;
  }
  return COMMISSION_TIERS[COMMISSION_TIERS.length - 1].pct;
}

export interface NetIncomeResult {
  /** مبلغ فروش (تومان) */
  price: number;
  /** درصد کمیسیون اعمال‌شده */
  commissionPct: number;
  /** مبلغ کمیسیون (تومان) */
  commission: number;
  /** مبلغ پردازش درگاه (تومان) */
  processing: number;
  /** خالص فروشنده (تومان) */
  net: number;
}

/** ماشین‌حساب خالص درآمد — کمیسیون پلکانی (بر اساس فروش ماهانه) + پردازش درگاه */
export function calcNetIncome(
  price: number,
  monthlySalesToman: number
): NetIncomeResult {
  const safePrice = Number.isFinite(price) && price > 0 ? Math.floor(price) : 0;
  const commissionPct = commissionPctFor(monthlySalesToman);
  const commission = Math.round((safePrice * commissionPct) / 100);
  const processing =
    Math.round((safePrice * GATEWAY_FEE.pct) / 100) + GATEWAY_FEE.flatToman;
  const net = safePrice - commission - processing;
  return { price: safePrice, commissionPct, commission, processing, net };
}

/* ── v1.8.0 — محاسبهٔ واحد جمع سفارش (قیمت + ارسال) ──
   تک منطق مشترک «تسویه» و «شیت خرید سریع لایو» و موتور خرید —
   همه از همین تابع می‌خوانند تا هیچ‌جا جمع سفارش جداگانه حساب نشود. */
export interface OrderTotalsInput {
  /** قیمت واحد کالا (تومان) */
  unitPrice: number;
  /** تعداد — حداقل ۱؛ اعشاری به پایین گرد می‌شود */
  qty?: number;
  /** هزینهٔ ارسال روش انتخابی (تومان) */
  shippingFee: number;
}

export interface OrderTotals {
  /** قیمت کل کالا (واحد × تعداد) */
  itemsTotal: number;
  /** هزینهٔ ارسال */
  shippingFee: number;
  /** جمع قابل پرداخت */
  total: number;
  /** تعداد نرمال‌شدهٔ اعمال‌شده */
  qty: number;
}

/** ورودی نامعتبر → خطای فارسی؛ خروجی همیشه صحیح و صحیح‌عدد */
export function calcOrderTotal(input: OrderTotalsInput): OrderTotals {
  const unitPrice = Number.isFinite(input.unitPrice)
    ? Math.max(0, Math.floor(input.unitPrice))
    : 0;
  const shippingFee = Number.isFinite(input.shippingFee)
    ? Math.max(0, Math.floor(input.shippingFee))
    : 0;
  const rawQty = input.qty ?? 1;
  const qty =
    Number.isFinite(rawQty) && rawQty >= 1 ? Math.max(1, Math.floor(rawQty)) : 1;
  const itemsTotal = unitPrice * qty;
  return { itemsTotal, shippingFee, total: itemsTotal + shippingFee, qty };
}
