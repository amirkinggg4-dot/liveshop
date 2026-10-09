"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, MapPin, Star, Wallet as WalletIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toFa, toman } from "@/lib/format";
import { DEFAULT_ADDRESS } from "@/lib/data/orders";
import { getSeller } from "@/lib/data/shows";
import { useAppStore } from "@/store/app-store";
import { useOrdersStore } from "@/store/orders-store";
import { useLiveStore, type PendingWin } from "@/store/live-store";
import Confetti from "@/components/liveshop/confetti";
import {
  GradientCover,
  Avatar,
  Price,
  PageHeader,
  EmptyState,
} from "@/components/liveshop/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ─────────────────────────────────────────────────────────────
   صفحهٔ برد — فاز ۱
   پس از برد مزایده، موتور (live-store) خودکار از کیف پول کسر
   می‌کند، سفارش می‌سازد و pendingWin ست می‌کند؛ این نما رسید
   برد را با کانفتی، تفکیک قیمت، آدرس و تایم‌لاین ۳ مرحله‌ای
   نشان می‌دهد. با unmount هم pendingWin پاک می‌شود.
   ───────────────────────────────────────────────────────────── */

export default function WinView() {
  const back = useAppStore((s) => s.back);
  const openShow = useAppStore((s) => s.openShow);
  const pendingWin = useLiveStore((s) => s.pendingWin);
  const clearPendingWin = useLiveStore((s) => s.clearPendingWin);

  /* با خروج از نما، بردِ نمایش‌داده‌شده پاک می‌شود */
  useEffect(
    () => () => {
      clearPendingWin();
    },
    [clearPendingWin]
  );

  if (!pendingWin) {
    return (
      <div className="flex-1 flex flex-col" aria-label="سفارش شما">
        <PageHeader title="سفارش شما" onBack={back} />
        <EmptyState
          emoji="🏆"
          title="هنوز چیزی نبردی!"
          desc="وقتی در مزایدهٔ زنده برنده شوی، سفارشت اینجا ساخته می‌شود"
          action={
            <button
              onClick={() => openShow("sh1")}
              className="h-11 rounded-xl bg-ls-purple px-6 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(108,92,255,.35)] transition-transform active:scale-[.98]"
              aria-label="رفتن به شوهای زنده"
            >
              رفتن به شوهای زنده
            </button>
          }
        />
      </div>
    );
  }

  return <WinContent key={pendingWin.itemId} pendingWin={pendingWin} />;
}

