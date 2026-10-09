"use client";

import { create } from "zustand";

/* ─────────────────────────────────────────────────────────────
   استور فاز ۳ (P1) — کارهای بهبود سلامت اکانت فروشنده
   کوچک و مستقل: شناسهٔ کارهای تیک‌خورده + toggle + سلکتور شمارنده.
   ───────────────────────────────────────────────────────────── */

interface SellerP1State {
  /** شناسهٔ کارهای تکمیل‌شده از HEALTH_TASKS */
  doneTaskIds: string[];
  toggleTask: (id: string) => void;
}

export const useSellerP1Store = create<SellerP1State>((set) => ({
  doneTaskIds: [],
  toggleTask: (id) =>
    set((s) => ({
      doneTaskIds: s.doneTaskIds.includes(id)
        ? s.doneTaskIds.filter((t) => t !== id)
        : [...s.doneTaskIds, id],
    })),
}));

/** سلکتور شمارندهٔ کارهای تکمیل‌شده — useSellerP1Store(selectDoneCount) */
export const selectDoneCount = (s: SellerP1State) => s.doneTaskIds.length;
