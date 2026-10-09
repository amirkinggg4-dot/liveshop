"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BarChart3, CheckCircle2, Loader2, Wallet } from "lucide-react";
import { faNum, toFa, toman } from "@/lib/format";
import { COMMISSION_NOTE, SELLER_REVENUE } from "@/lib/data/seller";
import { useAppStore } from "@/store/app-store";
import { PageHeader, SectionTitle } from "@/components/liveshop/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ─────────────────────────────────────────────────────────────
   درآمد فروشنده — فاز ۲ (Atlas تصویر ۲۹)
   پول شفاف: کارت موجودی قابل برداشت با برداشت فوری به شبا،
   تفکیک آخرین شو با فرمولِ هر کسر روی همان ردیف، پلکان کارمزد
   پلکانی و تاریخچهٔ تسویه‌های هفتگی — از SELLER_REVENUE.
   ───────────────────────────────────────────────────────────── */

/* ── دیالوگ برداشت فوری: شبا + مبلغ → تأیید سبز → پردازش ۱ ثانیه ── */
function WithdrawDialog({
  open,
  onOpenChange,
  amount,
  sheba,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  sheba: string;
}) {
  const [processing, setProcessing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const handleOpenChange = (next: boolean) => {
    if (!next && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      setProcessing(false);
    }
    onOpenChange(next);
  };

  const confirm = () => {
    if (processing) return;
    setProcessing(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setProcessing(false);
      onOpenChange(false);
      toast.success("درخواست برداشت ثبت شد — تا ۲۴ ساعت به شبا واریز می‌شود");
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm"
        aria-label="برداشت فوری به شبا"
      >
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle>برداشت فوری</DialogTitle>
          <DialogDescription className="text-xs leading-5">
            {processing
              ? "لطفاً چند لحظه صبر کن…"
              : "مبلغ موجودی به شبأ ثبت‌شدهٔ شما واریز می‌شود."}
          </DialogDescription>
        </DialogHeader>

        {processing ? (
          <div
            className="flex flex-col items-center gap-3 py-6 text-center"
            role="status"
            aria-live="polite"
          >
            <Loader2
              className="h-9 w-9 animate-spin text-ls-green"
              aria-hidden
            />
            <p className="text-sm font-extrabold">در حال ثبت درخواست برداشت…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-ls-card-2 p-4 text-center">
              <p className="text-[11px] text-white/45">مبلغ برداشت</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-ls-green">
                {toman(amount)}
              </p>
              <p
                dir="ltr"
                className="mt-3 inline-flex rounded-lg bg-ls-bg/60 px-2.5 py-1.5 font-mono text-[11px] text-white/70"
              >
                {sheba}
              </p>
            </div>
            <p className="text-center text-[11px] text-white/45">
              واریز تا حداکثر ۲۴ ساعت — بدون کارمزد برداشت
            </p>
            <button
              type="button"
              onClick={confirm}
              className="h-11 w-full rounded-xl bg-ls-green text-sm font-extrabold text-[#04281e] transition-transform active:scale-[.98]"
              aria-label="ثبت درخواست برداشت"
            >
              ثبت درخواست برداشت
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SellerRevenueView() {
  const back = useAppStore((s) => s.back);
  const push = useAppStore((s) => s.push);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const rev = SELLER_REVENUE;

  return (
    <div className="flex-1 flex flex-col" aria-label="درآمد فروشنده">
      <PageHeader
        title="درآمد فروشنده"
        subtitle="پول شفاف — کارمزد پلکانی"
        onBack={back}
      />

      <div className="space-y-4 px-4 py-4">
        {/* ── کارت موجودی قابل برداشت ── */}
        <div
          className="rounded-3xl p-5 text-white shadow-[0_14px_36px_rgba(108,92,255,.3)]"
          style={{ background: "linear-gradient(135deg,#6C5CFF,#4a3dd6)" }}
          aria-label="موجودی قابل برداشت"
        >
          <p className="text-xs text-white/70">موجودی قابل برداشت</p>
          <p className="mt-1 text-3xl font-black tabular-nums">
            {toman(rev.available)}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/80">
            <Wallet className="h-3.5 w-3.5" aria-hidden />
            تسویهٔ خودکار بعدی: {rev.nextPayoutLabel}
          </p>
          <p
            dir="ltr"
            className="mt-1 text-left text-[11px] tabular-nums text-white/60"
          >
            {rev.shebaMasked}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              className="rounded-xl border border-white/25 bg-white/15 py-2.5 text-xs font-extrabold transition-transform active:scale-[.98]"
              aria-label="برداشت فوری به شبا"
            >
              برداشت فوری
            </button>
            <button
              type="button"
              onClick={() => toast("تنظیمات تسویهٔ هفتگی به شبا (دمو)")}
              className="rounded-xl border border-white/25 py-2.5 text-xs font-extrabold transition-colors hover:bg-white/10"
              aria-label="تنظیمات تسویه"
            >
              تنظیمات تسویه
            </button>
          </div>
        </div>

        {/* ── کارت‌های خلاصه ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/5 bg-ls-card p-3.5">
            <p className="text-[11px] text-white/45">در حال تسویه</p>
            <p className="mt-1 text-sm font-extrabold tabular-nums">
              {toman(rev.pendingClearing)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-ls-card p-3.5">
            <p className="text-[11px] text-white/45">درآمد کل</p>
            <p className="mt-1 text-sm font-extrabold tabular-nums">
              {toman(rev.lifetime)}
            </p>
          </div>
        </div>

        {/* ── تفکیک آخرین شو — هر کسر با فرمولش ── */}
        <div>
          <SectionTitle
            title="تفکیک آخرین شو"
            action={
              <span className="text-[11px] font-bold text-white/45">
                {rev.lastShow.title}
              </span>
            }
          />
          <div className="rounded-2xl border border-white/5 bg-ls-card p-4">
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/70">فروش ناخالص</span>
                <span className="shrink-0 font-bold tabular-nums">
                  {toman(rev.lastShow.gross)}
                </span>
              </div>
              <div className="border-t border-white/5" aria-hidden />
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/70">
                  کمیسیون ({toFa(rev.lastShow.commissionPct)}٪)
                </span>
                <span className="shrink-0 font-bold tabular-nums text-[#FF3B5C]">
                  −{toman(rev.lastShow.commission)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/70">
                  {`هزینهٔ پردازش درگاه (${toFa(rev.lastShow.processingPct)}٪ + ${faNum(rev.lastShow.processingFlat)} تومان)`}
                </span>
                <span className="shrink-0 font-bold tabular-nums text-[#FF3B5C]">
                  −{toman(rev.lastShow.processing)}
                </span>
              </div>
              <div className="border-t border-dashed border-white/10" aria-hidden />
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold">خالص شو</span>
                <span className="shrink-0 text-base font-black tabular-nums text-ls-green">
                  {toman(rev.lastShow.net)}
                </span>
              </div>
            </div>
            <p className="mt-2.5 text-[10px] text-white/40">
              هر کسر با فرمولش روی همان ردیف نوشته شده — هیچ عددی مخفی نیست.
            </p>
          </div>
        </div>

        {/* ── پلکان کارمزد ── */}
        <div className="rounded-2xl border border-ls-purple/30 bg-ls-purple/10 p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-ls-purple-soft" aria-hidden />
            <p className="text-sm font-bold">پلکان کارمزد</p>
          </div>
          <div className="mt-3 space-y-2">
            {rev.tiers.map((t) => (
              <div key={t.label} className="flex items-center gap-2.5">
                <span className="rounded-md bg-ls-purple/25 px-2 py-0.5 text-[11px] font-black tabular-nums text-ls-purple-soft">
                  ٪{toFa(t.pct)}
                </span>
                <span className="text-xs text-white/75">— {t.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] leading-5 text-white/60">
            {COMMISSION_NOTE}
          </p>
          {/* فاز ۳ (P1) — میان‌بر «نرخ‌های من» (تصویر ۱۰) — فقط اضافه‌شده */}
          <button
            type="button"
            onClick={() => push("sellerRates")}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-ls-purple/40 bg-ls-purple/15 py-2.5 text-xs font-extrabold text-ls-purple-soft transition-colors hover:bg-ls-purple/25"
            aria-label="رفتن به صفحهٔ نرخ‌های من و ماشین‌حساب هزینه"
          >
            نرخ‌های من و ماشین‌حساب هزینه
            <span aria-hidden>←</span>
          </button>
        </div>

        {/* ── تاریخچهٔ تسویه ── */}
        <div>
          <SectionTitle
            title="تاریخچهٔ تسویه"
            action={
              <span className="rounded-full bg-ls-card-2 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white/60">
                {faNum(rev.payouts.length)} تسویه
              </span>
            }
          />
          <ul
            className="max-h-96 space-y-2.5 overflow-y-auto scroll-thin pl-1"
            aria-label="فهرست تسویه‌حساب‌ها"
          >
            {rev.payouts.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-ls-card p-3.5"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-ls-green" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold tabular-nums">
                    {toman(p.amount)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/45">
                    {p.atLabel} · {p.method}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="rounded-full border border-ls-green/40 bg-ls-green/15 px-2 py-0.5 text-[10px] font-bold text-ls-green">
                    {p.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => toast("دانلود فاکتور (دمو)")}
                    className="rounded-lg border border-white/15 px-2 py-1 text-[10px] font-bold text-white/70 transition-colors hover:bg-white/5"
                    aria-label={`دانلود فاکتور تسویه ${p.atLabel}`}
                  >
                    فاکتور
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── دیالوگ برداشت فوری ── */}
      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        amount={rev.available}
        sheba={rev.shebaMasked}
      />
    </div>
  );
}