/* ── محتوای صفحهٔ برد — فقط وقتی pendingWin وجود دارد ── */
function WinContent({ pendingWin }: { pendingWin: PendingWin }) {
  const back = useAppStore((s) => s.back);
  const openOrder = useAppStore((s) => s.openOrder);
  const orders = useOrdersStore((s) => s.orders);
  const setRated = useOrdersStore((s) => s.setRated);

  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(5);

  /* سفارشِ تازه‌ساخته‌شده توسط موتور، اولین سفارش فهرست است */
  const order = orders[0];

  /* فروشندهٔ شو بر اساس showId (sh1→s1, sh2→s2, sh3→s3) */
  const sellerId =
    pendingWin.showId === "sh1"
      ? "s1"
      : pendingWin.showId === "sh2"
        ? "s2"
        : "s3";
  const seller = getSeller(sellerId);

  const total = pendingWin.itemPrice + pendingWin.shippingPrice;

  const timeline: Array<{ label: string; done: boolean; note?: string }> = [
    { label: "پرداخت شد", done: true, note: "همین حالا" },
    { label: "در حال آماده‌سازی", done: false, note: "تا ۲ روز کاری" },
    {
      label: "ارسال شد",
      done: false,
      note: "کد رهگیری اینجا نمایش داده می‌شود",
    },
  ];

  return (
    <div
      className="flex-1 flex flex-col"
      aria-label={`سفارش شما — برد مزایده (${toman(total)})`}
    >
      {/* ── کانفتی جشن برد ── */}
      <Confetti />

      <PageHeader title="سفارش شما" onBack={back} />

      <div className="px-4 py-4 space-y-4">
        {/* ── هیرو برد ── */}
        <div className="flex flex-col items-center gap-1.5 pb-1 pt-3 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full bg-ls-green shadow-[0_0_36px_rgba(0,200,150,.5)]"
            aria-hidden
          >
            <Check className="h-8 w-8 text-white" strokeWidth={3} />
          </span>
          <h2 className="mt-2 text-2xl font-black">شما برنده شدید! 🎉</h2>
          <p className="text-sm text-white/60">
            پرداخت خودکار از کیف پول انجام شد
          </p>
        </div>

        {/* ── کارت آیتم ── */}
        <div className="space-y-2.5 rounded-2xl bg-ls-card border border-white/5 p-3">
          <div className="flex items-center gap-3">
            <GradientCover
              cover={
                order?.cover ?? { from: "#6C5CFF", to: "#FF3B8B", emoji: "🏆" }
              }
              className="w-16 h-16 shrink-0 rounded-xl"
              emojiClassName="text-2xl"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {order?.itemTitle ?? "آیتم برندهٔ مزایده"}
              </p>
              {order?.itemBrand && (
                <p className="mt-0.5 truncate text-xs text-white/50">
                  {order.itemBrand}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-white/5 pt-2.5">
            <Avatar emoji={seller.emoji} color={seller.color} size="sm" />
            <p className="text-xs text-white/60">
              فروشنده:{" "}
              <span className="font-bold text-white/85">{seller.name}</span>
              {seller.verified && (
                <span
                  className="mr-1 text-ls-purple-soft"
                  title="فروشندهٔ تأییدشده"
                >
                  ✓
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── کارت تفکیک قیمت ── */}
        <div className="space-y-2.5 rounded-2xl bg-ls-card border border-white/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">قیمت کالا (بید برنده)</span>
            <Price amount={pendingWin.itemPrice} className="text-sm text-white/85" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">هزینهٔ ارسال — تیپاکس</span>
            <Price
              amount={pendingWin.shippingPrice}
              className="text-sm text-white/85"
            />
          </div>
          <div className="my-1 border-t border-dashed border-white/10" role="separator" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold">مجموع پرداخت‌شده</span>
            <Price amount={total} className="text-xl text-ls-purple" />
          </div>
          <p className="flex items-center gap-1.5 pt-1 text-[11px] text-ls-green/90">
            <WalletIcon className="h-3.5 w-3.5" aria-hidden />
            کسر شده از موجودی کیف پول
          </p>
        </div>

        {/* ── کارت آدرس ── */}
        <div className="space-y-2 rounded-2xl bg-ls-card border border-white/5 p-4">
          <div className="flex items-center gap-1.5">
            <p className="flex flex-1 items-center gap-1.5 text-sm font-extrabold">
              <MapPin className="h-4 w-4 text-ls-purple-soft" aria-hidden />
              آدرس تحویل
            </p>
            <button
              onClick={() => toast("ویرایش آدرس (دمو)")}
              className="rounded-lg px-2 py-1 text-xs font-bold text-ls-purple-soft transition-colors hover:bg-ls-purple/10"
              aria-label="ویرایش آدرس تحویل"
            >
              ویرایش
            </button>
          </div>
          <p className="whitespace-pre-line text-xs leading-6 text-white/70">
            {DEFAULT_ADDRESS}
          </p>
        </div>

        {/* ── تایم‌لاین ۳ مرحله‌ای ── */}
        <div className="rounded-2xl bg-ls-card border border-white/5 p-4">
          <h2 className="mb-4 text-sm font-extrabold">وضعیت سفارش</h2>
          <ol aria-label="تایم‌لاین سفارش برد مزایده">
            {timeline.map((st, i) => (
              <li key={st.label} className="flex gap-3">
                {/* ستون دایره + خط اتصال عمودی */}
                <div className="flex flex-col items-center">
                  {st.done ? (
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ls-green shadow-[0_0_12px_rgba(0,200,150,.4)]"
                      aria-hidden
                    >
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      className="h-6 w-6 shrink-0 rounded-full border-2 border-dashed border-white/25"
                      aria-hidden
                    />
                  )}
                  {i < timeline.length - 1 && (
                    <span
                      className="min-h-6 flex-1 border-r border-white/10"
                      aria-hidden
                    />
                  )}
                </div>
                <div className={cn("pb-5", i === timeline.length - 1 && "pb-1")}>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      !st.done && "text-white/50"
                    )}
                  >
                    {st.label}
                  </p>
                  {st.note && (
                    <p className="mt-0.5 text-[11px] text-white/45">{st.note}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ── نوار اکشن چسبان ── */}
      <div className="sticky bottom-0 z-20 mt-auto border-t border-white/5 bg-ls-bg/90 p-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (order) openOrder(order.id);
            }}
            className="h-11 flex-1 rounded-xl bg-ls-purple text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(108,92,255,.35)] transition-transform active:scale-[.98]"
            aria-label="پیگیری سفارش برد مزایده"
          >
            پیگیری سفارش
          </button>
          <button
            onClick={() => setRateOpen(true)}
            className="h-11 shrink-0 rounded-xl border border-white/15 px-4 text-sm font-bold text-white/80 transition-colors hover:bg-white/5"
            aria-label={`امتیاز به فروشنده ${seller.name}`}
          >
            امتیاز به فروشنده
          </button>
        </div>
      </div>

      {/* ── دیالوگ امتیازدهی به فروشنده ── */}
      <Dialog open={rateOpen} onOpenChange={setRateOpen}>
        <DialogContent
          className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm"
          aria-label="امتیاز به فروشنده"
        >
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle>امتیاز به فروشنده</DialogTitle>
            <DialogDescription className="text-xs leading-6">
              تجربهٔ خریدت از {seller.name} چطور بود؟
            </DialogDescription>
          </DialogHeader>

          <div
            role="radiogroup"
            aria-label="امتیاز از ۵ ستاره"
            className="flex items-center justify-center gap-1.5 py-2"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                role="radio"
                aria-checked={rating === i}
                aria-label={`${toFa(i)} ستاره`}
                onClick={() => setRating(i)}
                className="p-1 transition-transform hover:scale-110 active:scale-90"
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    i <= rating
                      ? "fill-amber-300 text-amber-300"
                      : "text-white/30"
                  )}
                  aria-hidden
                />
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (order) setRated(order.id);
              toast.success("امتیاز تو ثبت شد ⭐");
              setRateOpen(false);
            }}
            className="h-11 w-full rounded-xl bg-ls-purple text-sm font-extrabold text-white transition-transform active:scale-[.98]"
            aria-label={`ثبت امتیاز ${toFa(rating)} ستاره`}
          >
            ثبت امتیاز
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
