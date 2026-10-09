"use client";

import { create } from "zustand";
import type { PaymentGateway, WalletTx } from "@/lib/data/types";

const SEED_TXS: WalletTx[] = [
  {
    id: "wt1",
    kind: "charge",
    title: "شارژ کیف پول",
    amount: 2_000_000,
    gateway: "زرین‌پال",
    atLabel: "امروز ۱۲:۳۰",
  },
  {
    id: "wt2",
    kind: "purchase",
    title: "خرید فوری — نیوبالانس ۵۳۰",
    amount: -1_850_000,
    atLabel: "امروز ۱۳:۱۰",
  },
  {
    id: "wt3",
    kind: "refund",
    title: "بازگشت وجه — سفارش لغوشده",
    amount: 350_000,
    atLabel: "دیروز ۱۹:۴۵",
  },
  {
    id: "wt4",
    kind: "charge",
    title: "شارژ کیف پول",
    amount: 2_000_000,
    gateway: "آیدی‌پی",
    atLabel: "۲ روز پیش",
  },
];

const SEED_BALANCE = 2_500_000;

interface WalletState {
  balance: number;
  txs: WalletTx[];
  /** شارژ کیف پول از درگاه شبیه‌سازی‌شده (زرین‌پال / آیدی‌پی) */
  charge: (amount: number, gateway: PaymentGateway, title?: string) => void;
  /** برداشت از موجودی — در صورت کسری false برمی‌گرداند */
  spend: (amount: number, title: string, kind?: "purchase" | "win") => boolean;
  /** موجودی کافی برای مبلغ داده‌شده؟ */
  canAfford: (amount: number) => boolean;
}

let txCounter = 100;

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: SEED_BALANCE,
  txs: SEED_TXS,
  charge: (amount, gateway, title) =>
    set((s) => ({
      balance: s.balance + amount,
      txs: [
        {
          id: `wt-${++txCounter}`,
          kind: "charge" as const,
          title: title ?? "شارژ کیف پول",
          amount,
          gateway,
          atLabel: "همین حالا",
        },
        ...s.txs,
      ],
    })),
  spend: (amount, title, kind = "purchase") => {
    const { balance } = get();
    if (balance < amount) return false;
    set((s) => ({
      balance: s.balance - amount,
      txs: [
        {
          id: `wt-${++txCounter}`,
          kind,
          title,
          amount: -amount,
          atLabel: "همین حالا",
        },
        ...s.txs,
      ],
    }));
    return true;
  },
  canAfford: (amount) => get().balance >= amount,
}));
