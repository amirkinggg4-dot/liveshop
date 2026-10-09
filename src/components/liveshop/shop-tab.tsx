"use client";

import { X, Clock, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";
import { faNum, toman, faClock } from "@/lib/format";
import { useLiveStore } from "@/store/live-store";
import { useAppStore } from "@/store/app-store";
import type { ShopItem } from "@/lib/data/types";
import { GradientCover, Price, StatusChip } from "@/components/liveshop/shared";

/* ═══════════════════════ ShopTab — اورلی تمام‌صفحهٔ Shop داخل لایو ═══════════════════════
   وضعیت‌ها از liveStore.items می‌آید (کپی زندهٔ موتور — soldها همان لحظه آپدیت می‌شوند). */

function ShopCard({
  item,
  isLiveActive,
  liveBid,
  liveTimer,
  onOpen,
  onBuyNow,
}: {
  item: ShopItem;
  isLiveActive: boolean;
  liveBid: number;
  liveTimer: number;
  onOpen: () => void;
  onBuyNow: () => void;
}) {
  const stop = (e: React.MouseEvent) => e.stopPropagation();

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
      <div className="relative">
        <GradientCover
          cover={item.cover}
          className="h-24 w-full rounded-xl"
          emojiClassName="text-4xl"
        />
        <div className="absolute top-1.5 right-1.5">
          <StatusChip status={item.status} />
        </div>
        {isLiveActive && item.status === "auction" && (
          <div className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-ls-pink animate-ls-pulse" aria-hidden />
            زنده
          </div>
        )}
      </div>

      <p className="mt-2 text-xs font-bold leading-5 text-white/90 line-clamp-2 min-h-10">
        {item.title}
      </p>

      {/* auction → بید فعلی زنده + تایمر ریز */}
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
              aria-label={`زمان باقی‌مانده: ${faClock(liveTimer)}`}
            >
              <Clock className="w-3 h-3" aria-hidden />
              {faClock(liveTimer)}
            </span>
          </div>
        </div>
      )}

      {/* up_next → قیمت شروع */}
      {item.status === "up_next" && (
        <div className="mt-1.5">
          <p className="text-[10px] text-white/45">شروع از</p>
          <p className="text-sm font-extrabold text-white/85 tabular-nums">
            {toman(item.startPrice)}
          </p>
        </div>
      )}

      {/* buy_now → قیمت سبز + دکمهٔ خرید فوری */}
      {item.status === "buy_now" && (
        <div className="mt-1.5">
          <Price
            amount={item.buyNowPrice ?? item.startPrice}
            className="text-sm text-ls-green"
          />
          <button
            onClick={(e) => {
              stop(e);
              onBuyNow();
            }}
            className="mt-1.5 w-full rounded-lg border border-ls-green/40 bg-ls-green/15 py-1.5 text-[11px] font-bold text-ls-green hover:bg-ls-green/25 active:scale-[.98] transition-all"
            aria-label={`خرید فوری ${item.title}`}
          >
            خرید فوری
          </button>
        </div>
      )}

      {/* sold → قیمت فروش + برنده */}
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
  const activeItemId = useLiveStore((s) => s.activeItemId);
  const currentBid = useLiveStore((s) => s.currentBid);
  const timerSec = useLiveStore((s) => s.timerSec);
  const showId = useLiveStore((s) => s.showId);
  const openItem = useAppStore((s) => s.openItem);
  const push = useAppStore((s) => s.push);

  if (!open) return null;

  const sid = showId ?? "sh1";
  const itemsTotal = items.length;
  const pct = itemsTotal > 0 ? Math.min(100, Math.round((soldCount / itemsTotal) * 100)) : 0;

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col bg-ls-bg/97 backdrop-blur-md"
      role="dialog"
      aria-label="Shop این شو"
    >
      {/* هدر */}
      <div className="shrink-0 border-b border-white/5 px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <Gavel className="w-4.5 h-4.5 text-ls-purple-soft" aria-hidden />
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
          {items.map((item) => {
            const isLiveActive = item.id === activeItemId && item.status === "auction";
            return (
              <ShopCard
                key={item.id}
                item={item}
                isLiveActive={isLiveActive}
                liveBid={isLiveActive ? currentBid : item.currentBid ?? item.startPrice}
                liveTimer={isLiveActive ? timerSec : item.timerSec ?? 0}
                onOpen={() => openItem(sid, item.id)}
                onBuyNow={() => push("checkout", item.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
