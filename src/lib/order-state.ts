/* ─────────────────────────────────────────────────────────────
   LiveShop v1.8.0 — ماشین وضعیت سفارش (ماژول خالص)
   وضعیت‌ها دقیقاً هم‌نام با enum OrderStatus در prisma/schema.prisma:
   PAID_HELD | READY_TO_SHIP | SHIPPED | DELIVERED | RELEASED |
   DISPUTED | REFUNDED | CANCELED

   قواعد (برگرفته از مشخصات):
   ─ لغو: فقط قبل از ارسال (PAID_HELD/READY_TO_SHIP)؛ مبلغ فوراً
     به کیف پول برمی‌گردد (REFUNDED/ledger mock) — مبلغ بازپرداخت = کل مبلغ.
   ─ تحویل: فقط SHIPPED → DELIVERED با تأیید خریدار («تحویل گرفتم»).
   ─ آزادسازی: فقط DELIVERED → RELEASED با تأیید خریدار یا خودکار بعد از
     ESCROW_AUTO_RELEASE_DAYS روز (از config/fees)؛ idempotent.
   ─ اختلاف: فقط از SHIPPED تا DISPUTE_WINDOW_HOURS ساعت بعد از DELIVERED؛
     قبل از ارسال اصلاً دکمهٔ اختلاف نیست (به‌جایش «لغو سفارش»).
     نتیجهٔ اختلاف: REFUNDED (بازپرداخت) یا RELEASED (آزادسازی به فروشنده).

   هیچ وابستگی به استور/React ندارد — فقط توابع خالص + ثابت‌ها.
   ───────────────────────────────────────────────────────────── */

import {
  DISPUTE_WINDOW_HOURS,
  ESCROW_AUTO_RELEASE_DAYS,
} from "@/lib/config/fees";

/* ── وضعیت‌ها — هم‌نام با پرisma ── */
export const ORDER_STATUSES = [
  "PAID_HELD",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "RELEASED",
  "DISPUTED",
  "REFUNDED",
  "CANCELED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** وضعیت‌های پایانی — هیچ انتقالی از آن‌ها مجاز نیست */
export const TERMINAL_STATUSES: readonly OrderStatus[] = [
  "RELEASED",
  "REFUNDED",
  "CANCELED",
];

/* ── جدول انتقال‌های مجاز ──
   PAID_HELD → READY_TO_SHIP: فروشنده سفارش را آماده/اسکن کرد (سمت فروشنده)
   هر کلید = فقط مقصدهای مجاز از آن وضعیت. */
export const ORDER_TRANSITIONS: Readonly<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  PAID_HELD: ["READY_TO_SHIP", "CANCELED"],
  READY_TO_SHIP: ["SHIPPED", "CANCELED"],
  SHIPPED: ["DELIVERED", "DISPUTED"],
  DELIVERED: ["RELEASED", "DISPUTED"],
  /* نتیجهٔ اختلاف توسط کارشناس: بازپرداخت یا آزادسازی به فروشنده */
  DISPUTED: ["REFUNDED", "RELEASED"],
  RELEASED: [],
  REFUNDED: [],
  CANCELED: [],
};

/** آیا انتقال from → to مجاز است؟ */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

/* ── برچسب فارسی روشن هر وضعیت (برچسب‌های خواسته‌شده) ── */
export const ORDER_STATUS_LABEL: Readonly<Record<OrderStatus, string>> = {
  PAID_HELD: "در انتظار ارسال",
  READY_TO_SHIP: "در انتظار ارسال",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  RELEASED: "مبلغ آزاد شد",
  DISPUTED: "در بررسی اختلاف",
  CANCELED: "لغو شد",
  REFUNDED: "مسترد شد",
};

/* ── خوشه‌های تب فهرست سفارش‌ها ── */
export type OrderTabId = "all" | "active" | "delivered" | "closed";

export const ORDER_TABS: Readonly<
  { id: OrderTabId; label: string; statuses: readonly OrderStatus[] | null }[]
> = [
  { id: "all", label: "همه", statuses: null },
  {
    id: "active",
    label: "جاری",
    statuses: ["PAID_HELD", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "DISPUTED"],
  },
  { id: "delivered", label: "تحویل‌شده", statuses: ["DELIVERED", "RELEASED"] },
  { id: "closed", label: "لغو و مسترد", statuses: ["CANCELED", "REFUNDED"] },
];

