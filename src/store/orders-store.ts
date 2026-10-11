"use client";

import { create } from "zustand";
import { SEED_ORDERS, faOrderId } from "@/lib/data/orders";
import {
  transition,
  isAutoReleaseDue,
  deriveTimeline,
  refundAmount,
  type OrderStatus,
  type TimelineDispute,
} from "@/lib/order-state";
import type { Order } from "@/lib/data/types";
import { useWalletStore } from "@/store/wallet-store";

/* ─────────────────────────────────────────────────────────────
   v1.8.0 — استور سفارش‌های خریدار (mock)
   همهٔ تغییر وضعیت‌ها از طریق ماشین خالص order-state اعتبارسنجی
   می‌شوند؛ پیشروی فقط با اکشن‌های واقعی (بدون advance عمومی).
   ───────────────────────────────────────────────────────────── */

type ActionResult = { ok: boolean; error?: string };

interface OrdersState {
  orders: Order[];
  /** سفارش تازه (خرید لایو) */
  addOrder: (order: Order) => void;
  /** لغو سفارش قبل از ارسال — مبلغ فوراً به کیف پول برمی‌گردد */
  cancelOrder: (orderId: string, nowMs?: number) => ActionResult;
  /** «تحویل گرفتم» — SHIPPED → DELIVERED */
  confirmDelivery: (orderId: string, nowMs?: number) => ActionResult;
  /** آزادسازی امانی — DELIVERED → RELEASED (idempotent) */
  releaseEscrow: (orderId: string, nowMs?: number) => ActionResult;
  /** ثبت اختلاف — فقط از SHIPPED تا ۷۲ ساعت بعد از تحویل */
  openDispute: (
    orderId: string,
    reason: string,
    desc: string,
    nowMs?: number
  ) => ActionResult;
  /** نتیجهٔ کارشناس: بازپرداخت به خریدار یا آزادسازی به فروشنده */
  resolveDispute: (
    orderId: string,
    outcome: "REFUND" | "RELEASE",
    nowMs?: number
  ) => ActionResult;
  /** ثبت امتیاز خریدار بعد از آزادسازی */
  setRated: (
    orderId: string,
    rating?: { stars: number; tags: string[]; text?: string }
  ) => void;
  /** پیام «تماس با فروشنده» — پاسخ فروشنده mock با تأخیر کوتاه */
  sendOrderMessage: (orderId: string, text: string, nowMs?: number) => void;
  /** آزادسازی خودکار سفارش‌های سررسیدشده (روی ورود به نماها) */
  autoReleaseTick: (nowMs?: number) => void;
}

let orderCounter = 10400;

function nextOrderId(): string {
  orderCounter += 1;
  return faOrderId(orderCounter);
}

export { nextOrderId };

/** بازتولید تایم‌لاین بعد از هر تغییر — تک منبع: deriveTimeline */
function withTimeline(o: Order, patch: Partial<Order>): Order {
  const next = { ...o, ...patch };
  const dispute: TimelineDispute | null = next.dispute
    ? {
        reason: next.dispute.reason,
        filedAtMs: next.dispute.filedAtMs,
        outcome:
          next.dispute.status === "RESOLVED_REFUND"
            ? "REFUND"
            : next.dispute.status === "RESOLVED_RELEASE"
              ? "RELEASE"
              : null,
        resolvedAtMs:
          next.dispute.status === "OPEN"
            ? null
            : (next.refundedAtMs ?? next.releasedAtMs ?? null),
      }
    : null;
  return {
    ...next,
    timeline: deriveTimeline(
      next.status,
      {
        createdAtMs: next.createdAtMs,
        readyAtMs: next.readyAtMs ?? null,
        shippedAtMs: next.shippedAtMs ?? null,
        deliveredAtMs: next.deliveredAtMs ?? null,
        releasedAtMs: next.releasedAtMs ?? null,
        canceledAtMs: next.canceledAtMs ?? null,
        refundedAtMs: next.refundedAtMs ?? null,
      },
      dispute
    ),
  };
}

function patchOrder(
  orders: Order[],
  orderId: string,
  patch: (o: Order) => Partial<Order>
): Order[] {
  return orders.map((o) => (o.id === orderId ? withTimeline(o, patch(o)) : o));
}

