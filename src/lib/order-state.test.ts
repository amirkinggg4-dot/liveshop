import { describe, it, expect } from "bun:test";

/* ─────────────────────────────────────────────────────────────
   v1.8.0 — تست ماشین وضعیت سفارش (ماژول خالص)
   هر انتقال مجاز و غیرمجاز، مهلت‌ها (زمان mock با nowMs صریح)،
   مبلغ بازپرداخت و idempotent بودن آزادسازی
   ───────────────────────────────────────────────────────────── */

import {
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  canTransition,
  canCancel,
  canConfirmDelivery,
  canDispute,
  disputeWindowLeftMs,
  autoReleaseDeadlineMs,
  autoReleaseLeftMs,
  isAutoReleaseDue,
  refundAmount,
  transition,
  deriveTimeline,
  availableActions,
  orderMatchesTab,
  ORDER_STAGE_KEY_TO_STATUS,
} from "@/lib/order-state";
import {
  DISPUTE_WINDOW_HOURS,
  ESCROW_AUTO_RELEASE_DAYS,
} from "@/lib/config/fees";
import type { OrderStatus } from "@/lib/order-state";

const H = 3_600_000;
const D = 24 * H;

/* زمان ثابت mock — همهٔ تست‌های زمان‌دار از این مبنا استفاده می‌کنند */
const T0 = 1_700_000_000_000;

function okOrder(partial: Partial<Parameters<typeof transition>[0]> = {}) {
  return {
    status: "SHIPPED" as OrderStatus,
    total: 1_000_000,
    deliveredAtMs: null,
    ...partial,
  };
}

