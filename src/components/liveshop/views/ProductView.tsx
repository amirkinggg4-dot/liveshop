"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Gavel, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { faClock, toman, toFa } from "@/lib/format";
import { getItem, getShowItems } from "@/lib/data/items";
import { getShippingMethod } from "@/lib/data/orders";
import { getSeller, getShow } from "@/lib/data/shows";
import { useAppStore } from "@/store/app-store";
import {
  GradientCover,
  Avatar,
  StatusChip,
  RatingStars,
  Chip,
  Price,
  PageHeader,
} from "@/components/liveshop/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProductView() {
  const currentItemId = useAppStore((s) => s.currentItemId);
  const currentShowId = useAppStore((s) => s.currentShowId);
  const back = useAppStore((s) => s.back);
  const push = useAppStore((s) => s.push);
  const openShow = useAppStore((s) => s.openShow);

  const item =
    (currentItemId ? getItem(currentItemId) : undefined) ??
    getShowItems(currentShowId ?? "sh1")[0];

  const seller = getSeller(getShow(item.showId).sellerId);

  /* ── تایمر نمایشی مزایده (baseline — فاز ۱ موتور واقعی) ── */
  const [bidOpen, setBidOpen] = useState(false);

  const currentBid = item.currentBid ?? item.startPrice;

  return (
    <div className="flex-1 flex flex-col" aria-label="جزئیات محصول">
      <PageHeader title="جزئیات محصول" onBack={back} />

      {/* ── کاور ── */}
      <GradientCover
        cover={item.cover}
        className="h-56 rounded-b-3xl"
        emojiClassName="text-7xl"
      >
        <div className="absolute top-3 right-3">
          <StatusChip status={item.status} />
        </div>
      </GradientCover>

      {/* ── بدنه ── */}
      <div className="px-4 py-4 space-y-4">
        <h1 className="text-xl font-black leading-8">{item.title}</h1>

        {/* چیپ‌های مشخصات */}
        <div className="flex flex-wrap items-center gap-2">
          <Chip>برند: {item.brand}</Chip>
          {item.size && <Chip>سایز {toFa(item.size)}</Chip>}
          <Chip>{item.condition}</Chip>
        </div>

        {/* ردیف فروشنده */}
        <div className="flex items-center gap-3 rounded-2xl bg-ls-card border border-white/5 p-3">
          <Avatar emoji={seller.emoji} color={seller.color} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold flex items-center gap-1">
              <span className="truncate">{seller.name}</span>
              {seller.verified && (
                <span className="text-ls-purple-soft shrink-0" title="فروشندهٔ تأییدشده">
                  ✓
                </span>
              )}
            </p>
            <RatingStars rating={seller.rating} count={seller.ratingsCount} className="mt-0.5" />
          </div>
          <button
            onClick={() => openShow(item.showId)}
            className="shrink-0 rounded-full border border-ls-purple/50 px-3 py-1.5 text-xs font-bold text-ls-purple-soft hover:bg-ls-purple/10 transition-colors"
            aria-label={`ورود به شو ${seller.name}`}
          >
            ورود به شو
          </button>
        </div>

        {/* کارت قیمت */}
        <div className="rounded-2xl bg-ls-card border border-white/5 p-4 space-y-2.5">
          {item.status === "auction" && (
            <>
              <p className="text-xs text-white/50 flex items-center gap-1.5">
                <Gavel className="w-3.5 h-3.5" aria-hidden />
                بید فعلی
              </p>
              <Price amount={currentBid} className="text-2xl text-ls-purple" />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center rounded-full bg-ls-card-2 px-2.5 py-1 text-[11px] text-white/70">
                  پلهٔ مزایده: {toman(item.step)}
                </span>
                <AuctionTimer key={item.id} total={item.timerSec ?? 0} />
              </div>
            </>
          )}

          {item.status === "buy_now" && (
            <>
              <p className="text-xs text-white/50">قیمت ثابت</p>
              <Price
                amount={item.buyNowPrice ?? item.startPrice}
                className="text-2xl text-ls-green"
              />
            </>
          )}

          {item.status === "sold" && (
            <>
              <p className="text-xs text-white/50">
                فروخته شد به <span className="text-white/75 font-bold">{item.soldTo}</span>
              </p>
              <Price
                amount={item.soldPrice ?? item.startPrice}
                className="text-2xl text-white/60"
              />
            </>
          )}

          {item.status === "up_next" && (
            <>
              <p className="text-xs text-white/50">آیتم بعدی شو — هنوز به مزایده نرسیده</p>
              {item.buyNowPrice != null && (
                <Price amount={item.buyNowPrice} className="text-2xl text-white/85" />
              )}
            </>
          )}
        </div>

        {/* توضیحات */}
        <div className="space-y-1.5">
          <h2 className="text-sm font-extrabold">توضیحات</h2>
          <p className="text-sm text-white/70 leading-7">{item.description}</p>
        </div>

        {/* ردیف ارسال */}
        <div className="flex items-center gap-3 rounded-2xl bg-ls-card border border-white/5 p-3.5">
          <span className="w-9 h-9 shrink-0 rounded-xl bg-ls-purple/15 flex items-center justify-center">
            <Truck className="w-4 h-4 text-ls-purple-soft" aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">
              ارسال با {getShippingMethod("tipax").label}
            </p>
            <p className="text-[11px] text-white/45 leading-5 mt-0.5">
              هزینهٔ ارسال جدا از قیمت کالا محاسبه می‌شود
            </p>
          </div>
          <Price amount={item.shippingPrice} className="text-xs text-white/80 shrink-0" />
        </div>
      </div>

      {/* ── نوار اکشن چسبان ── */}
      <div className="sticky bottom-0 z-20 mt-auto bg-ls-bg/90 backdrop-blur border-t border-white/5 p-3">
        {item.status === "auction" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBidOpen(true)}
              className="flex-1 h-12 rounded-xl bg-ls-purple text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(108,92,255,.35)] transition-transform active:scale-[.98]"
              aria-label={`ثبت بید به مبلغ ${toman(currentBid + item.step)}`}
            >
              ثبت بید — {toman(currentBid + item.step)}
            </button>
            {item.buyNowPrice != null && (
              <button
                onClick={() => push("checkout", item.id)}
                className="h-12 shrink-0 rounded-xl border border-ls-green/60 px-4 text-sm font-extrabold text-ls-green hover:bg-ls-green/10 transition-colors"
                aria-label={`خرید فوری به مبلغ ${toman(item.buyNowPrice)}`}
              >
                خرید فوری
              </button>
            )}
          </div>
        )}

        {item.status === "buy_now" && (
          <button
            onClick={() => push("checkout", item.id)}
            className="w-full h-12 rounded-xl bg-ls-green text-sm font-black text-[#04281e] shadow-[0_8px_24px_rgba(0,200,150,.3)] transition-transform active:scale-[.98]"
            aria-label={`خرید فوری به مبلغ ${toman(item.buyNowPrice ?? item.startPrice)}`}
          >
            خرید فوری — {toman(item.buyNowPrice ?? item.startPrice)}
          </button>
        )}

        {item.status === "sold" && (
          <button
            disabled
            className="w-full h-12 rounded-xl bg-white/10 text-sm font-extrabold text-white/40 cursor-not-allowed"
          >
            این آیتم فروخته شد
          </button>
        )}

        {item.status === "up_next" && (
          <button
            onClick={() => toast("یادآوری فعال شد 🔔")}
            className="w-full h-12 rounded-xl border border-ls-pink/60 text-sm font-extrabold text-ls-pink hover:bg-ls-pink/10 transition-colors"
            aria-label="فعال‌سازی یادآوری برای آیتم بعدی"
          >
            یادآوری
          </button>
        )}
      </div>

      {/* ── دیالوگ تأیید بید (baseline) ── */}
      <Dialog open={bidOpen} onOpenChange={setBidOpen}>
        <DialogContent
          className="bg-ls-card border-white/10 rounded-2xl sm:max-w-sm"
          aria-label="تأیید ثبت بید"
        >
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle>تأیید ثبت بید</DialogTitle>
            <DialogDescription className="text-xs leading-6">
              مبلغ <span className="font-bold text-white/85">{toman(currentBid + item.step)}</span> برای
              «{item.title}» ثبت شود؟
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBidOpen(false);
                toast.success("بید تو ثبت شد ✅");
              }}
              className="flex-1 h-11 rounded-xl bg-ls-purple text-sm font-extrabold text-white transition-transform active:scale-[.98]"
            >
              تأیید و ثبت بید
            </button>
            <button
              onClick={() => setBidOpen(false)}
              className="h-11 rounded-xl border border-white/15 px-4 text-sm font-bold text-white/70 hover:bg-white/5 transition-colors"
            >
              انصراف
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── چیپ تایمر نمایشی مزایده — قرمز و پالس زیر ۳۰ ثانیه ── */
function AuctionTimer({ total }: { total: number }) {
  const [sec, setSec] = useState(total);

  useEffect(() => {
    if (total <= 0) return;
    const t = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [total]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums",
        sec < 30
          ? "border border-[#FF3B5C]/40 bg-[#FF3B5C]/10 text-[#FF3B5C] animate-ls-timer-alert"
          : "bg-ls-card-2 text-white/70"
      )}
      aria-label={`زمان باقی‌ماندهٔ مزایده: ${faClock(sec)}`}
    >
      <Clock className="h-3.5 w-3.5" aria-hidden />
      {faClock(sec)}
    </span>
  );
}
