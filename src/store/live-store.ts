"use client";

import { create } from "zustand";
import type { ChatMessage, ShopItem } from "@/lib/data/types";
import { getShowItems } from "@/lib/data/items";
import { getSeller } from "@/lib/data/shows";
import { CHAT_BY_SHOW } from "@/lib/data/chat";
import { DEFAULT_ADDRESS } from "@/lib/data/orders";
import { useWalletStore } from "@/store/wallet-store";
import { useOrdersStore, nextOrderId } from "@/store/orders-store";
import type { Order } from "@/lib/data/types";
import { toman } from "@/lib/format";

/* ─────────────────────────────────────────────────────────────
   موتور مزایدهٔ شبیه‌سازی‌شدهٔ LiveShop (فاز ۱)
   - پلهٔ خودکار، ضدکلاهبرداری زمانی (تمدید ۱۰ ثانیه در ثانیه‌های آخر)
   - رقیب‌های شبیه‌سازی‌شده (ربات)
   - Max Bid: بید خودکار فقط در رقابت و فقط یک پله
   - کسر خودکار کیف پول + ساخت سفارش پس از برد
   ───────────────────────────────────────────────────────────── */

export type AuctionPhase = "idle" | "running" | "sold" | "awaiting_next";

export interface PendingWin {
  itemId: string;
  itemPrice: number;
  shippingPrice: number;
  showId: string;
}

export interface FinishedItem {
  title: string;
  winnerLabel: string;
  price: number;
  iWon: boolean;
}

interface BotRival {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** احتمال بید در هر ثانیهٔ فعال */
  aggression: number;
  budget: number;
}

export const BOTS: BotRival[] = [
  { id: "bot1", name: "reza_vault", emoji: "💎", color: "#00C896", aggression: 0.15, budget: 9_000_000 },
  { id: "bot2", name: "mina_k72", emoji: "🌸", color: "#B45CFF", aggression: 0.11, budget: 6_500_000 },
  { id: "bot3", name: "sole_hunter", emoji: "👟", color: "#FF3B8B", aggression: 0.08, budget: 12_000_000 },
];

export function bidderLabel(id: string): string {
  if (id === "me") return "علی (شما)";
  return BOTS.find((b) => b.id === id)?.name ?? "—";
}

function botVisual(id: string): Pick<ChatMessage, "emoji" | "color"> {
  const b = BOTS.find((x) => x.id === id);
  return { emoji: b?.emoji ?? "👤", color: b?.color ?? "#6C5CFF" };
}

let chatCounter = 0;
const nextChatId = () => `live-c${++chatCounter}`;

interface GiveawayState {
  phase: "idle" | "countdown" | "won";
  secondsLeft: number;
  winnerLabel: string;
  winnerEmoji: string;
  winnerColor: string;
}

interface LiveState {
  showId: string | null;
  items: ShopItem[];
  phase: AuctionPhase;
  activeItemId: string | null;
  currentBid: number;
  currentWinnerId: string;
  timerSec: number;
  soldCount: number;
  myMaxBidEnabled: boolean;
  myMaxBidAmount: number;
  /** timestamp آخرین تمدید تایمر — برای فلش UI */
  lastExtendAt: number | null;
  pendingWin: PendingWin | null;
  finishedItem: FinishedItem | null;
  chat: ChatMessage[];
  giveaway: GiveawayState;

  startShow: (showId: string) => void;
  stopShow: () => void;
  tick: () => void;
  placeMyBid: (amount: number) => { ok: boolean; error?: string };
  setMyMaxBid: (enabled: boolean, amount?: number) => void;
  pushChat: (m: Omit<ChatMessage, "id" | "time"> & { time?: string }) => void;
  startGiveaway: () => void;
  dismissFinished: () => void;
  startNextItem: () => void;
  clearPendingWin: () => void;
}

