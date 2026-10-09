"use client";

import { create } from "zustand";
import { PREBID_ITEMS } from "@/lib/data/rewards-p1";
import { faNum } from "@/lib/format";
import { useWalletStore } from "./wallet-store";

/* ─────────────────────────────────────────────────────────────
   استور پیش‌بید (Pre-bid) — فاز ۳ (P1)
   بیدِ از پیش ثبت‌شده روی آیتم‌های شوهای آینده؛ در لحظهٔ شروع شو
   به‌صورت خودکار ثبت می‌شود (مثل Max Bid). موجودی فقط «رزرو» چک
   می‌شود و برداشت واقعی هنگام شروع شو انجام خواهد شد.
   ───────────────────────────────────────────────────────────── */

export interface MyPrebid {
  amount: number;
  active: boolean;
}

interface PrebidState {
  myPrebids: Record<string, MyPrebid>;
  /** اعتبارسنجی مبلغ و موجودی و ثبت پیش‌بید */
  placePrebid: (itemId: string, amount: number) => { ok: boolean; error?: string };
  cancelPrebid: (itemId: string) => void;
}

export const usePrebidStore = create<PrebidState>((set, get) => ({
  myPrebids: {},

  placePrebid: (itemId, amount) => {
    const item = PREBID_ITEMS.find((i) => i.id === itemId);
    if (!item) return { ok: false, error: "آیتم پیدا نشد" };
    if (amount < item.startPrice) {
      return {
        ok: false,
        error: `حداقل پیش‌بید ${faNum(item.startPrice)} تومان است`,
      };
    }
    if (!useWalletStore.getState().canAfford(amount)) {
      return { ok: false, error: "موجودی کافی نیست — کیف پول را شارژ کن" };
    }
    set((s) => ({
      myPrebids: { ...s.myPrebids, [itemId]: { amount, active: true } },
    }));
    return { ok: true };
  },

  cancelPrebid: (itemId) => {
    const rest = { ...get().myPrebids };
    delete rest[itemId];
    set({ myPrebids: rest });
  },
}));

/* re-export برای راحتی مصرف‌کننده‌ها (شیت پیش‌بید و…) */
export { PREBID_ITEMS };