let msgCounter = 0;

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: SEED_ORDERS,

  addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),

  cancelOrder: (orderId, nowMs = Date.now()) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, error: "سفارش پیدا نشد" };
    const res = transition(
      {
        status: order.status,
        total: order.total,
        deliveredAtMs: order.deliveredAtMs,
      },
      "CANCELED",
      nowMs
    );
    if (!res.ok) return { ok: false, error: res.error };
    /* پول فوراً به کیف پول برمی‌گردد (REFUNDED / ledger mock) */
    const amount = refundAmount(order);
    useWalletStore
      .getState()
      .refund(amount, `بازگشت وجه — لغو سفارش ${order.itemTitle}`, orderId);
    set((s) => ({
      orders: patchOrder(s.orders, orderId, () => ({
        status: "CANCELED" as OrderStatus,
        canceledAtMs: nowMs,
        escrow: false,
      })),
    }));
    return { ok: true };
  },

  confirmDelivery: (orderId, nowMs = Date.now()) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, error: "سفارش پیدا نشد" };
    const res = transition(
      {
        status: order.status,
        total: order.total,
        deliveredAtMs: order.deliveredAtMs,
      },
      "DELIVERED",
      nowMs
    );
    if (!res.ok) return { ok: false, error: res.error };
    set((s) => ({
      orders: patchOrder(s.orders, orderId, () => ({
        status: "DELIVERED" as OrderStatus,
        deliveredAtMs: nowMs,
      })),
    }));
    return { ok: true };
  },

  releaseEscrow: (orderId, nowMs = Date.now()) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, error: "سفارش پیدا نشد" };
    /* idempotent: آزادسازی دوباره بی‌اثر است */
    if (order.status === "RELEASED") return { ok: true };
    const res = transition(
      {
        status: order.status,
        total: order.total,
        deliveredAtMs: order.deliveredAtMs,
      },
      "RELEASED",
      nowMs
    );
    if (!res.ok) return { ok: false, error: res.error };
    set((s) => ({
      orders: patchOrder(s.orders, orderId, () => ({
        status: "RELEASED" as OrderStatus,
        releasedAtMs: nowMs,
        escrow: false,
      })),
    }));
    return { ok: true };
  },

  openDispute: (orderId, reason, desc, nowMs = Date.now()) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, error: "سفارش پیدا نشد" };
    const res = transition(
      {
        status: order.status,
        total: order.total,
        deliveredAtMs: order.deliveredAtMs,
        hasOpenDispute: Boolean(
          order.dispute && order.dispute.status === "OPEN"
        ),
      },
      "DISPUTED",
      nowMs
    );
    if (!res.ok) return { ok: false, error: res.error };
    set((s) => ({
      orders: patchOrder(s.orders, orderId, () => ({
        status: "DISPUTED" as OrderStatus,
        dispute: {
          reason,
          desc,
          filedAtMs: nowMs,
          status: "OPEN" as const,
        },
      })),
    }));
    return { ok: true };
  },

  resolveDispute: (orderId, outcome, nowMs = Date.now()) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, error: "سفارش پیدا نشد" };
    const target: OrderStatus = outcome === "REFUND" ? "REFUNDED" : "RELEASED";
    const res = transition(
      {
        status: order.status,
        total: order.total,
        deliveredAtMs: order.deliveredAtMs,
      },
      target,
      nowMs
    );
    if (!res.ok) return { ok: false, error: res.error };
    if (outcome === "REFUND") {
      const amount = refundAmount(order);
      useWalletStore
        .getState()
        .refund(
          amount,
          `نتیجهٔ اختلاف — بازگشت وجه ${order.itemTitle}`,
          orderId
        );
    }
    set((s) => ({
      orders: patchOrder(s.orders, orderId, () => ({
        status: target,
        ...(outcome === "REFUND"
          ? { refundedAtMs: nowMs, escrow: false }
          : { releasedAtMs: nowMs, escrow: false }),
        dispute: order.dispute
          ? {
              ...order.dispute,
              status:
                outcome === "REFUND"
                  ? ("RESOLVED_REFUND" as const)
                  : ("RESOLVED_RELEASE" as const),
            }
          : undefined,
      })),
    }));
    return { ok: true };
  },

  setRated: (orderId, rating) =>
    set((s) => ({
      orders: patchOrder(s.orders, orderId, () => ({
        rated: true,
        ...(rating
          ? {
              rating: {
                stars: rating.stars,
                tags: rating.tags,
                ...(rating.text ? { text: rating.text } : {}),
                atMs: Date.now(),
              },
            }
          : {}),
      })),
    })),

  sendOrderMessage: (orderId, text, nowMs = Date.now()) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const pushMsg = (from: "buyer" | "seller", body: string, atMs: number) =>
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                messages: [
                  ...(o.messages ?? []),
                  { id: `om-${++msgCounter}`, from, text: body, atMs },
                ],
              }
            : o
        ),
      }));
    pushMsg("buyer", trimmed, nowMs);
    /* پاسخ mock فروشنده — کوتاه و طبیعی */
    setTimeout(() => {
      pushMsg(
        "seller",
        "سلام! پیامت رسید 🙏 تا چند دقیقه دیگر جواب می‌دهم.",
        Date.now()
      );
    }, 1400);
  },

  autoReleaseTick: (nowMs = Date.now()) => {
    const due = get().orders.filter(
      (o) =>
        o.status === "DELIVERED" &&
        isAutoReleaseDue(o.status, o.deliveredAtMs, nowMs)
    );
    if (due.length === 0) return;
    for (const o of due) {
      get().releaseEscrow(o.id, nowMs);
    }
  },
}));
