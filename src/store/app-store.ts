"use client";

import { create } from "zustand";

export type ViewName =
  | "home"
  | "explore"
  | "live"
  | "product"
  | "checkout"
  | "orders"
  | "orderDetail"
  | "wallet"
  | "profile"
  | "sellerDashboard"
  | "sellerInventory"
  | "win"
  | "sellerSchedule"
  | "sellerReadyRoom"
  | "sellerListing"
  | "sellerOrders"
  | "sellerRevenue"
  | "activity"
  | "rewards"
  | "inbox"
  | "sellerAnalytics"
  | "sellerHealth"
  | "sellerMarketing"
  | "sellerRates"
  | "sellerStorefront"
  | "sellerSettings";

export interface StackEntry {
  view: ViewName;
  param?: string;
}

/** نماهایی که TopBar و BottomNav در آن‌ها نمایش داده می‌شود */
export const ROOT_VIEWS: ViewName[] = ["home", "explore", "orders", "profile"];
export const NAV_VIEWS: ViewName[] = [
  "home",
  "explore",
  "orders",
  "profile",
  "sellerDashboard",
  "sellerInventory",
  "wallet",
  // فاز ۲ — صفحات سمت فروشنده (ناوبری پایین برای دسترسی آسان در دمو)
  "sellerSchedule",
  "sellerReadyRoom",
  "sellerListing",
  "sellerOrders",
  "sellerRevenue",
  // فاز ۳ — صفحات خریدار و فروشنده (P1)
  "activity",
  "rewards",
  "inbox",
  "sellerAnalytics",
  "sellerHealth",
  "sellerMarketing",
  "sellerRates",
  "sellerStorefront",
  "sellerSettings",
];

interface AppState {
  stack: StackEntry[];
  currentShowId: string | null;
  currentItemId: string | null;
  currentOrderId: string | null;
  push: (view: ViewName, param?: string) => void;
  replace: (view: ViewName, param?: string) => void;
  back: () => void;
  setRoot: (view: ViewName) => void;
  openShow: (showId: string) => void;
  openItem: (showId: string, itemId: string) => void;
  openOrder: (orderId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  stack: [{ view: "home" }],
  currentShowId: null,
  currentItemId: null,
  currentOrderId: null,
  push: (view, param) =>
    set((s) => ({ stack: [...s.stack, { view, param }] })),
  replace: (view, param) =>
    set((s) => {
      const stack = [...s.stack];
      stack[stack.length - 1] = { view, param };
      return { stack };
    }),
  back: () =>
    set((s) => (s.stack.length > 1 ? { stack: s.stack.slice(0, -1) } : s)),
  setRoot: (view) => set({ stack: [{ view }] }),
  openShow: (showId) =>
    set((s) => ({
      currentShowId: showId,
      stack: [...s.stack, { view: "live" as const }],
    })),
  openItem: (showId, itemId) =>
    set((s) => ({
      currentShowId: showId,
      currentItemId: itemId,
      stack: [...s.stack, { view: "product" as const }],
    })),
  openOrder: (orderId) =>
    set((s) => ({
      currentOrderId: orderId,
      stack: [...s.stack, { view: "orderDetail" as const }],
    })),
}));

export function useCurrentEntry(): StackEntry {
  return useAppStore((s) => s.stack[s.stack.length - 1]);
}
