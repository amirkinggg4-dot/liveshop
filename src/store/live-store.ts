"use client";

import { create } from "zustand";
import type { ChatMessage, ShopItem, ShippingMethodId } from "@/lib/data/types";
import { getShowItems } from "@/lib/data/items";
import { getShow, getSeller } from "@/lib/data/shows";
import { CHAT_BY_SHOW } from "@/lib/data/chat";
import { DEFAULT_ADDRESS, SHIPPING_METHODS } from "@/lib/data/orders";
import { deriveTimeline } from "@/lib/order-state";
import { calcOrderTotal } from "@/lib/config/fees";
import { ITEM_PHOTO } from "@/lib/data/media";
import { useWalletStore } from "@/store/wallet-store";
import { useOrdersStore, nextOrderId } from "@/store/orders-store";
import type { Order } from "@/lib/data/types";
import { toman } from "@/lib/format";
import { AUCTION_ENABLED } from "@/lib/config";

/* ─────────────────────────────────────────────────────────────
   موتور اتاق لایو — v1.4 «لایو شاپ با قیمت ثابت»
   ─ خرید با قیمت ثابت: purchaseItem (تابع واحد کاهش موجودی — قبل از
     کم‌کردن، موجودی چک می‌شود تا دو خرید هم‌زمان آخرین عدد را دوبار
     نفروشند؛ ساختار طوری است که بعداً به API سمت سرور وصل شود —
     کافی است همین تابع با فراخوانی سرور جایگزین شود)
   ─ فروشنده با pinItem «کالای در حال نمایش» را عوض می‌کند و پیام
     «کالای جدید: …» در چت می‌آید
   ─ ربات‌های شبیه‌ساز خریدار به‌جای بید، گاهی «خرید» می‌کنند
   ─ موتور مزایده (فاز ۱) پشت AUCTION_ENABLED کاملاً حفظ شده است:
     applyBid، finishItem، Max Bid، تمدید ۱۰ ثانیه و ربات‌های بیدگذار
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

/* ═════════ v1.7.0 — گزارش پایان لایو (بخش ۶: POST /seller/shows/:id/end) ═════════
   مدت، اوج بیننده، تعداد و مبلغ فروش، پرفروش‌ترین کالا، تعداد سفارش جدید */
export interface LiveReport {
  showId: string;
  showTitle: string;
  endedAtLabel: string;
  /** طول پخش به ثانیه */
  durationSec: number;
  peakViewers: number;
  /** تعداد سفارش جدید */
  salesCount: number;
  /** مبلغ فروش (بدون ارسال) به تومان */
  salesAmount: number;
  topItem: { title: string; qty: number; amount: number } | null;
}

interface BotRival {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** احتمال بید/خرید در هر ثانیهٔ فعال */
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

export interface PurchaseOptions {
  itemId: string;
  /** «me» یا id ربات (فروش همان لحظهٔ نمایشی بدون کیف پول) */
  buyerId?: string;
  qty?: number;
  /** سایز/رنگ انتخاب‌شده — وقتی کالا variants دارد الزامی است */
  variantLabel?: string;
  shippingMethodId?: ShippingMethodId;
}

export interface PurchaseResult {
  ok: boolean;
  error?: string;
  orderId?: string;
}

interface LiveState {
  showId: string | null;
  items: ShopItem[];
  phase: AuctionPhase;
  activeItemId: string | null;
  /** v1.4 — کالای در حال نمایش (پین‌شده) — با pinItem از داشبورد فروشنده عوض می‌شود */
  pinnedItemId: string | null;
  /** v1.4 — برای انیمیشن تعویض کارت پایین هنگام پین‌شدن کالای جدید */
  pinnedAt: number;
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
  /* ── v1.7.0 — آمار جلسهٔ پخش برای گزارش پایان ── */
  /** لحظهٔ شروع پخش (مبنای مدت) */
  startedAtMs: number | null;
  /** بینندهٔ زندهٔ شبیه‌سازی‌شده (drift روی show.viewers) */
  viewers: number;
  peakViewers: number;
  /** شمارنده‌های جلسه — با startShow صفر و با هر خرید بالا می‌روند */
  sessionOrders: number;
  sessionSalesAmount: number;
  sessionSoldQty: Record<string, number>;
  /** آخرین گزارش پایان لایو — برای صفحهٔ گزارش */
  lastReport: LiveReport | null;