function nowLabel(): string {
  const d = new Date();
  const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${fa[Math.floor(d.getHours() / 10)]}${fa[d.getHours() % 10]}:${fa[Math.floor(d.getMinutes() / 10)]}${fa[d.getMinutes() % 10]}`;
}

export const useLiveStore = create<LiveState>((set, get) => {
  /* ── اکشن‌های داخلی موتور ── */
  const applyBid = (
    bidderId: string,
    amount: number,
    opts?: { auto?: boolean }
  ) => {
    const s = get();
    const item = s.items.find((i) => i.id === s.activeItemId);
    if (!item) return;
    const step = item.step;
    let extended = false;
    set((st) => ({
      currentBid: amount,
      currentWinnerId: bidderId,
      timerSec: st.timerSec <= 10 ? st.timerSec + 10 : st.timerSec,
      lastExtendAt: st.timerSec <= 10 ? Date.now() : st.lastExtendAt,
    }));
    extended = s.timerSec <= 10;
    const label = bidderLabel(bidderId);
    const vis = bidderId === "me" ? { emoji: "🧑‍💻", color: "#6C5CFF" } : botVisual(bidderId);
    get().pushChat({
      author: opts?.auto ? "Max Bid" : label,
      text: opts?.auto
        ? `⚡ بید خودکار Max Bid: ${toman(amount)}`
        : `بید ${toman(amount)} ثبت کرد`,
      kind: "system",
      time: nowLabel(),
      ...vis,
    });
    if (extended) {
      get().pushChat({
        author: "ضدکلاهبرداری زمانی",
        text: "⏱ بید در ثانیه‌های آخر — تایمر ۱۰ ثانیه تمدید شد",
        kind: "system",
        time: nowLabel(),
        emoji: "⏱",
        color: "#FF3B8B",
      });
    }
  };

  const finishItem = () => {
    const s = get();
    const item = s.items.find((i) => i.id === s.activeItemId);
    if (!item) return;
    const iWon = s.currentWinnerId === "me";
    const winnerLabel = bidderLabel(s.currentWinnerId);
    const price = s.currentBid;
    const total = price + item.shippingPrice;

    set((st) => ({
      phase: "sold" as const,
      soldCount: st.soldCount + 1,
      items: st.items.map((i) =>
        i.id === item.id ? { ...i, status: "sold" as const, soldPrice: price, soldTo: winnerLabel } : i
      ),
      finishedItem: { title: item.title, winnerLabel, price, iWon },
    }));

    get().pushChat({
      author: "میزبان شو",
      text: `🔥 «${item.title}» با ${toman(price)} فروخته شد — برنده: ${winnerLabel}`,
      kind: "winner",
      time: nowLabel(),
      emoji: "🔥",
      color: "#FF3B8B",
    });

    if (iWon) {
      /* کسر خودکار از کیف پول + ساخت سفارش */
      const wallet = useWalletStore.getState();
      const paid = wallet.spend(total, `برد مزایده — ${item.title}`, "win");
      if (paid) {
        const seller = getSeller(
          /* فروشندهٔ شو از روی آیتم اول مشخص می‌شود */
          get().showId === "sh1" ? "s1" : get().showId === "sh2" ? "s2" : "s3"
        );
        const order: Order = {
          id: nextOrderId(),
          itemTitle: item.title,
          itemBrand: item.brand,
          itemEmoji: item.emoji,
          cover: item.cover,
          sellerName: seller.name,
          sellerEmoji: seller.emoji,
          sellerColor: seller.color,
          itemPrice: price,
          shippingPrice: item.shippingPrice,
          shippingMethod: "tipax",
          total,
          address: DEFAULT_ADDRESS,
          createdAtLabel: "همین حالا",
          timeline: [
            { label: "پرداخت شد", done: true, atLabel: "همین حالا" },
            { label: "در حال آماده‌سازی", done: false },
            { label: "ارسال شد", done: false },
          ],
        };
        useOrdersStore.getState().addOrder(order);
        set({ pendingWin: { itemId: item.id, itemPrice: price, shippingPrice: item.shippingPrice, showId: get().showId ?? "sh1" } });
      }
    }
  };

  return {
    showId: null,
    items: [],
    phase: "idle",
    activeItemId: null,
    currentBid: 0,
    currentWinnerId: "",
    timerSec: 0,
    soldCount: 0,
    myMaxBidEnabled: false,
    myMaxBidAmount: 0,
    lastExtendAt: null,
    pendingWin: null,
    finishedItem: null,
    chat: [],
    giveaway: { phase: "idle", secondsLeft: 0, winnerLabel: "", winnerEmoji: "", winnerColor: "" },

    startShow: (showId) => {
      const items = getShowItems(showId).map((i) => ({ ...i }));
      const first =
        items.find((i) => i.status === "auction") ??
        items.find((i) => i.status === "up_next") ??
        items[0];
      const seedChat = (CHAT_BY_SHOW[showId] ?? []).map((m) => ({ ...m }));
      set({
        showId,
        items,
        phase: first && first.status !== "sold" ? "running" : "awaiting_next",
        activeItemId: first && first.status !== "sold" ? first.id : null,
        currentBid: first?.currentBid ?? first?.startPrice ?? 0,
        currentWinnerId: first?.status === "auction" ? "bot1" : "",
        timerSec: first?.timerSec ?? 60,
        soldCount: items.filter((i) => i.status === "sold").length,
        myMaxBidEnabled: false,
        myMaxBidAmount: 0,
        lastExtendAt: null,
        pendingWin: null,
        finishedItem: null,
        chat: seedChat,
        giveaway: { phase: "idle", secondsLeft: 0, winnerLabel: "", winnerEmoji: "", winnerColor: "" },
      });
    },

    stopShow: () => set({ phase: "idle" }),

    tick: () => {
      const s = get();
      /* گیواوی */
      if (s.giveaway.phase === "countdown") {
        const left = s.giveaway.secondsLeft - 1;
        if (left <= 0) {
          const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
          set({
            giveaway: { phase: "won", secondsLeft: 0, winnerLabel: bot.name, winnerEmoji: bot.emoji, winnerColor: bot.color },
          });
          get().pushChat({
            author: "گیواوی",
            text: `🎉 برندهٔ گیواوی: @${bot.name} — تبریک!`,
            kind: "giveaway",
            time: nowLabel(),
            emoji: "🎉",
            color: "#FF3B8B",
          });
        } else {
          set({ giveaway: { ...s.giveaway, secondsLeft: left } });
        }
        return;
      }

      if (s.phase !== "running") return;
      const item = s.items.find((i) => i.id === s.activeItemId);
      if (!item) return;
      const step = item.step;
      const nextMin = s.currentBid + step;

      /* ۱) رقیب‌های شبیه‌سازی‌شده */
      let someoneBid = false;
      for (const bot of BOTS) {
        if (someoneBid) break;
        if (s.currentWinnerId === bot.id) continue;
        if (bot.budget < nextMin) continue;
        const p = bot.aggression * (s.timerSec <= 10 ? 2.4 : 1);
        if (Math.random() < p) {
          applyBid(bot.id, nextMin);
          someoneBid = true;
        }
      }

      /* ۲) Max Bid — فقط در رقابت و فقط یک پله */
      const st2 = get();
      if (
        st2.myMaxBidEnabled &&
        st2.currentWinnerId !== "me" &&
        st2.currentBid + step <= st2.myMaxBidAmount &&
        useWalletStore.getState().canAfford(st2.currentBid + step + item.shippingPrice)
      ) {
        applyBid("me", st2.currentBid + step, { auto: true });
      }

      /* ۳) تایمر */
      const st3 = get();
      if (st3.timerSec <= 1) {
        finishItem();
      } else {
        set({ timerSec: st3.timerSec - 1 });
      }
    },

    placeMyBid: (amount) => {
      const s = get();
      const item = s.items.find((i) => i.id === s.activeItemId);
      if (!item || s.phase !== "running") return { ok: false, error: "مزایده فعال نیست" };
      const step = item.step;
      const minBid = s.currentBid + step;
      if (amount < minBid) {
        return { ok: false, error: `حداقل بید مجاز ${toman(minBid)} است (پلهٔ ${toman(step)})` };
      }
      const wallet = useWalletStore.getState();
      const projected = amount + item.shippingPrice;
      if (!wallet.canAfford(projected)) {
        return { ok: false, error: `موجودی کافی نیست — با احتساب ارسال به ${toman(projected)} نیاز داری` };
      }
      applyBid("me", amount);
      set({ myMaxBidAmount: Math.max(s.myMaxBidAmount, 0) });
      return { ok: true };
    },

    setMyMaxBid: (enabled, amount) =>
      set((s) => ({
        myMaxBidEnabled: enabled,
        myMaxBidAmount: amount != null ? Math.max(amount, s.currentBid + 1) : s.myMaxBidAmount,
      })),

    pushChat: (m) =>
      set((s) => ({
        chat: [...s.chat, { id: nextChatId(), time: m.time ?? nowLabel(), ...m } as ChatMessage],
      })),

    startGiveaway: () => {
      const s = get();
      if (s.giveaway.phase === "countdown") return;
      set({ giveaway: { phase: "countdown", secondsLeft: 8, winnerLabel: "", winnerEmoji: "", winnerColor: "" } });
      get().pushChat({
        author: "گیواوی",
        text: "🎁 گیواوی شروع شد! برنده تا چند ثانیهٔ دیگر اعلام می‌شود…",
        kind: "giveaway",
        time: nowLabel(),
        emoji: "🎁",
        color: "#FF3B8B",
      });
    },

    dismissFinished: () => set({ finishedItem: null }),

    startNextItem: () => {
      const s = get();
      const next = s.items.find((i) => i.status === "up_next");
      if (!next) {
        set({ phase: "awaiting_next", activeItemId: null, finishedItem: null });
        get().pushChat({
          author: "میزبان شو",
          text: "⏳ در انتظار آیتم بعدی — مزایده به‌زودی ادامه پیدا می‌کند",
          kind: "system",
          time: nowLabel(),
          emoji: "⏳",
          color: "#6C5CFF",
        });
        return;
      }
      set((st) => ({
        phase: "running",
        activeItemId: next.id,
        currentBid: next.startPrice,
        currentWinnerId: "",
        timerSec: 60,
        finishedItem: null,
        items: st.items.map((i) => (i.id === next.id ? { ...i, status: "auction" as const, currentBid: next.startPrice, timerSec: 60 } : i)),
      }));
      get().pushChat({
        author: "میزبان شو",
        text: `🛒 آیتم بعدی: «${next.title}» — قیمت شروع ${toman(next.startPrice)}`,
        kind: "system",
        time: nowLabel(),
        emoji: "🛒",
        color: "#6C5CFF",
      });
    },

    clearPendingWin: () => set({ pendingWin: null }),
  };
});
