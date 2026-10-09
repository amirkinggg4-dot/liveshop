"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import { toFa, toman } from "@/lib/format";
import { BOOST_PACKAGES } from "@/lib/data/seller-marketing";
import { useAppStore } from "@/store/app-store";
import { useMarketingStore } from "@/store/marketing-store";
import { useSellerStore } from "@/store/seller-store";
import { Chip, PageHeader, SectionTitle } from "@/components/liveshop/shared";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

/* ─────────────────────────────────────────────────────────────
   بازاریابی فروشنده — فاز ۳
   تقویت شو (بسته‌ها + تقویت فعال)، کدهای تخفیف (ساخت/فعال‌سازی)
   و تیزر همکاری در پخش (Raid / Co-host).
   ───────────────────────────────────────────────────────────── */

const PERCENT_OPTIONS = [5, 10, 15, 20] as const;

export default function SellerMarketingView() {
  const back = useAppStore((s) => s.back);
  const nextShowTitle = useSellerStore((s) => s.scheduledShows[0]?.title);
  const promoCodes = useMarketingStore((s) => s.promoCodes);
  const boostActive = useMarketingStore((s) => s.boostActive);
  const toggleCode = useMarketingStore((s) => s.toggleCode);
  const addCode = useMarketingStore((s) => s.addCode);
  const startBoost = useMarketingStore((s) => s.startBoost);
  const stopBoost = useMarketingStore((s) => s.stopBoost);

  const [newOpen, setNewOpen] = useState(false);
  const [selectedPercent, setSelectedPercent] = useState<number>(10);

  const handleStartBoost = (pkgId: string) => {
    startBoost(pkgId, nextShowTitle ?? "شو بعدی");
    toast.success("تقویت فعال شد 🚀 — شو بعدی بیشتر دیده می‌شود");
  };

  const handleCreateCode = () => {
    const created = addCode({ percent: selectedPercent });
    setNewOpen(false);
    toast.success(`کد تخفیف ساخته شد 🎟️ — ${created.code}`);
  };

  return (
    <div className="flex-1 flex flex-col" aria-label="بازاریابی فروشنده">
      <PageHeader
        title="بازاریابی"
        subtitle="کد تخفیف و تقویت شو"
        onBack={back}
      />

      <div className="space-y-4 px-4 py-4">
        {/* ── تقویت فعال ── */}
        {boostActive && (
          <div
            className="rounded-2xl p-[1.5px]"
            style={{ background: "linear-gradient(135deg,#6C5CFF,#4a3dd6)" }}
            aria-label="تقویت فعال"
          >
            <div className="rounded-[14.5px] bg-ls-card p-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2 h-2 shrink-0 rounded-full bg-ls-green animate-ls-pulse"
                  aria-hidden
                />
                <p className="text-sm font-extrabold">تقویت فعال</p>
                <span className="ms-auto rounded-full bg-ls-purple/20 px-2 py-0.5 text-[10px] font-bold text-ls-purple-soft">
                  {boostActive.endsLabel}
                </span>
              </div>
              <p className="mt-2 text-xs text-white/60">
                روی شو «{boostActive.showTitle}» — بیننده‌های بیشتری دیده می‌شوی
              </p>
              <button
                type="button"
                onClick={() => {
                  stopBoost();
                  toast("تقویت متوقف شد");
                }}
                className="mt-3 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/5"
                aria-label="توقف تقویت فعال"
              >
                توقف
              </button>
            </div>
          </div>
        )}

        {/* ── بسته‌های تقویت ── */}
        <div>
          <SectionTitle
            title="بسته‌های تقویت"
            icon="⚡"
            action={
              <span className="text-[11px] font-bold text-white/45">
                برای شو بعدی اعمال می‌شود
              </span>
            }
          />
          <div className="grid grid-cols-1 gap-2">
            {BOOST_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-ls-card p-4"
                aria-label={`بستهٔ ${pkg.name}`}
              >
                <span className="w-11 h-11 shrink-0 rounded-xl bg-ls-card-2 flex items-center justify-center text-xl" aria-hidden>
                  {pkg.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">{pkg.name}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-ls-green">
                    {pkg.reachLabel}
                  </p>
                  <p className="mt-1 text-xs font-extrabold tabular-nums text-white/85">
                    {toman(pkg.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartBoost(pkg.id)}
                  className="shrink-0 rounded-xl bg-ls-purple px-3 py-2 text-xs font-extrabold text-white shadow-[0_0_14px_rgba(108,92,255,.35)] transition-transform active:scale-[.98]"
                  aria-label={`اجرای ${pkg.name} برای شو بعدی`}
                >
                  اجرا برای شو بعدی
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── کدهای تخفیف ── */}
        <div className="rounded-2xl border border-white/5 bg-ls-card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <span aria-hidden>🎟️</span>
              کدهای تخفیف
            </h2>
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="shrink-0 rounded-lg bg-ls-purple px-3 py-1.5 text-[11px] font-extrabold text-white transition-transform active:scale-[.98]"
              aria-label="ساخت کد تخفیف جدید"
            >
              ساخت کد جدید
            </button>
          </div>

          <ul
            className="max-h-96 space-y-2.5 overflow-y-auto scroll-thin pl-1"
            aria-label="فهرست کدهای تخفیف"
          >
            {promoCodes.map((c) => (
              <li
                key={c.id}
                className={cn(
                  "rounded-2xl border border-white/5 bg-ls-card-2/40 p-3.5 transition-opacity",
                  !c.active && "opacity-50"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    dir="ltr"
                    className="rounded-lg bg-ls-card-2 px-2.5 py-1 font-mono text-xs font-bold text-white/90"
                  >
                    {c.code}
                  </span>
                  <span className="rounded-full border border-ls-pink/40 bg-ls-pink/15 px-2 py-0.5 text-[10px] font-black tabular-nums text-ls-pink">
                    ٪{toFa(c.percent)}
                  </span>
                  <Switch
                    checked={c.active}
                    onCheckedChange={() => toggleCode(c.id)}
                    aria-label={`فعال‌سازی کد تخفیف ${c.code}`}
                    className="ms-auto data-[state=checked]:bg-ls-purple"
                  />
                </div>
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[10px] text-white/45">
                    <span className="tabular-nums">
                      {faUsage(c.usedCount, c.maxCount)}
                    </span>
                    <span>{c.expiresLabel}</span>
                  </div>
                  <div
                    className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"
                    role="progressbar"
                    aria-valuenow={c.usedCount}
                    aria-valuemin={0}
                    aria-valuemax={c.maxCount}
                    aria-label={`میزان استفاده از کد ${c.code}`}
                  >
                    <div
                      className="h-full rounded-full bg-ls-purple"
                      style={{
                        width: `${Math.min(100, Math.round((c.usedCount / c.maxCount) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ── تیزر همکاری در پخش ── */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-ls-card p-4">
          <span className="w-11 h-11 shrink-0 rounded-xl bg-ls-card-2 flex items-center justify-center text-xl" aria-hidden>
            🤝
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">همکاری در پخش (Raid / Co-host)</p>
            <p className="mt-0.5 text-xs text-white/50">
              از داشبورد زندهٔ فروشنده در دسترس است
            </p>
          </div>
          <Rocket className="h-4 w-4 shrink-0 text-ls-purple-soft" aria-hidden />
        </div>
      </div>

      {/* ── دیالوگ ساخت کد تخفیف ── */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent
          className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm"
          aria-label="ساخت کد تخفیف جدید"
        >
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle>ساخت کد تخفیف</DialogTitle>
            <DialogDescription className="text-xs leading-5">
              درصد تخفیف را انتخاب کن — کد خودکار ساخته می‌شود و ۳۰ روز اعتبار دارد.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2" role="group" aria-label="درصد تخفیف">
            {PERCENT_OPTIONS.map((p) => (
              <Chip
                key={p}
                active={selectedPercent === p}
                onClick={() => setSelectedPercent(p)}
                className="px-4 py-2 text-sm"
              >
                ٪{toFa(p)}
              </Chip>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCreateCode}
            className="h-11 w-full rounded-xl bg-ls-purple text-sm font-extrabold text-white transition-transform active:scale-[.98]"
            aria-label="ثبت کد تخفیف"
          >
            ساخت کد تخفیف
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* برچسب استفادهٔ کد — «۳۴ از ۱۰۰ استفاده شده» */
function faUsage(used: number, max: number): string {
  return `${toFa(used)} از ${toFa(max)} استفاده شده`;
}
