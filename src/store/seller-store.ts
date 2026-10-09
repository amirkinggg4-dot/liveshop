"use client";

import { create } from "zustand";
import type { InventoryDraft, SellerOrder, SellerScheduledShow } from "@/lib/data/seller";
import { INVENTORY_DRAFTS, SELLER_ORDERS, SELLER_SCHEDULED_SHOWS } from "@/lib/data/seller";
import { useLiveStore } from "./live-store";
import { toman } from "@/lib/format";

/* ─────────────────────────────────────────────────────────────
   استور سمت فروشنده — فاز ۲
   شوهای زمان‌بندی‌شده، سفارش‌ها (چاپ برچسب/ثبت کد رهگیری/تکمیل/حل اختلاف)،
   انعام و پیشنهاد خرید خصوصی (نمایش عمومی انعام در چت لایو)،
   پیش‌نویس‌های انبار و شمارندهٔ انتشار آگهی.
   ───────────────────────────────────────────────────────────── */

export interface TipEvent {
  id: string;
  from: string;
  emoji: string;
  color: string;
  amount: number;
  atLabel: string;
}

export interface OfferEvent {
  id: string;
  buyer: string;
  buyerEmoji: string;
  buyerColor: string;
  itemTitle: string;
  amount: number;
  atLabel: string;
}

export interface SellerState {
  scheduledShows: SellerScheduledShow[];
  orders: SellerOrder[];
  /** جدیدترین انعام اول */
  tips: TipEvent[];
  /** جدیدترین پیشنهاد اول */
  offers: OfferEvent[];
  drafts: InventoryDraft[];
  publishedCount: number;

  addScheduledShow: (s: SellerScheduledShow) => void;
  /** سفارش to_scan → shipped + کد رهگیری ۶رقمی؛ کد ساخته‌شده یا null برمی‌گرداند */
  printLabel: (orderId: string) => string | null;
  /** فقط ثبت/به‌روزرسانی کد رهگیری سفارش (وضعیت عوض نمی‌شود) */
  addTracking: (orderId: string, code: string) => void;
  /** shipped → completed + برچسب رضایت خریدار */
  completeOrder: (orderId: string) => void;
  /** علامت‌گذاری سفارش مشکل‌دار به‌عنوان حل‌شده (reply در دمو ذخیره نمی‌شود) */
  resolveIssue: (orderId: string, reply: string) => void;
  /** ثبت انعام + نمایش عمومی سبز در چت لایو (اگر شو فعالی باز باشد) */
  addTip: (amount: number, from?: string, emoji?: string, color?: string) => void;
  addOffer: (o: Omit<OfferEvent, "id" | "atLabel">) => void;
  addDraft: (d: Omit<InventoryDraft, "id">) => void;
  /** حذف پیش‌نویس + شمارش انتشار */
  publishDraft: (draftId: string) => void;
}

/* شمارنده‌های شناسه (الگوی nextChatId در live-store) — ادامه از روی seedها */
let tipCounter = 2;
let offerCounter = 2;
let draftCounter = 2;

/** برچسب زمان فارسی HH:MM (کپی الگوی nowLabel در live-store) */
function nowLabel(): string {
  const d = new Date();
  const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const two = (n: number) => `${fa[Math.floor(n / 10)]}${fa[n % 10]}`;
  return `${two(d.getHours())}:${two(d.getMinutes())}`;
}

/* ── seedها (کپی مستقل از دیتای static) ── */
const SEED_SCHEDULED: SellerScheduledShow[] = SELLER_SCHEDULED_SHOWS.map((s) => ({
  ...s,
  cover: { ...s.cover },
}));

const SEED_ORDERS: SellerOrder[] = SELLER_ORDERS.map((o) => ({
  ...o,
  cover: { ...o.cover },
}));

const SEED_TIPS: TipEvent[] = [
  { id: "tip-1", from: "reza_vault", emoji: "💎", color: "#00C896", amount: 500_000, atLabel: "امشب ۲۲:۰۵" },
  { id: "tip-2", from: "mina_k72", emoji: "🌸", color: "#B45CFF", amount: 200_000, atLabel: "امشب ۲۱:۳۰" },
];

const SEED_OFFERS: OfferEvent[] = [
  {
    id: "off-1",
    buyer: "sole_hunter",
    buyerEmoji: "👟",
    buyerColor: "#FF3B8B",
    itemTitle: "ادیداس سامبا اورجینال",
    amount: 3_100_000,
    atLabel: "امشب ۲۲:۱۵",
  },
  {
    id: "off-2",
    buyer: "sara_snkrs",
    buyerEmoji: "🎀",
    buyerColor: "#6C5CFF",
    itemTitle: "ست ۳ عددی جوراب ورزشی",
    amount: 340_000,
    atLabel: "امشب ۲۱:۵۰",
  },
];

const SEED_DRAFTS: InventoryDraft[] = INVENTORY_DRAFTS.map((d) => ({
  ...d,
  cover: { ...d.cover },
}));

export const useSellerStore = create<SellerState>((set, get) => ({
  scheduledShows: SEED_SCHEDULED,
  orders: SEED_ORDERS,
  tips: SEED_TIPS,
  offers: SEED_OFFERS,
  drafts: SEED_DRAFTS,
  publishedCount: 0,

  addScheduledShow: (show) =>
    set((s) => ({
      scheduledShows: [...s.scheduledShows, { ...show, cover: { ...show.cover } }],
    })),

  printLabel: (orderId) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order || order.status !== "to_scan") return null;
    const code = `TPX-${Math.floor(100_000 + Math.random() * 900_000)}`;
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, status: "shipped" as const, trackingCode: code } : o
      ),
    }));
    return code;
  },

  addTracking: (orderId, code) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, trackingCode: code } : o)),
    })),

  completeOrder: (orderId) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && o.status === "shipped"
          ? { ...o, status: "completed" as const, reviewLabel: "خریدار رضایت داد ★" }
          : o
      ),
    })),

  resolveIssue: (orderId) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, issueResolved: true } : o)),
    })),

  addTip: (amount, from = "بینندهٔ مهمان", emoji = "💚", color = "#00C896") => {
    const tip: TipEvent = {
      id: `tip-${++tipCounter}`,
      from,
      emoji,
      color,
      amount,
      atLabel: nowLabel(),
    };
    set((s) => ({ tips: [tip, ...s.tips] }));

    /* نمایش عمومی انعام در چت لایو — فقط وقتی شوی باز است */
    const live = useLiveStore.getState();
    if (live.showId) {
      live.pushChat({
        author: "انعام",
        text: `💚 ${from} انعام ${toman(amount)} داد — دستت درد نکنه!`,
        kind: "system",
        emoji: "💚",
        color: "#00C896",
      });
    }
  },

  addOffer: (o) =>
    set((s) => ({
      offers: [{ ...o, id: `off-${++offerCounter}`, atLabel: nowLabel() }, ...s.offers],
    })),

  addDraft: (d) =>
    set((s) => ({
      drafts: [...s.drafts, { ...d, id: `dr${++draftCounter}`, cover: { ...d.cover } }],
    })),

  publishDraft: (draftId) =>
    set((s) => {
      if (!s.drafts.some((d) => d.id === draftId)) return {};
      return {
        drafts: s.drafts.filter((d) => d.id !== draftId),
        publishedCount: s.publishedCount + 1,
      };
    }),
}));
