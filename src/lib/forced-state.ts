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
