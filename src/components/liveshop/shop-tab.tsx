"use client";

import { X, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { faNum, toman } from "@/lib/format";
import { stockLabelFa } from "@/lib/data/items";
import { useLiveStore } from "@/store/live-store";
import { useAppStore } from "@/store/app-store";
import type { ShopItem } from "@/lib/data/types";
import {
  GradientCover,
  Price,
  StatusChip,
  SmartImg,
} from "@/components/liveshop/shared";
import QuickCheckoutSheet from "@/components/liveshop/quick-checkout-sheet";
import { ITEM_PHOTO } from "@/lib/data/media";
import { AUCTION_ENABLED } from "@/lib/config";
import { useState } from "react";

/* ═══════════════════════ ShopTab — شیت فروشگاه شو (v1.4) ═══════════════════════
   فهرست همهٔ کالاهای شو با عکس، قیمت ثابت، موجودی و دکمهٔ «خرید».
   کالای پین‌شدهٔ در حال نمایش، بالا و برجسته. وضعیت‌ها از liveStore.items
   می‌آید (کپی زندهٔ موتور — soldها همان لحظه آپدیت می‌شوند). */

function ShopCard({
  item,
  isPinned,
  onBuy,
  onOpen,
}: {
  item: ShopItem;
  isPinned: boolean;
  onBuy: () => void;
  onOpen: () => void;
}) {
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const photo = ITEM_PHOTO[item.id];
  const soldOut = item.stock <= 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      aria-label={`مشاهدهٔ محصول: ${item.title}`}
      className={cn(
        "cursor-pointer rounded-2xl border bg-ls-card p-2.5 text-right transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ls-purple/60 active:scale-[.98]",
        isPinned
          ? "border-ls-green/60 shadow-[0_0_16px_rgba(0,200,150,.25)]"
          : "border-white/5 hover:border-ls-purple/40"
      )}
    >
      <div className="relative">
        {photo ? (
          <div className="relative h-24 w-full overflow-hidden rounded-xl">
            <SmartImg
              src={photo}
              alt={`تصویر کالا: ${item.title}`}
              sizes="200px"
              className="object-cover"
            />
          </div>
        ) : (
          <GradientCover
            cover={item.cover}
            className="h-24 w-full rounded-xl"
            emojiClassName="text-4xl"
          />
        )}
        {/* برچسب وضعیت */}
        <div className="absolute top-1.5 right-1.5">
          {isPinned ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ls-green px-2 py-0.5 text-[10px] font-black text-[#04281e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#04281e] animate-ls-pulse" aria-hidden />
              در حال نمایش
            </span>
          ) : (
            <StatusChip status={item.status} />
          )}
        </div>
      </div>

      <p className="mt-2 text-xs font-bold leading-5 text-white/90 line-clamp-2 min-h-10">
        {item.title}
      </p>

      {/* قیمت ثابت + موجودی */}
      <div className="mt-1.5">
        <Price
          amount={item.price}
          className={cn("text-sm", soldOut ? "text-white/50" : "text-ls-green")}
        />
        <p
          className={cn(
            "mt-0.5 text-[10px] font-bold",
            soldOut ? "text-white/40" : item.stock < 3 ? "text-amber-300" : "text-white/55"
          )}
          aria-live="polite"
        >
          {stockLabelFa(item.stock)}
        </p>
        {/* دکمهٔ خرید / تمام شد */}
        <button
          onClick={(e) => {
            stop(e);
            onBuy();
          }}
          disabled={soldOut}
          className={cn(
            "mt-1.5 w-full rounded-lg py-1.5 text-[11px] font-bold transition-all active:scale-[.98]",
            soldOut
              ? "cursor-not-allowed bg-white/5 text-white/35"
              : isPinned
                ? "bg-ls-green text-[#04281e] font-extrabold hover:brightness-110"
                : "border border-ls-green/40 bg-ls-green/15 text-ls-green hover:bg-ls-green/25"
          )}
          aria-label={soldOut ? `${item.title} تمام شد` : `خرید ${item.title} به قیمت ${toman(item.price)}`}
        >
          {soldOut ? "تمام شد" : "خرید"}
        </button>
      </div>
    </div>
  );
}