export function orderMatchesTab(status: OrderStatus, tab: OrderTabId): boolean {
  const def = ORDER_TABS.find((t) => t.id === tab);
  if (!def || def.statuses === null) return true;
  return def.statuses.includes(status);
}

/* ── نگاشت کلید دموی ?orderStage= به وضعیت ── */
export type OrderStageKey =
  | "paid"
  | "ready"
  | "shipped"
  | "delivered"
  | "released"
  | "disputed"
  | "canceled";

export const ORDER_STAGE_KEY_TO_STATUS: Readonly<
  Record<OrderStageKey, OrderStatus>
> = {
  paid: "PAID_HELD",
  ready: "READY_TO_SHIP",
  shipped: "SHIPPED",
  delivered: "DELIVERED",
  released: "RELEASED",
  disputed: "DISPUTED",
  canceled: "CANCELED",
};

/* ─────────────────────────────────────────────────────────────
   شرط‌های زمان‌دار (همه با nowMs صریح — زمان mock در تست‌ها)
   ───────────────────────────────────────────────────────────── */

/** لغو توسط خریدار — فقط قبل از ارسال */
export function canCancel(status: OrderStatus): boolean {
  return status === "PAID_HELD" || status === "READY_TO_SHIP";
}

/** تأیید تحویل — فقط وقتی مرسوله ارسال شده */
export function canConfirmDelivery(status: OrderStatus): boolean {
  return status === "SHIPPED";
}

/** پنجرهٔ اختلاف: از SHIPPED تا ۷۲ ساعت بعد از DELIVERED
    deliveredAtMs فقط وقتی DELIVERED/DISPUTED معنا دارد */
export function canDispute(
  status: OrderStatus,
  deliveredAtMs: number | null | undefined,
  nowMs: number
): boolean {
  if (status === "SHIPPED") return true;
  if (status === "DELIVERED") {
    if (deliveredAtMs == null) return false;
    return nowMs <= deliveredAtMs + DISPUTE_WINDOW_HOURS * 3_600_000;
  }
  return false;
}

/** میلی‌ثانیهٔ باقی‌ماندهٔ پنجرهٔ اختلاف (null = پنجره بسته/نامعتبر) */
export function disputeWindowLeftMs(
  deliveredAtMs: number | null | undefined,
  nowMs: number
): number | null {
  if (deliveredAtMs == null) return null;
  const left = deliveredAtMs + DISPUTE_WINDOW_HOURS * 3_600_000 - nowMs;
  return left > 0 ? left : 0;
}

/** مهلت آزادسازی خودکار: تحویل + N روز */
export function autoReleaseDeadlineMs(deliveredAtMs: number): number {
  return deliveredAtMs + ESCROW_AUTO_RELEASE_DAYS * 24 * 3_600_000;
}

/** آزادسازی خودکار سررسید شده؟ (فقط برای DELIVERED معنا دارد) */
export function isAutoReleaseDue(
  status: OrderStatus,
  deliveredAtMs: number | null | undefined,
  nowMs: number
): boolean {
  if (status !== "DELIVERED" || deliveredAtMs == null) return false;
  return nowMs >= autoReleaseDeadlineMs(deliveredAtMs);
}

/** میلی‌ثانیهٔ باقی‌مانده تا آزادسازی خودکار (۰ = سررسید) */
export function autoReleaseLeftMs(
  deliveredAtMs: number | null | undefined,
  nowMs: number
): number | null {
  if (deliveredAtMs == null) return null;
  const left = autoReleaseDeadlineMs(deliveredAtMs) - nowMs;
  return left > 0 ? left : 0;
}

/* ── مبلغ بازپرداخت ──
   لغو قبل از ارسال یا نتیجهٔ اختلاف به نفع خریدار: کل مبلغ پرداختی
   (کالا + ارسال) یکجا به کیف پول برمی‌گردد. */
export function refundAmount(order: { total: number }): number {
  return Math.max(0, Math.floor(order.total));
}

/* ─────────────────────────────────────────────────────────────
   اعمال انتقال — ورودی حداقلی، خروجی نتیجهٔ اعتبارسنجی‌شده
   (استور مسئول به‌روزرسانی زمان‌ها و کیف پول است)
   ───────────────────────────────────────────────────────────── */