  startShow: (showId: string) => void;
  stopShow: () => void;
  /** v1.7.0 — پایان پخش توسط میزبان + ساخت گزارش */
  endShow: () => LiveReport | null;
  tick: () => void;
  placeMyBid: (amount: number) => { ok: boolean; error?: string };
  setMyMaxBid: (enabled: boolean, amount?: number) => void;
  pushChat: (m: Omit<ChatMessage, "id" | "time"> & { time?: string }) => void;
  startGiveaway: () => void;
  dismissFinished: () => void;
  startNextItem: () => void;
  clearPendingWin: () => void;
  /* ── v1.4 — لایو شاپ با قیمت ثابت ── */
  pinItem: (itemId: string) => void;
  purchaseItem: (opts: PurchaseOptions) => PurchaseResult;
}

function nowLabel(): string {
  const d = new Date();
  const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${fa[Math.floor(d.getHours() / 10)]}${fa[d.getHours() % 10]}:${fa[Math.floor(d.getMinutes() / 10)]}${fa[d.getMinutes() % 10]}`;
}

export const useLiveStore = create<LiveState>((set, get) => {
  /* ── اکشن‌های داخلی موتور مزایده (پشت AUCTION_ENABLED) ── */
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
      /* کسر خودکار از کیف پول + ساخت سفارش امانی (v1.8.0 — مدل جدید) */
      const wallet = useWalletStore.getState();
      const seller = getSeller(
        /* فروشندهٔ شو از روی آیتم اول مشخص می‌شود */
        get().showId === "sh1" ? "s1" : get().showId === "sh2" ? "s2" : "s3"
      );
      const orderId = nextOrderId();
      const paid = wallet.spend(total, `برد مزایده — ${item.title}`, "win", orderId);
      if (paid) {
        const createdAtMs = Date.now();
        const order: Order = {
          id: orderId,
          status: "PAID_HELD",
          itemId: item.id,
          itemTitle: item.title,
          itemBrand: item.brand,
          itemEmoji: item.emoji,
          cover: item.cover,
          photo: ITEM_PHOTO[item.id],
          sellerId: seller.id,
          sellerName: seller.name,
          sellerEmoji: seller.emoji,
          sellerColor: seller.color,
          itemPrice: price,
          qty: 1,
          shippingPrice: item.shippingPrice,
          shippingMethod: "tipax",
          total,
          address: DEFAULT_ADDRESS,
          createdAtMs,
          timeline: deriveTimeline("PAID_HELD", { createdAtMs }),
          escrow: true,
        };
        useOrdersStore.getState().addOrder(order);
        set({ pendingWin: { itemId: item.id, itemPrice: price, shippingPrice: item.shippingPrice, showId: get().showId ?? "sh1" } });
      }
    }
  };

  /* ── v1.4 — شبیه‌ساز خریدار ربات: گاهی یک عدد از کالای پین‌شده می‌خرد ──
     (فقط در حالت قیمت ثابت؛ در حالت حراج همان ربات‌ها بید می‌دهند) */
  const botPurchaseTick = () => {
    const s = get();
    const item = s.items.find((i) => i.id === s.pinnedItemId);
    if (!item || item.stock <= 0) return;
    for (const bot of BOTS) {
      /* احتمال پایین تا لایو طبیعی بماند — هر ~۵۰ ثانیه به‌طور میانگین یک خرید */
      if (Math.random() < bot.aggression * 0.14) {
        get().purchaseItem({
          itemId: item.id,
          buyerId: bot.id,
          qty: 1,
          variantLabel: item.variants?.find((v) => v.stock > 0)?.label,
        });
        break; /* حداکثر یک خرید ربات در هر تیک */
      }
    }
  };

  return {
    showId: null,
    items: [],
    phase: "idle",
    activeItemId: null,
    pinnedItemId: null,
    pinnedAt: 0,
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
    /* v1.7.0 — آمار جلسه */
    startedAtMs: null,
    viewers: 0,
    peakViewers: 0,
    sessionOrders: 0,
    sessionSalesAmount: 0,
    sessionSoldQty: {},
    lastReport: null,

    startShow: (showId) => {
      const items = getShowItems(showId).map((i) => ({ ...i, variants: i.variants?.map((v) => ({ ...v })) }));
      /* v1.4 — کالای در حال نمایش: اولین کالای موجود (پین‌شدهٔ پیش‌فرض شو) */
      const pinned =
        items.find((i) => i.status !== "sold" && i.stock > 0) ?? items[0];
      const seedChat = (CHAT_BY_SHOW[showId] ?? []).map((m) => ({ ...m }));
      const baseViewers = getShow(showId).viewers;
      set({
        showId,
        items,
        phase: "running",
        activeItemId: pinned?.id ?? null,
        pinnedItemId: pinned?.id ?? null,
        pinnedAt: Date.now(),
        currentBid: pinned?.price ?? pinned?.startPrice ?? 0,
        currentWinnerId: "",
        timerSec: pinned?.timerSec ?? 60,
        soldCount: items.filter((i) => i.status === "sold").length,
        myMaxBidEnabled: false,
        myMaxBidAmount: 0,
        lastExtendAt: null,
        pendingWin: null,
        finishedItem: null,
        chat: seedChat,
        giveaway: { phase: "idle", secondsLeft: 0, winnerLabel: "", winnerEmoji: "", winnerColor: "" },
        /* v1.7.0 — شروع جلسهٔ تازهٔ آمار */
        startedAtMs: Date.now(),
        viewers: baseViewers,
        peakViewers: baseViewers,
        sessionOrders: 0,
        sessionSalesAmount: 0,
        sessionSoldQty: {},
        lastReport: null,
      });
    },

    stopShow: () => set({ phase: "idle" }),

    /* ═══ v1.7.0 — پایان پخش میزبان + گزارش (POST /seller/shows/:id/end) ═══ */
    endShow: () => {
      const s = get();
      if (!s.showId || s.phase === "idle") return null;
      const show = (() => {
        try {
          return getShow(s.showId);
        } catch {
          return null;
        }
      })();
      const durationSec = s.startedAtMs
        ? Math.max(1, Math.round((Date.now() - s.startedAtMs) / 1000))
        : 0;
      let topItem: LiveReport["topItem"] = null;
      for (const [id, qty] of Object.entries(s.sessionSoldQty)) {
        const it = s.items.find((i) => i.id === id);
        if (!it) continue;
        if (!topItem || qty > topItem.qty) {
          topItem = { title: it.title, qty, amount: it.price * qty };
        }
      }
      const report: LiveReport = {
        showId: s.showId,
        showTitle: show?.title ?? "لایو",
        endedAtLabel: nowLabel(),
        durationSec,
        peakViewers: s.peakViewers,
        salesCount: s.sessionOrders,
        salesAmount: s.sessionSalesAmount,
        topItem,
      };
      set({ phase: "idle", lastReport: report });
      return report;
    },

    tick: () => {
      const s = get();

      /* ── v1.7.0 — شبیه‌سازی ملایم بینندهٔ زنده + ثبت اوج (برای گزارش پایان) ── */
      if (s.phase === "running" && s.viewers > 0) {
        const drift = Math.floor(Math.random() * 13) - 6; /* ±۶ */
        const viewers = Math.max(10, s.viewers + drift);
        set({ viewers, peakViewers: Math.max(s.peakViewers, viewers) });
      }

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

      /* ── v1.4 — حالت قیمت ثابت: ربات‌ها گاهی «خرید» می‌کنند، تایمری نیست ── */
      if (!AUCTION_ENABLED) {
        botPurchaseTick();
        return;
      }

      /* ── موتور مزایده (AUCTION_ENABLED=true) — حفظ‌شده از فاز ۱ ── */
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

    /* ═════════ v1.4 — پین‌کردن «کالای در حال نمایش» توسط فروشنده ═════════ */
    pinItem: (itemId) => {
      const s = get();
      const item = s.items.find((i) => i.id === itemId);
      if (!item) return;
      if (item.stock <= 0) return; /* کالای تمام‌شده پین نمی‌شود */
      if (s.pinnedItemId === itemId) return;
      set({
        pinnedItemId: itemId,
        activeItemId: itemId,
        pinnedAt: Date.now(),
        currentBid: item.price,
        currentWinnerId: "",
      });
      get().pushChat({
        author: "میزبان شو",
        text: `🆕 کالای جدید: «${item.title}» — ${toman(item.price)}`,
        kind: "system",
        time: nowLabel(),
        emoji: "🆕",
        color: "#6C5CFF",
      });
    },

    /* ═════════ v1.4 — خرید با قیمت ثابت (تابع واحد کاهش موجودی) ═════════
       اتمیک: چک موجودی + چک کیف پول + کاهش + ساخت سفارش همه در یک فراخوانی
       همگام انجام می‌شود تا دو خرید هم‌زمان آخرین عدد را دوبار نفروشند.
       برای اتصال به API سمت سرور کافی است بدنهٔ این تابع با فراخوانی
       fetch("/api/purchase") جایگزین شود — امضای ورودی/خروجی همان است. */
    purchaseItem: (opts) => {
      const s = get();
      const buyerId = opts.buyerId ?? "me";
      const item = s.items.find((i) => i.id === opts.itemId);
      if (!item) return { ok: false, error: "کالا پیدا نشد" };

      /* ۱) چک موجودی — قبل از هر کاهشی */
      if (item.stock <= 0) {
        return { ok: false, error: "کالا تمام شد — موجودی این کالا به پایان رسید" };
      }

      /* ۲) تعداد — حداکثر به اندازهٔ موجودی */
      const qty = Math.min(Math.max(1, opts.qty ?? 1), item.stock);
      if (opts.qty && opts.qty > item.stock) {
        return { ok: false, error: `فقط ${item.stock} عدد باقی مانده است` };
      }

      /* ۳) سایز/رنگ — اگر کالا گزینه دارد، انتخابش الزامی است */
      let variantLabel = opts.variantLabel;
      if (item.variants && item.variants.length > 0) {
        if (!variantLabel) {
          return { ok: false, error: "اول سایز/رنگ را انتخاب کن" };
        }
        const variant = item.variants.find((v) => v.label === variantLabel);
        if (!variant || variant.stock <= 0) {
          return { ok: false, error: "این سایز/رنگ تمام شده — گزینهٔ دیگری انتخاب کن" };
        }
        if (variant.stock < qty) {
          return { ok: false, error: `از این سایز فقط ${variant.stock} عدد باقی مانده است` };
        }
      } else {
        variantLabel = undefined;
      }

      /* ── ۴) مبلغ — منطق مشترک قیمت+ارسال (calcOrderTotal) ── */
      const method =
        SHIPPING_METHODS.find((m) => m.id === (opts.shippingMethodId ?? "tipax")) ??
        SHIPPING_METHODS[0];
      const totals = calcOrderTotal({
        unitPrice: item.price,
        qty,
        shippingFee: method.price,
      });
      const total = totals.total;

      const isMe = buyerId === "me";
      if (isMe) {
        /* ۵) چک کیف پول — قبل از کاهش موجودی (اتمیک بودن خرید من) */
        const wallet = useWalletStore.getState();
        if (!wallet.canAfford(total)) {
          return {
            ok: false,
            error: `موجودی کیف پول کافی نیست — ${toman(total)} نیاز داری (کیف پول را شارژ کن)`,
          };
        }
      }

      /* ۶) کاهش اتمیک موجودی (کالا + گزینهٔ سایز/رنگ) */
      const newStock = item.stock - qty;
      set((st) => ({
        items: st.items.map((i) => {
          if (i.id !== item.id) return i;
          const nextVariants = i.variants?.map((v) =>
            v.label === variantLabel ? { ...v, stock: Math.max(0, v.stock - qty) } : v
          );
          return {
            ...i,
            stock: Math.max(0, newStock),
            variants: nextVariants,
            status: (newStock <= 0 ? "sold" : i.status === "sold" ? "sold" : "buy_now") as ShopItem["status"],
            ...(newStock <= 0
              ? { soldPrice: i.soldPrice ?? i.price, soldTo: isMe ? "علی (شما)" : bidderLabel(buyerId) }
              : {}),
          };
        }),
        soldCount: newStock <= 0 && item.status !== "sold" ? st.soldCount + 1 : st.soldCount,
        /* v1.7.0 — شمارنده‌های جلسه برای گزارش پایان لایو */
        sessionOrders: st.sessionOrders + 1,
        sessionSalesAmount: st.sessionSalesAmount + item.price * qty,
        sessionSoldQty: {
          ...st.sessionSoldQty,
          [item.id]: (st.sessionSoldQty[item.id] ?? 0) + qty,
        },
      }));

      /* ۷) پیام چت خرید */
      const vis = isMe ? { emoji: "🧑‍💻", color: "#6C5CFF" } : botVisual(buyerId);
      get().pushChat({
        author: isMe ? "علی" : bidderLabel(buyerId),
        text: qty > 1 ? `✅ ${qty} عدد خرید کرد` : "✅ خرید کرد",
        kind: "purchase",
        tag: "خرید",
        time: nowLabel(),
        ...vis,
      });

      /* ۸) برای خرید من: کسر امانی از کیف پول + ساخت سفارش با تایم‌لاین امانی */
      if (isMe) {
        const wallet = useWalletStore.getState();
        const orderId = nextOrderId();
        const paid = wallet.spend(
          total,
          `خرید لایو — ${item.title}${qty > 1 ? ` ×${qty}` : ""}`,
          "purchase",
          orderId
        );
        if (!paid) {
          /* عملاً رخ نمی‌دهد (چک بالا) — برای اطمینان موجودی برمی‌گردد */
          set((st) => ({
            items: st.items.map((i) => (i.id === item.id ? { ...i, stock: i.stock + qty } : i)),
          }));
          return { ok: false, error: "موجودی کیف پول کافی نیست" };
        }
        const seller = getSeller(
          get().showId === "sh1" ? "s1" : get().showId === "sh2" ? "s2" : "s3"
        );
        const createdAtMs = Date.now();
        const order: Order = {
          id: orderId,
          status: "PAID_HELD",
          itemId: item.id,
          itemTitle: item.title,
          itemBrand: item.brand,
          itemEmoji: item.emoji,
          cover: item.cover,
          photo: ITEM_PHOTO[item.id],
          sellerId: seller.id,
          sellerName: seller.name,
          sellerEmoji: seller.emoji,
          sellerColor: seller.color,
          itemPrice: totals.itemsTotal,
          qty,
          variantLabel,
          shippingPrice: method.price,
          shippingMethod: method.id,
          total,
          address: DEFAULT_ADDRESS,
          createdAtMs,
          timeline: deriveTimeline("PAID_HELD", { createdAtMs }),
          escrow: true,
        };
        useOrdersStore.getState().addOrder(order);
        return { ok: true, orderId: order.id };
      }

      return { ok: true };
    },
  };
});