/* ─── ۱) جدول انتقال‌ها ─── */
describe("order-state — جدول انتقال‌های مجاز", () => {
  it("همهٔ کلیدهای جدول، وضعیت‌های enum را پوشش می‌دهند", () => {
    for (const s of ORDER_STATUSES) {
      expect(ORDER_TRANSITIONS[s]).toBeArray();
    }
  });

  it("انتقال‌های مسیر عادی مجازند", () => {
    expect(canTransition("PAID_HELD", "READY_TO_SHIP")).toBe(true);
    expect(canTransition("READY_TO_SHIP", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
    expect(canTransition("DELIVERED", "RELEASED")).toBe(true);
    expect(canTransition("DELIVERED", "DISPUTED")).toBe(true);
    expect(canTransition("SHIPPED", "DISPUTED")).toBe(true);
    expect(canTransition("DISPUTED", "REFUNDED")).toBe(true);
    expect(canTransition("DISPUTED", "RELEASED")).toBe(true);
  });

  it("انتقال‌های غیرمجاز رد می‌شوند", () => {
    expect(canTransition("SHIPPED", "CANCELED")).toBe(false);
    expect(canTransition("DELIVERED", "CANCELED")).toBe(false);
    expect(canTransition("DELIVERED", "SHIPPED")).toBe(false);
    expect(canTransition("CANCELED", "PAID_HELD")).toBe(false);
    expect(canTransition("RELEASED", "REFUNDED")).toBe(false);
    expect(canTransition("RELEASED", "DISPUTED")).toBe(false);
    expect(canTransition("REFUNDED", "RELEASED")).toBe(false);
    expect(canTransition("PAID_HELD", "DELIVERED")).toBe(false);
    expect(canTransition("PAID_HELD", "SHIPPED")).toBe(false);
    expect(canTransition("READY_TO_SHIP", "DELIVERED")).toBe(false);
    expect(canTransition("DISPUTED", "CANCELED")).toBe(false);
    expect(canTransition("DISPUTED", "DELIVERED")).toBe(false);
  });

  it("وضعیت‌های پایانی هیچ خروجی ندارند", () => {
    for (const t of ["RELEASED", "REFUNDED", "CANCELED"] as const) {
      expect(ORDER_TRANSITIONS[t].length).toBe(0);
      for (const to of ORDER_STATUSES) {
        expect(canTransition(t, to)).toBe(false);
      }
    }
  });
});

/* ─── ۲) لغو فقط قبل از ارسال ─── */
describe("order-state — لغو سفارش", () => {
  it("canCancel فقط برای PAID_HELD و READY_TO_SHIP", () => {
    expect(canCancel("PAID_HELD")).toBe(true);
    expect(canCancel("READY_TO_SHIP")).toBe(true);
    expect(canCancel("SHIPPED")).toBe(false);
    expect(canCancel("DELIVERED")).toBe(false);
    expect(canCancel("RELEASED")).toBe(false);
    expect(canCancel("DISPUTED")).toBe(false);
    expect(canCancel("REFUNDED")).toBe(false);
    expect(canCancel("CANCELED")).toBe(false);
  });

  it("لغو قبل از ارسال مجاز است", () => {
    const res = transition(okOrder({ status: "PAID_HELD" }), "CANCELED", T0);
    expect(res.ok).toBe(true);
    const res2 = transition(
      okOrder({ status: "READY_TO_SHIP" }),
      "CANCELED",
      T0
    );
    expect(res2.ok).toBe(true);
  });

  it("لغو بعد از ارسال رد می‌شود", () => {
    const res = transition(okOrder({ status: "SHIPPED" }), "CANCELED", T0);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("مجاز نیست");
  });
});

/* ─── ۳) تحویل فقط بعد از ارسال ─── */
describe("order-state — تأیید تحویل", () => {
  it("canConfirmDelivery فقط برای SHIPPED", () => {
    expect(canConfirmDelivery("SHIPPED")).toBe(true);
    expect(canConfirmDelivery("PAID_HELD")).toBe(false);
    expect(canConfirmDelivery("READY_TO_SHIP")).toBe(false);
    expect(canConfirmDelivery("DELIVERED")).toBe(false);
  });

  it("تحویل از SHIPPED مجاز، از بقیه رد", () => {
    expect(transition(okOrder(), "DELIVERED", T0).ok).toBe(true);
    const bad = transition(
      okOrder({ status: "READY_TO_SHIP" }),
      "DELIVERED",
      T0
    );
    expect(bad.ok).toBe(false);
  });
});

/* ─── ۴) پنجرهٔ اختلاف: از SHIPPED تا ۷۲ ساعت بعد از DELIVERED ─── */
describe("order-state — پنجرهٔ اختلاف", () => {
  it("در SHIPPED همیشه ثبت اختلاف ممکن است", () => {
    expect(canDispute("SHIPPED", null, T0)).toBe(true);
    expect(canDispute("SHIPPED", undefined, T0)).toBe(true);
  });

  it("در DELIVERED تا ۷۲ ساعت بعد از تحویل ممکن است", () => {
    const deliveredAt = T0 - 10 * H;
    expect(canDispute("DELIVERED", deliveredAt, T0)).toBe(true);
    /* دقیقاً روی مرز ۷۲ ساعت — هنوز مجاز */
    expect(canDispute("DELIVERED", T0 - DISPUTE_WINDOW_HOURS * H, T0)).toBe(true);
    /* یک میلی‌ثانیه بعد از مرز — بسته */
    expect(
      canDispute("DELIVERED", T0 - (DISPUTE_WINDOW_HOURS * H + 1), T0)
    ).toBe(false);
  });

  it("قبل از ارسال (PAID_HELD/READY_TO_SHIP) اختلاف ممنوع است", () => {
    expect(canDispute("PAID_HELD", null, T0)).toBe(false);
    expect(canDispute("READY_TO_SHIP", null, T0)).toBe(false);
  });

  it("بعد از RELEASED/REFUNDED/DISPUTED دوباره ثبت نمی‌شود", () => {
    expect(canDispute("RELEASED", T0, T0)).toBe(false);
    expect(canDispute("REFUNDED", T0, T0)).toBe(false);
    expect(canDispute("DISPUTED", T0, T0)).toBe(false);
  });

  it("transition برای اختلاف بدون اختلاف باز از SHIPPED مجاز است", () => {
    const res = transition(okOrder({ hasOpenDispute: false }), "DISPUTED", T0);
    expect(res.ok).toBe(true);
  });

  it("transition برای اختلاف تکراری رد می‌شود", () => {
    const res = transition(okOrder({ hasOpenDispute: true }), "DISPUTED", T0);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("قبلاً");
  });

  it("disputeWindowLeftMs باقی‌مانده را می‌دهد و بعد از مرز صفر است", () => {
    const deliveredAt = T0 - 2 * D;
    /* ۷۲ ساعت بعد از تحویل؛ ۲ روز گذشته → ۱ روز مانده */
    const left = disputeWindowLeftMs(deliveredAt, T0);
    expect(left).toBe(DISPUTE_WINDOW_HOURS * H - 2 * D);
    expect(disputeWindowLeftMs(T0 - 4 * D, T0)).toBe(0);
    expect(disputeWindowLeftMs(null, T0)).toBeNull();
  });
});

/* ─── ۵) آزادسازی خودکار و idempotent بودن ─── */
describe("order-state — آزادسازی امانی", () => {
  it("مهلت آزادسازی خودکار = تحویل + N روز (از fees)", () => {
    const deliveredAt = T0;
    expect(autoReleaseDeadlineMs(deliveredAt)).toBe(
      deliveredAt + ESCROW_AUTO_RELEASE_DAYS * D
    );
  });

  it("isAutoReleaseDue فقط برای DELIVERED سررسیدشده", () => {
    const deliveredAt = T0 - ESCROW_AUTO_RELEASE_DAYS * D;
    expect(isAutoReleaseDue("DELIVERED", deliveredAt, T0)).toBe(true);
    /* یک روز مانده */
    expect(
      isAutoReleaseDue("DELIVERED", T0 - (ESCROW_AUTO_RELEASE_DAYS - 1) * D, T0)
    ).toBe(false);
    expect(isAutoReleaseDue("RELEASED", deliveredAt, T0)).toBe(false);
    expect(isAutoReleaseDue("DELIVERED", null, T0)).toBe(false);
  });

  it("autoReleaseLeftMs باقی‌مانده را می‌دهد", () => {
    expect(autoReleaseLeftMs(T0 - 2 * D, T0)).toBe(
      (ESCROW_AUTO_RELEASE_DAYS - 2) * D
    );
    expect(autoReleaseLeftMs(T0 - 5 * D, T0)).toBe(0);
  });

  it("آزادسازی از DELIVERED مجاز است", () => {
    const res = transition(okOrder({ status: "DELIVERED" }), "RELEASED", T0);
    expect(res.ok).toBe(true);
  });

  it("idempotent: آزادسازی تکراری بی‌خطا و بی‌اثر است", () => {
    /* اول: از DELIVERED → RELEASED */
    const first = transition(
      okOrder({ status: "DELIVERED" }),
      "RELEASED",
      T0
    );
    expect(first.ok).toBe(true);
    /* دوم: همان وضعیت → همان وضعیت (موفق بی‌اثر) */
    const second = transition(okOrder({ status: "RELEASED" }), "RELEASED", T0);
    expect(second.ok).toBe(true);
    expect(second.ok && second.to).toBe("RELEASED");
  });

  it("آزادسازی قبل از تحویل رد می‌شود", () => {
    const res = transition(okOrder({ status: "SHIPPED" }), "RELEASED", T0);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("مجاز نیست");
  });

  it("نتیجهٔ اختلاف به RELEASED هم از DISPUTED مجاز است", () => {
    const res = transition(okOrder({ status: "DISPUTED" }), "RELEASED", T0);
    expect(res.ok).toBe(true);
  });

  it("بازپرداخت فقط از DISPUTED", () => {
    expect(transition(okOrder({ status: "DISPUTED" }), "REFUNDED", T0).ok).toBe(
      true
    );
    const bad = transition(okOrder({ status: "DELIVERED" }), "REFUNDED", T0);
    expect(bad.ok).toBe(false);
  });
});

/* ─── ۶) مبلغ بازپرداخت ─── */
describe("order-state — مبلغ بازپرداخت", () => {
  it("بازپرداخت لغو = کل مبلغ (کالا + ارسال)", () => {
    expect(refundAmount({ total: 4_645_000 })).toBe(4_645_000);
    expect(refundAmount({ total: 0 })).toBe(0);
  });

  it("مبلغ اعشاری/منفی نرمال می‌شود", () => {
    expect(refundAmount({ total: 123.9 })).toBe(123);
    expect(refundAmount({ total: -50 })).toBe(0);
  });
});

/* ─── ۷) تایم‌لاین مشتق‌شده ─── */
describe("order-state — تایم‌لاین", () => {
  it("PAID_HELD: فقط پرداخت انجام شده", () => {
    const tl = deriveTimeline("PAID_HELD", { createdAtMs: T0 });
    expect(tl.map((s) => s.done)).toEqual([true, false, false, false, false]);
    expect(tl[0].atMs).toBe(T0);
  });

  it("RELEASED: هر ۵ مرحله با زمان", () => {
    const tl = deriveTimeline("RELEASED", {
      createdAtMs: T0,
      readyAtMs: T0 + H,
      shippedAtMs: T0 + 2 * H,
      deliveredAtMs: T0 + 3 * H,
      releasedAtMs: T0 + 4 * H,
    });
    expect(tl.length).toBe(5);
    expect(tl.every((s) => s.done && s.atMs != null)).toBe(true);
    expect(tl[4].label).toBe("آزادسازی مبلغ");
  });

  it("CANCELED: پرداخت + لغو با یادداشت بازگشت وجه", () => {
    const tl = deriveTimeline("CANCELED", {
      createdAtMs: T0,
      readyAtMs: T0 + H,
      canceledAtMs: T0 + 2 * H,
    });
    expect(tl.length).toBe(2);
    expect(tl[1].label).toBe("لغو سفارش");
    expect(tl[1].note).toContain("کیف پول");
    expect(tl[1].atMs).toBe(T0 + 2 * H);
  });

  it("DISPUTED: مراحل تا تحویل + ثبت اختلاف باز", () => {
    const tl = deriveTimeline(
      "DISPUTED",
      {
        createdAtMs: T0,
        readyAtMs: T0 + H,
        shippedAtMs: T0 + 2 * H,
        deliveredAtMs: T0 + 3 * H,
      },
      { reason: "کالا مغایر بود", filedAtMs: T0 + 4 * H, outcome: null }
    );
    expect(tl.length).toBe(6);
    expect(tl[4].label).toBe("اختلاف ثبت شد");
    expect(tl[4].note).toBe("کالا مغایر بود");
    expect(tl[5].done).toBe(false);
  });

  it("نتیجهٔ اختلاف REFUND: بازگشت وجه در تایم‌لاین", () => {
    const tl = deriveTimeline(
      "REFUNDED",
      {
        createdAtMs: T0,
        shippedAtMs: T0 + H,
        deliveredAtMs: T0 + 2 * H,
        refundedAtMs: T0 + 4 * H,
      },
      {
        reason: "کالا نرسید",
        filedAtMs: T0 + 3 * H,
        outcome: "REFUND",
        resolvedAtMs: T0 + 4 * H,
      }
    );
    const labels = tl.map((s) => s.label);
    expect(labels).toContain("نتیجهٔ اختلاف — بازگشت وجه");
    const last = tl[tl.length - 1];
    expect(last.done).toBe(true);
    expect(last.note).toContain("کیف پول");
  });

  it("نتیجهٔ اختلاف RELEASE: آزادسازی به فروشنده در تایم‌لاین", () => {
    const tl = deriveTimeline(
      "RELEASED",
      {
        createdAtMs: T0,
        shippedAtMs: T0 + H,
        deliveredAtMs: T0 + 2 * H,
        releasedAtMs: T0 + 4 * H,
      },
      {
        reason: "تأخیر در ارسال",
        filedAtMs: T0 + 3 * H,
        outcome: "RELEASE",
        resolvedAtMs: T0 + 4 * H,
      }
    );
    const labels = tl.map((s) => s.label);
    expect(labels).toContain("نتیجهٔ اختلاف — آزادسازی به فروشنده");
    expect(tl[tl.length - 1].done).toBe(true);
  });
});

/* ─── ۸) دکمه‌های مجاز هر وضعیت ─── */
describe("order-state — availableActions", () => {
  it("PAID_HELD: لغو بله، اختلاف نه", () => {
    const a = availableActions(
      { status: "PAID_HELD", total: 100, deliveredAtMs: null },
      T0
    );
    expect(a.cancel).toBe(true);
    expect(a.dispute).toBe(false);
    expect(a.confirmDelivery).toBe(false);
    expect(a.release).toBe(false);
    expect(a.rate).toBe(false);
    expect(a.reorder).toBe(false);
  });

  it("SHIPPED: تحویل + اختلاف، بدون لغو", () => {
    const a = availableActions(
      { status: "SHIPPED", total: 100, deliveredAtMs: null },
      T0
    );
    expect(a.confirmDelivery).toBe(true);
    expect(a.dispute).toBe(true);
    expect(a.cancel).toBe(false);
  });

  it("DELIVERED تازه: آزادسازی + اختلاف (پنجره باز)", () => {
    const a = availableActions(
      { status: "DELIVERED", total: 100, deliveredAtMs: T0 - H },
      T0
    );
    expect(a.release).toBe(true);
    expect(a.dispute).toBe(true);
    expect(a.confirmDelivery).toBe(false);
    expect(a.cancel).toBe(false);
    expect(a.rate).toBe(false);
  });

  it("DELIVERED بعد از ۷۲ ساعت: اختلاف بسته می‌ماند", () => {
    const a = availableActions(
      { status: "DELIVERED", total: 100, deliveredAtMs: T0 - 4 * D },
      T0
    );
    expect(a.dispute).toBe(false);
    expect(a.release).toBe(true);
  });

  it("RELEASED: امتیاز + سفارش دوباره (تا وقتی امتیاز نداده)", () => {
    const a = availableActions(
      { status: "RELEASED", total: 100, deliveredAtMs: T0, rated: false },
      T0
    );
    expect(a.rate).toBe(true);
    expect(a.reorder).toBe(true);
    const b = availableActions(
      { status: "RELEASED", total: 100, deliveredAtMs: T0, rated: true },
      T0
    );
    expect(b.rate).toBe(false);
    expect(b.reorder).toBe(true);
  });
});

/* ─── ۹) تب‌ها و کلید دمو ─── */
describe("order-state — تب‌های فهرست و کلید دمو", () => {
  it("خوشهٔ تب‌ها همهٔ وضعیت‌ها را می‌پوشانند", () => {
    for (const s of ORDER_STATUSES) {
      const matched =
        orderMatchesTab(s, "active") ||
        orderMatchesTab(s, "delivered") ||
        orderMatchesTab(s, "closed");
      expect(matched).toBe(true);
    }
  });

  it("تفکیک درست تب‌ها", () => {
    expect(orderMatchesTab("SHIPPED", "active")).toBe(true);
    expect(orderMatchesTab("SHIPPED", "delivered")).toBe(false);
    expect(orderMatchesTab("DELIVERED", "delivered")).toBe(true);
    expect(orderMatchesTab("RELEASED", "delivered")).toBe(true);
    expect(orderMatchesTab("CANCELED", "closed")).toBe(true);
    expect(orderMatchesTab("REFUNDED", "closed")).toBe(true);
    expect(orderMatchesTab("DISPUTED", "active")).toBe(true);
    expect(orderMatchesTab("DISPUTED", "closed")).toBe(false);
  });

  it("همهٔ تب‌ها با all برابر true", () => {
    for (const s of ORDER_STATUSES) {
      expect(orderMatchesTab(s, "all")).toBe(true);
    }
  });

  it("کلیدهای دمو به وضعیت‌های درست نگاشت می‌شوند", () => {
    expect(ORDER_STAGE_KEY_TO_STATUS.ready).toBe("READY_TO_SHIP");
    expect(ORDER_STAGE_KEY_TO_STATUS.shipped).toBe("SHIPPED");
    expect(ORDER_STAGE_KEY_TO_STATUS.delivered).toBe("DELIVERED");
    expect(ORDER_STAGE_KEY_TO_STATUS.released).toBe("RELEASED");
    expect(ORDER_STAGE_KEY_TO_STATUS.disputed).toBe("DISPUTED");
    expect(ORDER_STAGE_KEY_TO_STATUS.canceled).toBe("CANCELED");
    expect(ORDER_STAGE_KEY_TO_STATUS.paid).toBe("PAID_HELD");
  });
});
