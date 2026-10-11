"use client";

import { create } from "zustand";
import type { PaymentGateway, WalletTx } from "@/lib/data/types";

/* ─────────────────────────────────────────────────────────────
   v1.8.0 — استور کیف پول (mock ledger)
   هر تراکنش: شناسهٔ مرجع + زمان واقعی + لینک سفارش (در صورت وجود)
   ───────────────────────────────────────────────────────────── */

const H = 3_600_000;
const D = 24 * H;
const NOW = Date.now();

const SEED_TXS: WalletTx[] = [
  {
    id: "wt1",
    kind: "charge",
    title: "شارژ کیف پول",
    amount: 2_000_000,
    gateway: "زرین‌پال",
    atMs: NOW - 26 * H,
    refId: "ZP-848210",
    status: "موفق",
  },
  {
    id: "wt2",
    kind: "refund",
    title: "نتیجهٔ اختلاف — بازگشت وجه پوکمون کارت اولترا رِیر BGS 9.5",
    amount: 7_545_000,
    atMs: NOW - 4 * D,
    refId: "RF-331209",
    status: "موفق",
    orderId: "۱۰۲۳۶",
  },
  {
    id: "wt3",
    kind: "purchase",
    title: "خرید لایو — جردن ۱ مید «شیکاگو»",
    amount: -8_945_000,
    atMs: NOW - 3 * D,
    refId: "TX-90214",
    status: "موفق",
    orderId: "۱۰۲۳۸",
  },
  {
    id: "wt4",
    kind: "charge",
    title: "شارژ کیف پول",
    amount: 2_000_000,
    gateway: "آیدی‌پی",
    atMs: NOW - 3 * D - 2 * H,
    refId: "IP-559881",
    status: "موفق",
  },
  {
    id: "wt5",
    kind: "refund",
    title: "بازگشت وجه — لغو سفارش کولهٔ ورزشی ضدآب ۳۰ لیتری",
    amount: 1_495_000,
    atMs: NOW - 4 * D - 10 * H,
    refId: "RF-318455",
    status: "موفق",
    orderId: "۱۰۲۳۴",
  },
  {
    id: "wt6",
    kind: "purchase",
    title: "خرید لایو — نیوبالانس ۵۳۰ خاکستری",
    amount: -3_930_000,
    atMs: NOW - 7 * D,
    refId: "TX-88431",
    status: "موفق",
    orderId: "۱۰۲۳۵",
  },
];

const SEED_BALANCE = 2_500_000;

interface WalletState {
  balance: number;
  txs: WalletTx[];
  /** شارژ کیف پول از درگاه شبیه‌سازی‌شده (زرین‌پال / آیدی‌پی) — با شناسهٔ مرجع */
  charge: (amount: number, gateway: PaymentGateway, title?: string) => WalletTx;
  /** برداشت از موجودی — در صورت کسری false برمی‌گرداند */
  spend: (
    amount: number,
    title: string,
    kind?: "purchase" | "win",
    orderId?: string
  ) => boolean;
  /** بازگشت وجه به کیف پول (لغو سفارش / نتیجهٔ اختلاف) */
  refund: (amount: number, title: string, orderId?: string) => WalletTx;
  /** موجودی کافی برای مبلغ داده‌شده؟ */
  canAfford: (amount: number) => boolean;
}

let txCounter = 100;

/** شناسهٔ مرجع برای تراکنش‌های تازه (شبیه‌سازی ledger) */
function mkRefId(kind: WalletTx["kind"], gateway?: PaymentGateway): string {
  const n = Math.floor(100_000 + Math.random() * 899_999);
  const prefix =
    kind === "charge"
      ? gateway === "آیدی‌پی"
        ? "IP"
        : "ZP"
      : kind === "refund"
        ? "RF"
        : "TX";
  return `${prefix}-${n}`;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: SEED_BALANCE,
  txs: SEED_TXS,
  charge: (amount, gateway, title) => {
    const tx: WalletTx = {
      id: `wt-${++txCounter}`,
      kind: "charge",
      title: title ?? "شارژ کیف پول",
      amount,
      gateway,
      atMs: Date.now(),
      refId: mkRefId("charge", gateway),
      status: "موفق",
    };
    set((s) => ({ balance: s.balance + amount, txs: [tx, ...s.txs] }));
    return tx;
  },
  spend: (amount, title, kind = "purchase", orderId) => {
    const { balance } = get();
    if (balance < amount) return false;
    const tx: WalletTx = {
      id: `wt-${++txCounter}`,
      kind,
      title,
      amount: -amount,
      atMs: Date.now(),
      refId: mkRefId(kind),
      status: "موفق",
      ...(orderId ? { orderId } : {}),
    };
    set((s) => ({ balance: s.balance - amount, txs: [tx, ...s.txs] }));
    return true;
  },
  refund: (amount, title, orderId) => {
    const tx: WalletTx = {
      id: `wt-${++txCounter}`,
      kind: "refund",
      title,
      amount,
      atMs: Date.now(),
      refId: mkRefId("refund"),
      status: "موفق",
      ...(orderId ? { orderId } : {}),
    };
    set((s) => ({ balance: s.balance + amount, txs: [tx, ...s.txs] }));
    return tx;
  },
  canAfford: (amount) => get().balance >= amount,
}));
