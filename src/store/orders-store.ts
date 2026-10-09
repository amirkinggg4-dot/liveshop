"use client";

import { create } from "zustand";
import { SEED_ORDERS } from "@/lib/data/orders";
import type { Order } from "@/lib/data/types";

interface OrdersState {
  orders: Order[];
  addOrder: (order: Order) => void;
  /** یک قدم به جلو بردن تایم‌لاین سفارش (دموی پیشروی وضعیت) */
  advance: (orderId: string) => void;
  setRated: (orderId: string) => void;
}

let orderCounter = 10240;

function nextOrderId(): string {
  orderCounter += 1;
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(orderCounter)
    .split("")
    .map((d) => persianDigits[Number(d)])
    .join("");
}

export { nextOrderId };

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: SEED_ORDERS,
  addOrder: (order) =>
    set((s) => ({ orders: [order, ...s.orders] })),
  advance: (orderId) =>
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        const idx = o.timeline.findIndex((st) => !st.done);
        if (idx === -1) return o;
        const timeline = o.timeline.map((st, i) =>
          i === idx ? { ...st, done: true, atLabel: "همین حالا" } : st
        );
        const trackingCode =
          idx === o.timeline.length - 1
            ? (o.trackingCode ?? `TPX-${Math.floor(1000 + Math.random() * 9000)}`)
            : o.trackingCode;
        return { ...o, timeline, trackingCode };
      }),
    })),
  setRated: (orderId) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, rated: true } : o
      ),
    })),
}));
