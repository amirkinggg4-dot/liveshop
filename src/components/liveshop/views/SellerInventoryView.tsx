"use client";

import { useMemo, useState } from "react";
import { Lock, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";
import { useSellerStore } from "@/store/seller-store";
import { INVENTORY_EXTRAS } from "@/lib/data/seller";
import { cn } from "@/lib/utils";
import { faNum, toFa } from "@/lib/format";
import { ITEMS_SH1 } from "@/lib/data/items";
import { getShow } from "@/lib/data/shows";
import type { ShopItem } from "@/lib/data/types";
import {
  PageHeader,
  GradientCover,
  Price,
  StatusChip,
  Chip,
  EmptyState,
} from "@/components/liveshop/shared";
import { AUCTION_ENABLED } from "@/lib/config";

function priceOf(item: ShopItem): number {
  return AUCTION_ENABLED
    ? item.currentBid ?? item.buyNowPrice ?? item.soldPrice ?? item.startPrice
    : item.price;
}

/* v1.4 — فیلترهای حالت قیمت ثابت */
type FixedFilter = "available" | "inshow" | "soldout" | "draft";

function isAvailable(item: ShopItem): boolean {
  return item.status !== "sold" && item.stock > 0 && item.status !== "up_next" && item.status !== "auction";
}
function isInShow(item: ShopItem): boolean {
  return item.status === "up_next" || item.status === "auction";
}
function isSoldOut(item: ShopItem): boolean {
  return item.status === "sold" || item.stock <= 0;
}

export default function SellerInventoryView() {
  const back = useAppStore((s) => s.back);
  const push = useAppStore((s) => s.push);
  const [query, setQuery] = useState("");

  /* فاز ۲ — فیلتر وضعیت انبار + پیش‌نویس‌های فروشنده
     v1.4 — در حالت قیمت ثابت: موجود / تمام‌شده / در شو / پیش‌نویس */
  const [filter, setFilter] = useState<
    "all" | "auction" | "up_next" | "buy_now" | "sold" | "draft" | FixedFilter
  >(AUCTION_ENABLED ? "all" : "available");
  const drafts = useSellerStore((s) => s.drafts);

  const total = getShow("sh1").itemsTotal;
  const q = query.trim().toLowerCase();

  const items = useMemo(
    () =>
      q ? ITEMS_SH1.filter((i) => i.title.toLowerCase().includes(q)) : ITEMS_SH1,
    [q]
  );

  /* فاز ۲ — منبع نهایی لیست بر اساس فیلتر وضعیت (پیش‌نویس‌ها جدا رندر می‌شوند) */
  const visible =
    filter === "all"
      ? items
      : filter === "available"
        ? items.filter(isAvailable)
        : filter === "inshow"
          ? items.filter(isInShow)
          : filter === "soldout"
            ? items.filter(isSoldOut)
            : filter === "draft"
              ? items
              : items.filter((i) => i.status === filter);

  const activeCount = ITEMS_SH1.filter((i) => !isSoldOut(i)).length;
  const inShowCount = ITEMS_SH1.filter(isInShow).length;
  const availableCount = ITEMS_SH1.filter(isAvailable).length;
  const soldOutCount = ITEMS_SH1.filter(isSoldOut).length;
  const auctionCount = ITEMS_SH1.filter((i) => i.status === "auction").length;
  const soldCount = ITEMS_SH1.filter((i) => i.status === "sold").length;

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="انبار کالا"
        subtitle={`${faNum(total)} آیتم`}
        onBack={back}
      />

      <div className="px-4 pt-4 pb-4 space-y-4">
        {/* چیپ‌های شمارش وضعیت — v1.4: موجود / در شو / تمام‌شده */}
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar"
          aria-label="خلاصهٔ وضعیت آیتم‌ها"
        >
          <Chip className="shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-ls-green" aria-hidden />
            موجود {faNum(availableCount)}
          </Chip>
          <Chip className="shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-ls-purple" aria-hidden />
            در شو {faNum(inShowCount)}
          </Chip>
          <Chip className="shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" aria-hidden />
            تمام‌شده {faNum(soldOutCount)}
          </Chip>
        </div>

        {/* فیلتر وضعیت — v1.4: در حالت قیمت ثابت «موجود/تمام‌شده/در شو/پیش‌نویس» */}
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar"
          aria-label="فیلتر وضعیت انبار"
        >
          {(AUCTION_ENABLED
            ? [
                { key: "all", label: "همه" },
                { key: "auction", label: "در مزایده" },
                { key: "up_next", label: "آیتم بعدی" },
                { key: "buy_now", label: "خرید فوری" },
                { key: "sold", label: "فروخته" },
                { key: "draft", label: `پیش‌نویس (${faNum(drafts.length)})` },
              ]
            : [
                { key: "available", label: "موجود" },
                { key: "inshow", label: "در شو" },
                { key: "soldout", label: "تمام‌شده" },
                { key: "draft", label: `پیش‌نویس (${faNum(drafts.length)})` },
                { key: "all", label: "همه" },
              ]
          ).map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key as typeof filter)}
              aria-pressed={filter === c.key}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                filter === c.key
                  ? "bg-ls-purple text-white"
                  : "bg-ls-card-2 text-white/60 hover:text-white"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* جستجو */}
        <div className="relative">
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی آیتم…"
            aria-label="جستجوی آیتم در انبار"
            className="pr-9 bg-ls-card border-white/10 rounded-xl h-10 text-sm placeholder:text-white/35"
          />
        </div>

        {/* لیست آیتم‌ها — فاز ۲: فیلتر پیش‌نویس، ردیف‌های پیش‌نویس جدا */}
        {filter === "draft" ? (
          drafts.length > 0 ? (
            <div
              className="space-y-2.5 max-h-96 overflow-y-auto scroll-thin pl-1"
              aria-label="لیست پیش‌نویس‌های انبار"
            >
              {drafts.map((d) => (
                <div
                  key={d.id}
                  className="w-full flex items-center gap-3 bg-ls-card border border-white/5 rounded-2xl p-3 text-right"
                >
                  <GradientCover
                    cover={d.cover}
                    className="w-12 h-12 rounded-xl shrink-0"
                    emojiClassName="text-xl"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-sm truncate">
                      {d.title}
                    </span>
                    <span className="block text-[11px] text-white/45 truncate mt-0.5">
                      {d.brand}
                    </span>
                    <span className="block text-[10px] text-amber-300 mt-1">
                      ناقص: {d.missing.join("، ")}
                    </span>
                  </span>
                  <button
                    onClick={() => push("sellerListing")}
                    aria-label={`تکمیل لیستینگ ${d.title}`}
                    className="shrink-0 rounded-xl border border-ls-pink/50 text-ls-pink px-3 py-2 text-[11px] font-bold hover:bg-ls-pink/10 active:scale-[.98] transition-all"
                  >
                    تکمیل لیستینگ
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="📝"
              title="پیش‌نویسی نداری"
              desc="با دکمهٔ «آیتم جدید» لیستینگ را شروع کن."
            />
          )
        ) : visible.length > 0 ? (
          <div
            className="space-y-2.5 max-h-96 overflow-y-auto scroll-thin pl-1"
            aria-label="لیست آیتم‌های انبار"
          >
            {visible.map((item) => {
              /* فاز ۲ — وزن آیتم از INVENTORY_EXTRAS */
              const extra = INVENTORY_EXTRAS[item.sku];
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    /* فاز ۲ — آیتم در شو فعال: ویرایش قفل است (v1.4: مزایده یا در صف شو) */
                    if (item.status === "auction" || item.status === "up_next") {
                      toast("آیتم در شو فعال است — ویرایش قفل است 🔒");
                      return;
                    }
                    toast("جزئیات آیتم (دمو)");
                  }}
                  aria-label={`جزئیات آیتم ${item.title}`}
                  className="w-full flex items-center gap-3 bg-ls-card border border-white/5 rounded-2xl p-3 text-right hover:border-ls-purple/40 transition-colors active:scale-[.99]"
                >
                  <GradientCover
                    cover={item.cover}
                    className="w-12 h-12 rounded-xl shrink-0"
                    emojiClassName="text-xl"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-sm truncate">
                      {item.title}
                    </span>
                    <span className="block text-[11px] text-white/45 truncate mt-0.5">
                      {item.brand}
                      {item.size ? ` • سایز ${item.size}` : ""} • {toFa(item.sku)}
                      {" • "}
                      <span className={cn(item.stock <= 0 && "text-white/35")}>
                        {item.stock <= 0 ? "تمام شد" : `موجود ${faNum(item.stock)}`}
                      </span>
                    </span>
                    {/* فاز ۲ — قفل ویرایش + وزن */}
                    {(item.status === "auction" || item.status === "up_next" || extra) && (
                      <span className="flex items-center gap-2 mt-1">
                        {(item.status === "auction" || item.status === "up_next") && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-300">
                            <Lock className="w-3 h-3" aria-hidden /> قفل ویرایش — در شو فعال
                          </span>
                        )}
                        {extra && (
                          <span className="text-[10px] text-white/40">
                            وزن: {faNum(extra.weightGrams)} گرم
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 flex flex-col items-center gap-1">
                    <Price amount={priceOf(item)} className="text-sm" />
                    <StatusChip status={item.status} />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            emoji="📦"
            title="آیتمی پیدا نشد"
            desc="عبارت جستجو را تغییر بده یا آیتم جدیدی اضافه کن."
          />
        )}

        {/* دکمهٔ شناور آیتم جدید */}
        <div className="sticky bottom-24 z-20">
          <button
            onClick={() => push("sellerListing")}
            aria-label="افزودن آیتم جدید"
            className="w-full bg-ls-purple text-white font-extrabold rounded-full py-3.5 shadow-lg shadow-ls-purple/40 flex items-center justify-center gap-2 hover:bg-ls-purple-deep transition-colors active:scale-[.99]"
          >
            <Plus className="w-5 h-5" aria-hidden />
            آیتم جدید
          </button>
        </div>
      </div>
    </div>
  );
}
