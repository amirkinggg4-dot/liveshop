"use client";

/* ─────────────────────────────────────────────────────────────
   v2.0.1 — استور شیت معرفی فروشندگی (SellerIntroSheet)
   فقط وضعیت «باز/بسته» Drawer را نگه می‌دارد تا دو نقطهٔ ورود
   (تب «فروش» در ناوبری و ردیف «فروشندهٔ من» در حساب) بدون وابستگی
   به هم بتوانند شیت را باز کنند. منطق گیت (مهمان/none) در
   useSellerEntry داخل seller-intro-sheet.tsx است.
   ───────────────────────────────────────────────────────────── */

import { create } from "zustand";

interface SellerIntroState {
  open: boolean;
  openIntro: () => void;
  closeIntro: () => void;
}

export const useSellerIntroStore = create<SellerIntroState>((set) => ({
  open: false,
  openIntro: () => set({ open: true }),
  closeIntro: () => set({ open: false }),
}));