/* ── کارت حالت مزایده (AUCTION_ENABLED=true) — حفظ‌شده از فاز ۱ ── */
function AuctionShopCard({
  item,
  isLiveActive,
  liveBid,
  liveTimer,
  onOpen,
}: {
  item: ShopItem;
  isLiveActive: boolean;
  liveBid: number;
  liveTimer: number;
  onOpen: () => void;
}) {
  const faClock = (n: number) =>
    `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      aria-label={`مشاهدهٔ محصول: ${item.title}`}
      className="cursor-pointer rounded-2xl bg-ls-card border border-white/5 p-2.5 text-right hover:border-ls-purple/40 active:scale-[.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ls-purple/60"
    >
      <GradientCover
        cover={item.cover}
        className="h-24 w-full rounded-xl"
        emojiClassName="text-4xl"
      />
      <p className="mt-2 text-xs font-bold leading-5 text-white/90 line-clamp-2 min-h-10">
        {item.title}
      </p>
      {item.status === "auction" && (
        <div className="mt-1.5">
          <p className="text-[10px] text-white/45">بید فعلی</p>
          <div className="flex items-center gap-1.5">
            <Price amount={liveBid} className="text-sm text-ls-purple-soft" />
            <span
              className={cn(
                "ms-auto inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums",
                isLiveActive && liveTimer <= 10 ? "text-[#FF3B5C]" : "text-white/55"
              )}
            >
              {faClock(liveTimer)}
            </span>
          </div>
        </div>
      )}
      {item.status === "up_next" && (
        <div className="mt-1.5">
          <p className="text-[10px] text-white/45">شروع از</p>
          <p className="text-sm font-extrabold text-white/85 tabular-nums">
            {toman(item.startPrice)}
          </p>
        </div>
      )}
      {item.status === "sold" && (
        <div className="mt-1.5">
          <p className="text-sm font-extrabold text-white/60 tabular-nums">
            {toman(item.soldPrice ?? item.startPrice)}
          </p>
          <p className="mt-0.5 text-[10px] text-white/40">
            فروخته شد به {item.soldTo ?? "—"}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ShopTab({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const items = useLiveStore((s) => s.items);
  const soldCount = useLiveStore((s) => s.soldCount);
  const pinnedItemId = useLiveStore((s) => s.pinnedItemId);
  const activeItemId = useLiveStore((s) => s.activeItemId);
  const currentBid = useLiveStore((s) => s.currentBid);
  const timerSec = useLiveStore((s) => s.timerSec);
  const showId = useLiveStore((s) => s.showId);
  const openItem = useAppStore((s) => s.openItem);
  /* v1.4 — دکمهٔ «خرید» هر کالا: شیت خرید سریع داخل خود Shop باز می‌شود */
  const [checkoutItem, setCheckoutItem] = useState<ShopItem | null>(null);

  if (!open) return null;

  const sid = showId ?? "sh1";
  const itemsTotal = items.length;
  const pct = itemsTotal > 0 ? Math.min(100, Math.round((soldCount / itemsTotal) * 100)) : 0;

  /* v1.4 — کالای پین‌شده بالا و برجسته؛ بقیه با حفظ ترتیب */
  const pinned = items.find((i) => i.id === pinnedItemId && i.stock > 0);
  const rest = items.filter((i) => i.id !== pinned?.id);
  const ordered = pinned ? [pinned, ...rest] : rest;

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col bg-ls-bg/97 backdrop-blur-md"
      role="dialog"
      aria-label="Shop این شو"
    >
      {/* هدر */}
      <div className="shrink-0 border-b border-white/5 px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <Store className="w-4.5 h-4.5 text-ls-purple-soft" aria-hidden />
          <h2 className="text-base font-extrabold">Shop این شو</h2>
          <button
            onClick={onClose}
            aria-label="بستن Shop"
            className="ms-auto w-9 h-9 rounded-full bg-ls-card-2 flex items-center justify-center text-white/80 hover:bg-ls-line active:scale-95 transition-all"
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>

        <p className="mt-2.5 text-xs text-white/60" aria-live="polite">
          <span className="font-extrabold text-ls-green tabular-nums">
            {faNum(soldCount)}
          </span>{" "}
          از <span className="font-bold tabular-nums">{faNum(itemsTotal)}</span>{" "}
          فروخته شد
        </p>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`پیشرفت فروش شو: ${faNum(pct)} درصد`}
        >
          <div
            className="h-full rounded-full bg-ls-green shadow-[0_0_10px_rgba(0,200,150,.5)] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* گرید آیتم‌ها */}
      <div className="flex-1 overflow-y-auto scroll-thin p-4">
        <div className="grid grid-cols-2 gap-3">
          {AUCTION_ENABLED
            ? items.map((item) => (
                <AuctionShopCard
                  key={item.id}
                  item={item}
                  isLiveActive={item.id === activeItemId && item.status === "auction"}
                  liveBid={item.id === activeItemId ? currentBid : item.currentBid ?? item.startPrice}
                  liveTimer={item.id === activeItemId ? timerSec : item.timerSec ?? 0}
                  onOpen={() => openItem(sid, item.id)}
                />
              ))
            : ordered.map((item) => (
                <ShopCard
                  key={item.id}
                  item={item}
                  isPinned={item.id === pinned?.id}
                  onOpen={() => openItem(sid, item.id)}
                  onBuy={() => setCheckoutItem(item)}
                />
              ))}
        </div>
      </div>

      {/* v1.4 — شیت خرید سریع برای کالای انتخاب‌شده از Shop */}
      {checkoutItem && (
        <QuickCheckoutSheet
          key={checkoutItem.id}
          item={checkoutItem}
          open
          onOpenChange={(v) => {
            if (!v) setCheckoutItem(null);
          }}
        />
      )}
    </div>
  );
}
