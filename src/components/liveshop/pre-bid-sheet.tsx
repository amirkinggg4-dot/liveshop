"use client";

import { useState } from "react";
import { Info, Users, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { faNum, toman } from "@/lib/format";
import type { Show } from "@/lib/data/types";
import { usePrebidStore, PREBID_ITEMS } from "@/store/prebid-store";
import { useWalletStore } from "@/store/wallet-store";
import { useAppStore } from "@/store/app-store";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { GradientCover, Price } from "@/components/liveshop/shared";

/* ═══════════ PreBidSheet — پیش‌بید شوهای آینده (vaul Drawer) ═══════════ */

/** پارس مبلغ از ورودی فارسی/لاتین (کپی محلی الگوی bid-sheet) */
function parseAmountInput(s: string): number {
  const en = s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[^\d]/g, "");
  const n = Number(en);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function PreBidSheet({
  show,
  open,
  onOpenChange,
}: {
  show: Show;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const myPrebids = usePrebidStore((s) => s.myPrebids);
  const placePrebid = usePrebidStore((s) => s.placePrebid);
  const cancelPrebid = usePrebidStore((s) => s.cancelPrebid);
  const balance = useWalletStore((s) => s.balance);
  const push = useAppStore((s) => s.push);

  /* پیش‌نویس مبلغ هر آیتم */
  const [drafts, setDrafts] = useState<Record<string, number>>({});

  const setDraft = (itemId: string, n: number) =>
    setDrafts((p) => ({ ...p, [itemId]: n }));

  const handleOpenChange = (v: boolean) => {
    if (!v) setDrafts({});
    onOpenChange(v);
  };

  const goCharge = () => {
    handleOpenChange(false);
    push("wallet");
  };

  const submit = (itemId: string, itemTitle: string) => {
    const amount = drafts[itemId] ?? 0;
    if (!amount) {
      toast.error("مبلغ پیش‌بید را وارد کن");
      return;
    }
    const res = placePrebid(itemId, amount);
    if (res.ok) {
      toast.success("پیش‌بید ثبت شد ✅ — لحظهٔ شروع خودکار می‌رود");
      setDrafts((p) => {
        const n = { ...p };
        delete n[itemId];
        return n;
      });
    } else {
      toast.error(res.error ?? `ثبت پیش‌بید برای «${itemTitle}» ممکن نشد`);
    }
  };

  const cancel = (itemId: string) => {
    cancelPrebid(itemId);
    toast("پیش‌بید لغو شد");
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="bg-ls-card border-t border-ls-purple/30 rounded-t-3xl max-h-[85vh]">
        <DrawerHeader className="text-right pb-1">
          <DrawerTitle className="text-base font-extrabold">
            پیش‌بید — قبل از شروع شو
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            ثبت پیش‌بید روی آیتم‌های شوی که هنوز شروع نشده
          </DrawerDescription>

          {/* بنر شو */}
          <div
            className="mt-2 flex items-center gap-2.5 rounded-xl border border-white/10 bg-ls-bg/60 p-3 text-right"
            aria-label={`شو: ${show.title} — شروع ${show.startsAtLabel ?? "به‌زودی"}`}
          >
            <GradientCover
              cover={show.cover}
              className="w-11 h-11 rounded-xl shrink-0"
              emojiClassName="text-lg"
            />
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-white truncate">
                {show.title}
              </p>
              <p className="text-[11px] text-white/55 mt-0.5">
                🕒 شروع: {show.startsAtLabel ?? "به‌زودی"}
              </p>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-1 space-y-3 overflow-y-auto scroll-thin">
          {/* توضیح مکانیزم */}
          <div className="rounded-xl border border-ls-purple/30 bg-ls-purple/10 px-3 py-2.5 flex items-start gap-2">
            <span
              className="shrink-0 mt-0.5 text-ls-purple-soft"
              title="راهنمای پیش‌بید"
              aria-label="راهنمای پیش‌بید"
            >
              <Info className="w-4 h-4" aria-hidden />
            </span>
            <p className="text-[11px] leading-5 text-white/75">
              پیش‌بیدت لحظهٔ شروع شو به‌صورت خودکار ثبت می‌شود — مثل Max Bid عمل
              می‌کند
            </p>
          </div>

          {/* آیتم‌های قابل پیش‌بید */}
          {PREBID_ITEMS.map((item) => {
            const my = myPrebids[item.id];
            const draft = drafts[item.id] ?? 0;
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-ls-card border border-white/5 p-3.5 space-y-3"
                aria-label={`آیتم پیش‌بید: ${item.title}`}
              >
                <div className="flex items-center gap-3">
                  <GradientCover
                    cover={item.cover}
                    className="w-12 h-12 rounded-xl shrink-0"
                    emojiClassName="text-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-white truncate leading-5">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-white/50 truncate">
                      {item.brand}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2.5 text-[10px] text-white/55">
                      <span className="flex items-center gap-1">
                        <Price
                          amount={item.startPrice}
                          withUnit={false}
                          className="text-[11px] text-white/80"
                        />
                        تومان شروع
                      </span>
                      <span
                        className="flex items-center gap-1"
                        aria-label={`${faNum(item.prebidCount)} پیش‌بیدکننده`}
                      >
                        <Users className="w-3 h-3" aria-hidden />
                        {faNum(item.prebidCount)} پیش‌بیدکننده
                      </span>
                    </div>
                  </div>
                </div>

                {my ? (
                  /* پیش‌بید ثبت‌شده */
                  <div className="flex items-center gap-2 rounded-xl border border-ls-green/30 bg-ls-green/10 px-3 py-2">
                    <span
                      className="text-xs font-extrabold text-ls-green"
                      aria-label={`پیش‌بید تو: ${toman(my.amount)}`}
                    >
                      پیش‌بید من: {toman(my.amount)}
                    </span>
                    <button
                      onClick={() => cancel(item.id)}
                      aria-label={`لغو پیش‌بید ${item.title}`}
                      className="ms-auto w-6 h-6 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 active:scale-95 transition-all"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  </div>
                ) : (
                  /* فرم ثبت پیش‌بید */
                  <div className="space-y-2">
                    <Input
                      inputMode="numeric"
                      value={draft ? faNum(draft) : ""}
                      onChange={(e) => setDraft(item.id, parseAmountInput(e.target.value))}
                      placeholder="مبلغ پیش‌بید (تومان)"
                      aria-label={`مبلغ پیش‌بید برای ${item.title} به تومان`}
                      className={cn(
                        "h-10 rounded-xl bg-ls-bg/60 border-white/10 text-sm tabular-nums",
                        draft > 0 && draft < item.startPrice && "border-[#FF3B5C]/50"
                      )}
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[item.startPrice, item.startPrice + item.step].map((v) => (
                        <button
                          key={v}
                          onClick={() => setDraft(item.id, v)}
                          aria-label={`تعیین مبلغ پیش‌بید به ${toman(v)}`}
                          className="rounded-full bg-ls-card-2 px-3 py-1.5 text-[11px] font-bold tabular-nums text-white/70 hover:text-white hover:bg-ls-line transition-colors"
                        >
                          {faNum(v)}
                        </button>
                      ))}
                      <span className="text-[10px] text-white/35">
                        پله: {faNum(item.step)}
                      </span>
                    </div>
                    <button
                      onClick={() => submit(item.id, item.title)}
                      aria-label={`ثبت پیش‌بید برای ${item.title}`}
                      className="w-full rounded-xl bg-ls-purple py-2.5 text-xs font-extrabold text-white shadow-[0_0_14px_rgba(108,92,255,.4)] hover:bg-ls-purple-deep active:scale-[.99] transition-all"
                    >
                      ثبت پیش‌بید
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* ردیف کیف پول */}
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-ls-bg/60 px-3 py-2.5">
            <Wallet className="w-4 h-4 shrink-0 text-ls-green" aria-hidden />
            <span className="text-xs text-white/70">
              موجودی:{" "}
              <span
                className="font-extrabold text-white/90 tabular-nums"
                aria-label={`موجودی کیف پول: ${toman(balance)}`}
              >
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

          <p className="text-center text-[10px] text-white/35">
            تا لحظهٔ شروع شو می‌توانی پیش‌بید را لغو یا به‌روز کنی 🕒
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