export interface OrderLike {
  status: OrderStatus;
  total: number;
  deliveredAtMs?: number | null;
  /** اختلاف باز موجود است؟ */
  hasOpenDispute?: boolean;
}

export type TransitionOk<T extends OrderStatus> = { ok: true; to: T };
export type TransitionErr = { ok: false; error: string };
export type TransitionResult<T extends OrderStatus> =
  | TransitionOk<T>
  | TransitionErr;

export function transition(
  order: OrderLike,
  to: OrderStatus,
  nowMs: number
): TransitionResult<OrderStatus> {
  const from = order.status;
  if (from === to) {
    /* idempotent: تلاش دوباره برای همان وضعیت → بی‌اثر ولی بی‌خطا */
    return { ok: true, to: from };
  }
  if (!canTransition(from, to)) {
    return {
      ok: false,
      error: `انتقال از ${from} به ${to} مجاز نیست`,
    };
  }
  switch (to) {
    case "CANCELED": {
      if (!canCancel(from)) {
        return { ok: false, error: "لغو سفارش فقط قبل از ارسال ممکن است" };
      }
      return { ok: true, to };
    }
    case "DELIVERED": {
      if (!canConfirmDelivery(from)) {
        return { ok: false, error: "تحویل فقط بعد از ارسال مرسوله ثبت می‌شود" };
      }
      return { ok: true, to };
    }
    case "RELEASED": {
      /* idempotent: اگر قبلاً آزاد شده، دوباره «موفق بی‌اثر» است */
      if (from === "RELEASED") return { ok: true, to: "RELEASED" };
      if (from === "DELIVERED" || from === "DISPUTED") {
        return { ok: true, to: "RELEASED" };
      }
      return { ok: false, error: "آزادسازی فقط بعد از تحویل ممکن است" };
    }
    case "DISPUTED": {
      if (order.hasOpenDispute) {
        return { ok: false, error: "برای این سفارش قبلاً اختلاف ثبت شده است" };
      }
      if (!canDispute(from, order.deliveredAtMs, nowMs)) {
        return {
          ok: false,
          error:
            "ثبت اختلاف فقط از لحظهٔ ارسال تا ۷۲ ساعت بعد از تحویل ممکن است",
        };
      }
      return { ok: true, to };
    }
    case "REFUNDED": {
      if (from !== "DISPUTED") {
        return { ok: false, error: "بازپرداخت فقط از طریق نتیجهٔ اختلاف است" };
      }
      return { ok: true, to };
    }
    case "READY_TO_SHIP":
    case "SHIPPED":
    case "PAID_HELD":
      return { ok: true, to };
    default:
      return { ok: false, error: "وضعیت نامعتبر" };
  }
}

/* ─────────────────────────────────────────────────────────────
   تایم‌لاین — مشتق‌شده از وضعیت و زمان‌ها (تک منبع حقیقت)
   استور بعد از هر تغییر، timeline را با همین تابع بازتولید می‌کند.
   ───────────────────────────────────────────────────────────── */

export interface OrderStep {
  label: string;
  done: boolean;
  /** زمان واقعی انجام (ms) — فقط برای مراحل انجام‌شده */
  atMs?: number;
  /** توضیح تکمیلی (مثل نتیجهٔ اختلاف یا مبلغ بازگشتی) */
  note?: string;
}

export interface TimelineStamps {
  createdAtMs: number;
  readyAtMs?: number | null;
  shippedAtMs?: number | null;
  deliveredAtMs?: number | null;
  releasedAtMs?: number | null;
  canceledAtMs?: number | null;
  refundedAtMs?: number | null;
}

export interface TimelineDispute {
  reason: string;
  filedAtMs: number;
  /** نتیجهٔ نهایی: بازگشت وجه یا آزادسازی به فروشنده */
  outcome?: "REFUND" | "RELEASE" | null;
  resolvedAtMs?: number | null;
}

const STEP_LABELS = {
  paid: "پرداخت امانی",
  ready: "آماده‌ی ارسال",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  released: "آزادسازی مبلغ",
  canceled: "لغو سفارش",
  dispute: "اختلاف ثبت شد",
  disputeResultRefund: "نتیجهٔ اختلاف — بازگشت وجه",
  disputeResultRelease: "نتیجهٔ اختلاف — آزادسازی به فروشنده",
} as const;

