"use client";

import { create } from "zustand";

/* ─────────────────────────────────────────────────────────────
   v1.6.1 — نیتِ رفتن به «کاوش» (state/param مشترک خانه ↔ کاوش)
   خانه می‌نویسد: کاشی دسته‌بندی → دستهٔ از پیش انتخاب‌شده،
   دکمهٔ جستجو → فوکوس روی ورودی جستجو.
   کاوش هنگام mount می‌خواند و با consume() پاک می‌کند.
   ───────────────────────────────────────────────────────────── */

interface ExploreIntentState {
  /** id دستهٔ از پیش انتخاب‌شده — null یعنی بدون فیلتر */
  category: string | null;
  /** فوکوس روی ورودی جستجوی کاوش */
  focusSearch: boolean;
  setIntent: (i: { category?: string | null; focusSearch?: boolean }) => void;
  /** بعد از مصرف توسط کاوش پاک می‌شود */
  consume: () => void;
}

export const useExploreIntentStore = create<ExploreIntentState>((set) => ({
  category: null,
  focusSearch: false,
  setIntent: (i) =>
    set({
      category: i.category ?? null,
      focusSearch: i.focusSearch ?? false,
    }),
  consume: () => set({ category: null, focusSearch: false }),
}));
