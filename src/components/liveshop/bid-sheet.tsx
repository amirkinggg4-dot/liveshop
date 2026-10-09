"use client";

import { useState } from "react";
import { Clock, Info, Minus, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { faNum, toman, faClock } from "@/lib/format";
import { useLiveStore } from "@/store/live-store";
import { useWalletStore } from "@/store/wallet-store";
import { useAppStore } from "@/store/app-store";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { GradientCover, Price } from "@/components/liveshop/shared";

/* ═══════════════════════ BidSheet — شیت مزایدهٔ زنده (vaul Drawer) ═══════════════════════
   نکتهٔ mount: این کامپوننت در ProductDock با key={nonce} باز می‌شود تا هر بار
   مقدار اولیهٔ استپر = currentBid + step تازهٔ لحظهٔ باز شدن باشد. */

/** پارس مبلغ از ورودی فارسی/لاتین (حذف جداکننده‌ها) */
function parseAmountInput(s: string): number {
  const en = s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[^\d]/g, "");
  const n = Number(en);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function BidSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const items = useLiveStore((s) => s.items);
  const activeItemId = useLiveStore((s) => s.activeItemId);
  const currentBid = useLiveStore((s) => s.currentBid);
  const timerSec = useLiveStore((s) => s.timerSec);
  const myMaxBidEnabled = useLiveStore((s) => s.myMaxBidEnabled);
  const myMaxBidAmount = useLiveStore((s) => s.myMaxBidAmount);
  const placeMyBid = useLiveStore((s) => s.placeMyBid);
  const setMyMaxBid = useLiveStore((s) => s.setMyMaxBid);
  const balance = useWalletStore((s) => s.balance);
  const push = useAppStore((s) => s.push);

  const item = items.find((i) => i.id === activeItemId) ?? null;
  const step = item?.step ?? 100_000;
  const minBid = currentBid + step;

  const [amount, setAmount] = useState(() => currentBid + step);
  const [maxEnabled, setMaxEnabled] = useState(() =>
    useLiveStore.getState().myMaxBidEnabled
  );
  const [maxAmount, setMaxAmount] = useState(() => {
    const stored = useLiveStore.getState().myMaxBidAmount;
    return stored > 0 ? stored : currentBid + 3 * step;
  });

  const dec = () => setAmount((a) => Math.max(minBid, a - step));
  const inc = () => setAmount((a) => a + step);

  const submit = () => {
    const res = placeMyBid(amount);
    if (res.ok) {
      toast.success("بید تو ثبت شد ✅");
      onOpenChange(false);
    } else {
      toast.error(res.error ?? "ثبت بید ممکن نشد");
    }
  };

  const onMaxToggle = (checked: boolean) => {
    setMaxEnabled(checked);
    setMyMaxBid(checked, maxAmount);
  };

  const onMaxAmountChange = (v: string) => {
    const n = parseAmountInput(v);
    setMaxAmount(n);
    if (maxEnabled && n > 0) setMyMaxBid(true, n);
  };

  const goCharge = () => {
    onOpenChange(false);
    push("wallet");
  };

  const meta = [item?.brand, item?.size ? `سایز ${item.size}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-ls-card border-t border-ls-purple/30 rounded-t-3xl">
        <DrawerHeader className="text-right pb-1">
          <DrawerTitle className="text-base font-extrabold">ثبت بید</DrawerTitle>
          <DrawerDescription className="sr-only">
            ثبت بید در مزایدهٔ زندهٔ این شو
          </DrawerDescription>

          {/* ردیف آیتم */}
          {item && (
            <div className="mt-2 flex items-center gap-2.5 text-right">
              <GradientCover
                cover={item.cover}
                className="w-10 h-10 rounded-xl shrink-0"
                emojiClassName="text-lg"
              />
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white truncate">
                  {item.title}
                </p>
                {meta && (
                  <p className="text-[11px] text-white/50 truncate mt-0.5">{meta}</p>
                )}
              </div>
            </div>
          )}
        </DrawerHeader>

        <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-1 space-y-3 overflow-y-auto scroll-thin">
          {/* بلوک بید فعلی + تایمر */}
          <div className="rounded-xl bg-ls-card-2 p-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] text-white/45">بید فعلی</p>
              <Price
                amount={currentBid}
                className="text-xl text-ls-purple-soft leading-tight"
              />
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-ls-bg/60 px-2.5 py-1 text-xs font-bold tabular-nums",
                timerSec <= 10
                  ? "text-[#FF3B5C] border border-[#FF3B5C]/40 animate-ls-timer-alert"
                  : "text-white/75"
              )}
              aria-label={`زمان باقی‌ماندهٔ مزایده: ${faClock(timerSec)}`}
            >
              <Clock className="w-3.5 h-3.5" aria-hidden />
              {faClock(timerSec)}
            </span>
          </div>

          {/* استپر بید */}
          <div className="rounded-xl border border-ls-purple/25 bg-ls-bg/50 p-3">
            <div className="flex items-center gap-3">
              <button
                onClick={dec}
                aria-label="کاهش مبلغ بید"
                className="w-11 h-11 shrink-0 rounded-full bg-ls-card-2 border border-white/10 flex items-center justify-center text-white/85 hover:bg-ls-line active:scale-95 transition-all"
              >
                <Minus className="w-5 h-5" aria-hidden />
              </button>
              <div className="flex-1 text-center min-w-0">
                <p
                  className="text-2xl font-black text-ls-purple-soft tabular-nums leading-tight"
                  aria-live="polite"
                  aria-label={`مبلغ بید: ${toman(amount)}`}
                >
                  {faNum(amount)}
                </p>
                <p className="text-[10px] text-white/45">تومان</p>
              </div>
              <button
                onClick={inc}
                aria-label="افزایش مبلغ بید"
                className="w-11 h-11 shrink-0 rounded-full bg-ls-purple/25 border border-ls-purple/50 flex items-center justify-center text-ls-purple-soft hover:bg-ls-purple/40 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-white/45">
              پلهٔ مزایده: {toman(step)}
            </p>
          </div>

          {/* Max Bid — بید خودکار */}
          <div className="rounded-xl border border-white/10 bg-ls-card-2/60 p-3">
            <div className="flex items-center gap-2.5">
              <Switch
                checked={maxEnabled}
                onCheckedChange={onMaxToggle}
                aria-label="فعال‌سازی بید خودکار Max Bid"
                className="data-[state=checked]:bg-ls-purple"
              />
              <span className="text-sm font-bold text-white/90">
                Max Bid (بید خودکار)
              </span>
              <span
                title="تا سقفی که تعیین می‌کنی، خودکار در رقابت می‌مانی"
                aria-label="راهنمای Max Bid"
                className="ms-auto text-white/40 cursor-help"
              >
                <Info className="w-4 h-4" aria-hidden />
              </span>
            </div>

            {maxEnabled && (
              <div className="mt-3 space-y-1.5">
                <Input
                  inputMode="numeric"
                  value={maxAmount > 0 ? faNum(maxAmount) : ""}
                  onChange={(e) => onMaxAmountChange(e.target.value)}
                  placeholder="سقف بید تو (تومان)"
                  aria-label="سقف بید خودکار به تومان"
                  className="h-10 rounded-xl bg-ls-bg/60 border-white/10 text-sm tabular-nums"
                />
                <p className="text-[11px] leading-5 text-white/50">
                  تا این سقف، در رقابت فقط یک پله جلوتر به‌صورت خودکار بید
                  می‌گذاریم — حتی اگر آفلاین باشی.
                </p>
              </div>
            )}
          </div>

          {/* هشدار ضدکلاهبرداری زمانی */}
          <div className="rounded-xl border border-ls-pink/30 bg-ls-pink/10 px-3 py-2.5 text-xs leading-5 text-ls-pink/90 font-medium">
            ⚠️ اگر در ۱۰ ثانیهٔ آخر بیدی ثبت شود، تایمر ۱۰ ثانیه تمدید می‌شود —
            شانس برابر برای همه
          </div>

          {/* ردیف کیف پول */}
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-ls-bg/60 px-3 py-2.5">
            <Wallet className="w-4 h-4 shrink-0 text-ls-green" aria-hidden />
            <span className="text-xs text-white/70">
              موجودی:{" "}
              <span className="font-extrabold text-white/90 tabular-nums">
                {toman(balance)}
              </span>
            </span>
            <button
              onClick={goCharge}
              className="ms-auto shrink-0 text-xs font-bold text-ls-purple-soft hover:underline"
              aria-label="شارژ کیف پول"
            >
              شارژ کیف پول
            </button>
          </div>

          {/* دکمهٔ ثبت بید */}
          <button
            onClick={submit}
            className="w-full rounded-xl bg-ls-purple py-3 text-sm font-extrabold text-white shadow-[0_0_16px_rgba(108,92,255,.4)] hover:bg-ls-purple-deep active:scale-[.99] transition-all"
            aria-label={`ثبت بید به مبلغ ${toman(amount)}`}
          >
            ثبت بید — {toman(amount)}
          </button>

          <p className="text-center text-[10px] text-white/35">
            با ثبت بید در ثانیه‌های آخر، تایمر تمدید می‌شود و در رقابت می‌مانی 🔥
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