/** تایم‌لاین هر وضعیت — خالص و قابل تست */
export function deriveTimeline(
  status: OrderStatus,
  stamps: TimelineStamps,
  dispute?: TimelineDispute | null
): OrderStep[] {
  const s = stamps;
  const steps: OrderStep[] = [];

  /* مرحلهٔ پایه: پرداخت امانی — همیشه انجام شده */
  steps.push({ label: STEP_LABELS.paid, done: true, atMs: s.createdAtMs });

  if (status === "CANCELED") {
    steps.push({
      label: STEP_LABELS.canceled,
      done: true,
      atMs: s.canceledAtMs ?? undefined,
      note: "مبلغ سفارش به کیف پول بازگشت",
    });
    return steps;
  }

  /* مسیر عادی: آماده‌ی ارسال */
  const reachedReady =
    s.readyAtMs != null ||
    s.shippedAtMs != null ||
    s.deliveredAtMs != null ||
    s.releasedAtMs != null;
  steps.push({
    label: STEP_LABELS.ready,
    done: reachedReady,
    atMs: (s.readyAtMs ?? s.shippedAtMs ?? s.deliveredAtMs ?? s.releasedAtMs ?? undefined) as
      | number
      | undefined,
  });

  const reachedShipped = s.shippedAtMs != null || s.deliveredAtMs != null || s.releasedAtMs != null;
  steps.push({
    label: STEP_LABELS.shipped,
    done: reachedShipped,
    atMs: (s.shippedAtMs ?? s.deliveredAtMs ?? s.releasedAtMs ?? undefined) as number | undefined,
  });

  const reachedDelivered = s.deliveredAtMs != null || s.releasedAtMs != null;
  steps.push({
    label: STEP_LABELS.delivered,
    done: reachedDelivered,
    atMs: (s.deliveredAtMs ?? s.releasedAtMs ?? undefined) as number | undefined,
  });

  /* اختلاف — بعد از ارسال/تحویل ثبت می‌شود */
  if (dispute) {
    steps.push({
      label: STEP_LABELS.dispute,
      done: true,
      atMs: dispute.filedAtMs,
      note: dispute.reason,
    });
    if (dispute.outcome === "REFUND") {
      steps.push({
        label: STEP_LABELS.disputeResultRefund,
        done: true,
        atMs: dispute.resolvedAtMs ?? undefined,
        note: "کل مبلغ به کیف پول بازگشت",
      });
      return steps;
    }
    if (dispute.outcome === "RELEASE") {
      steps.push({
        label: STEP_LABELS.disputeResultRelease,
        done: true,
        atMs: dispute.resolvedAtMs ?? undefined,
        note: "مبلغ به فروشنده آزاد شد",
      });
      steps.push({
        label: STEP_LABELS.released,
        done: true,
        atMs: dispute.resolvedAtMs ?? s.releasedAtMs ?? undefined,
      });
      return steps;
    }
  }

  /* آزادسازی نهایی */
  steps.push({
    label: STEP_LABELS.released,
    done: s.releasedAtMs != null,
    atMs: s.releasedAtMs ?? undefined,
  });

  return steps;
}

/* ─────────────────────────────────────────────────────────────
   دکمه‌های مجاز هر وضعیت — تک منبع برای UI جزئیات سفارش
   ───────────────────────────────────────────────────────────── */

export interface OrderActionsInput extends OrderLike {
  /** آیا خریدار قبلاً امتیاز داده؟ */
  rated?: boolean;
  /** برای دکمهٔ اختلاف: زمان تحویل */
}

export interface OrderActions {
  cancel: boolean;
  confirmDelivery: boolean;
  dispute: boolean;
  /** آزادسازی دستی مبلغ بعد از تحویل */
  release: boolean;
  rate: boolean;
  reorder: boolean;
}

export function availableActions(
  order: OrderActionsInput,
  nowMs: number
): OrderActions {
  const st = order.status;
  return {
    cancel: canCancel(st),
    confirmDelivery: canConfirmDelivery(st),
    dispute: canDispute(st, order.deliveredAtMs, nowMs),
    release: st === "DELIVERED",
    rate: st === "RELEASED" && !order.rated,
    reorder: st === "RELEASED",
  };
}
