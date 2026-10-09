"use client";

import { create } from "zustand";
import type { MyBidEntry, MyOfferEntry, SavedSearch } from "@/lib/data/buyer-p1";
import { MY_BIDS, MY_OFFERS, SAVED_SEARCHES } from "@/lib/data/buyer-p1";
import { useWalletStore } from "./wallet-store";

/* ─────────────────────────────────────────────────────────────
   استور سمت خریدار — فاز ۳ (تصاویر ۱۹ و ۱۴)
   بیدهای من (شمارش معکوس زنده، یک‌پله بالا بردن با اعتبارسنجی
   موجودی کیف پول، حذف بید)، پیشنهادهای فروشنده (پذیرش/رد) و
   جستجوهای ذخیره‌شده (ذخیره/حذف/هشدار).
   ───────────────────────────────────────────────────────────── */

export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface ActivityState {
  myBids: MyBidEntry[];
  myOffers: MyOfferEntry[];
  savedSearches: SavedSearch[];

  /** تیک ثانیه‌ای تایمر بیدهای فعال (leading/outbid) — حداقل ۰ */
  tickCountdown: () => void;
  /** یک پله بالا بردن بید — با گارد موجودی کیف پول؛ نتیجه برای toast */
  bumpBid: (bidId: string) => ActionResult;
  /** حذف کامل بید از فهرست */
  withdrawBid: (bidId: string) => void;
  acceptOffer: (id: string) => void;
  declineOffer: (id: string) => void;
  toggleSearchAlert: (id: string) => void;
  removeSearch: (id: string) => void;
  /** ذخیرهٔ جستجو با شمارش تطبیق تصادفی — کوئری تکراری خطا می‌دهد */
  saveSearch: (query: string, filterLabel?: string) => ActionResult;
}

/* شمارندهٔ شناسهٔ جستجوهای جدید — ادامه از روی seedها */
let searchCounter = 10;

/* ── seedها (کپی مستقل از دیتای static) ── */
const SEED_BIDS: MyBidEntry[] = MY_BIDS.map((b) => ({
  ...b,
  cover: { ...b.cover },
}));

const SEED_OFFERS: MyOfferEntry[] = MY_OFFERS.map((o) => ({
  ...o,
  cover: { ...o.cover },
}));

const SEED_SEARCHES: SavedSearch[] = SAVED_SEARCHES.map((s) => ({ ...s }));

export const useActivityStore = create<ActivityState>((set, get) => ({
  myBids: SEED_BIDS,
  myOffers: SEED_OFFERS,
  savedSearches: SEED_SEARCHES,

  tickCountdown: () =>
    set((s) => ({
      myBids: s.myBids.map((b) =>
        b.status === "leading" || b.status === "outbid"
          ? { ...b, endsInSec: Math.max(0, b.endsInSec - 1) }
          : b
      ),
    })),

  bumpBid: (bidId) => {
    const bid = get().myBids.find((b) => b.id === bidId);
    if (!bid) return { ok: false, error: "این بید پیدا نشد" };
    if (bid.status === "won" || bid.status === "lost")
      return { ok: false, error: "این مزایده تمام شده است" };

    const newMyBid = bid.myBid + bid.step;
    const wallet = useWalletStore.getState();
    if (!wallet.canAfford(newMyBid + bid.shippingPrice)) {
      return { ok: false, error: "موجودی کافی نیست — اول کیف پولت را شارژ کن" };
    }

    set((s) => ({
      myBids: s.myBids.map((b) =>
        b.id === bidId
          ? {
              ...b,
              myBid: newMyBid,
              currentBid: newMyBid,
              status: "leading" as const,
            }
          : b
      ),
    }));
    return { ok: true };
  },

  withdrawBid: (bidId) =>
    set((s) => ({ myBids: s.myBids.filter((b) => b.id !== bidId) })),

  acceptOffer: (id) =>
    set((s) => ({
      myOffers: s.myOffers.map((o) =>
        o.id === id ? { ...o, status: "accepted" as const } : o
      ),
    })),

  declineOffer: (id) =>
    set((s) => ({
      myOffers: s.myOffers.map((o) =>
        o.id === id ? { ...o, status: "declined" as const } : o
      ),
    })),

  toggleSearchAlert: (id) =>
    set((s) => ({
      savedSearches: s.savedSearches.map((ss) =>
        ss.id === id ? { ...ss, alertOn: !ss.alertOn } : ss
      ),
    })),

  removeSearch: (id) =>
    set((s) => ({ savedSearches: s.savedSearches.filter((ss) => ss.id !== id) })),

  saveSearch: (query, filterLabel) => {
    const trimmed = query.trim();
    if (!trimmed) return { ok: false, error: "متن جستجو خالی است" };
    const exists = get().savedSearches.some(
      (ss) => ss.query.trim() === trimmed
    );
    if (exists) {
      return { ok: false, error: "این جستجو قبلاً ذخیره شده" };
    }
    const entry: SavedSearch = {
      id: `ss-${++searchCounter}`,
      query: trimmed,
      filterLabel: filterLabel ?? "همه",
      matchCount: Math.floor(Math.random() * 40) + 3,
      alertOn: true,
    };
    set((s) => ({ savedSearches: [...s.savedSearches, entry] }));
    return { ok: true };
  },
}));
