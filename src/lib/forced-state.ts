"use client";

/* ─────────────────────────────────────────────────────────────
   v1.6.2 — استورهای بیرونی کوچک مشترک (الگوی useSyncExternalStore)
   ─ کلید mock ‏?state=loading|error|empty (بدون setState داخل effect —
     قانون lint ‏react-hooks/set-state-in-effect)
   ─ آنلاین/آفلاین (navigator.onLine)
   ─ useMounted برای متن‌های وابسته به زمان (بدون hydration mismatch)
   خانه (HomeView) همین الگو را inline دارد؛ این نسخهٔ مشترک برای
   کاوش و نماهای بعدی است.
   ───────────────────────────────────────────────────────────── */

import { useSyncExternalStore } from "react";
import {
  ORDER_STAGE_KEY_TO_STATUS,
  type OrderStageKey,
  type OrderStatus,
} from "@/lib/order-state";

export type ForceState = "loading" | "error" | "empty";

const noopSubscribe = () => () => {};

/** mounted؟ — سرور/آب‌رسانی false می‌بیند، بعد از mount true */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/** خواندن کلید mock ‏?state= از URL (بدون رفرش صفحه) */
export const forcedStateStore = {
  listeners: new Set<() => void>(),
  notify() {
    this.listeners.forEach((l) => l());
  },
  subscribe(cb: () => void) {
    forcedStateStore.listeners.add(cb);
    return () => forcedStateStore.listeners.delete(cb);
  },
  getSnapshot(): ForceState | null {
    try {
      const s = new URLSearchParams(window.location.search).get("state");
      return s === "loading" || s === "error" || s === "empty" ? s : null;
    } catch {
      return null;
    }
  },
  getServerSnapshot(): ForceState | null {
    return null;
  },
  /** پاک‌کردن کلید mock (دکمهٔ «تلاش دوباره») */
  clear() {
    try {
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      /* noop */
    }
    forcedStateStore.notify();
  },
};

export function useForcedState(): ForceState | null {
  return useSyncExternalStore(
    forcedStateStore.subscribe,
    forcedStateStore.getSnapshot,
    forcedStateStore.getServerSnapshot
  );
}

/** navigator.onLine — الگوی رسمی React برای وضعیت شبکه */
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
}

/* ─────────────────────────────────────────────────────────────
   v1.8.0 — کلید دموی سفارش‌ها: ?orderStage=ready|shipped|delivered|
   released|disputed|canceled — فهرست و جزئیات را به آن مرحله قفل
   می‌کند تا همهٔ مرحله‌ها قابل عکس‌گرفتن باشند. در حالت عادی (بدون
   کلید) پیشروی فقط با دکمه‌های واقعی انجام می‌شود.
   ───────────────────────────────────────────────────────────── */

const ORDER_STAGE_KEYS = [
  "paid",
  "ready",
  "shipped",
  "delivered",
  "released",
  "disputed",
  "canceled",
] as const;

/** خواندن مستقیم کلید (برای استورها/شرط‌های غیر-هوکی) */
export function getForcedOrderStage(): OrderStageKey | null {
  try {
    const s = new URLSearchParams(window.location.search).get("orderStage");
    return s && (ORDER_STAGE_KEYS as readonly string[]).includes(s)
      ? (s as OrderStageKey)
      : null;
  } catch {
    return null;
  }
}

/** وضعیتِ متناظر با کلید دمو (null = حالت عادی) */
export function getForcedOrderStatus(): OrderStatus | null {
  const key = getForcedOrderStage();
  return key ? ORDER_STAGE_KEY_TO_STATUS[key] : null;
}

export const forcedOrderStageStore = {
  listeners: new Set<() => void>(),
  notify() {
    this.listeners.forEach((l) => l());
  },
  subscribe(cb: () => void) {
    forcedOrderStageStore.listeners.add(cb);
    return () => forcedOrderStageStore.listeners.delete(cb);
  },
  getSnapshot(): OrderStageKey | null {
    return getForcedOrderStage();
  },
  getServerSnapshot(): OrderStageKey | null {
    return null;
  },
};

export function useForcedOrderStage(): OrderStageKey | null {
  return useSyncExternalStore(
    forcedOrderStageStore.subscribe,
    forcedOrderStageStore.getSnapshot,
    forcedOrderStageStore.getServerSnapshot
  );
}
