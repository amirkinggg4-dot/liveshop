"use client";

import { useMemo, useState } from "react";
import { Calculator, CreditCard, ShieldCheck, TrendingUp } from "lucide-react";
import { faNum, toFa, toman } from "@/lib/format";
import { MY_GMV_MONTH, NOTE_BUYER_FEE } from "@/lib/data/seller-marketing";
import {
  calcNetIncome,
  commissionPctFor,
  COMMISSION_TIERS,
  GATEWAY_FEE,
} from "@/lib/config/fees";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/liveshop/shared";
import { Input } from "@/components/ui/input";

/* ─────────────────────────────────────────────────────────────
   نرخ‌های من — فاز ۳ (Atlas تصویر ۱۰)
   شفافیت کامل هزینه‌ها: پلکان فعلی و فروش ماهانه، پلکان‌های
   کمیسیون، پردازش درگاه، صفر بودن کارمزد خریدار و
   ماشین‌حساب زندهٔ خالص درآمد.
   v1.7.1 — همهٔ اعداد فقط از lib/config/fees.ts خوانده می‌شوند
   (مقدار موقت — باید با درگاه و قوانین واقعی جایگزین شود).
   ───────────────────────────────────────────────────────────── */

/* آستانه‌های عددی پلکان‌ها — از fees.ts */
const TIER_CUTS = COMMISSION_TIERS.filter((t) => t.upTo != null).map(
  (t) => t.upTo as number
);

/* ارقام فارسی/عربی → لاتین و حذف جداکننده‌ها */
function parseFaNum(input: string): number {
  const latin = input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[٬,،\s]/g, "");
  if (!latin) return 0;
  const n = Number(latin);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export default function SellerRatesView() {
  const back = useAppStore((s) => s.back);
  const [priceInput, setPriceInput] = useState("");

  /* ── پلکان جاری بر اساس فروش ماهانه ── */
  const currentTierIndex = useMemo(() => {
    if (MY_GMV_MONTH < TIER_CUTS[0]) return 0;
    if (MY_GMV_MONTH < TIER_CUTS[1]) return 1;
    return 2;
  }, []);
  const currentTierPct = COMMISSION_TIERS[currentTierIndex].pct;
  const nextTierPct = COMMISSION_TIERS[currentTierIndex + 1]?.pct;

  /* ── پیشرفت تا آستانهٔ پلکان بعدی ── */
  const nextCut =
    nextTierPct != null
      ? TIER_CUTS[currentTierIndex]
      : TIER_CUTS[TIER_CUTS.length - 1];
  const progressPct = nextTierPct
    ? Math.min(100, Math.round((MY_GMV_MONTH / nextCut) * 100))
    : 100;
  const remaining = Math.max(0, nextCut - MY_GMV_MONTH);

  /* ── ماشین‌حساب هزینه‌ها — v1.7.1: منطق خالص در fees.ts ── */
  const price = useMemo(() => parseFaNum(priceInput), [priceInput]);
  const calc = useMemo(() => {
    if (price <= 0) return null;
    return calcNetIncome(price, MY_GMV_MONTH);
  }, [price]);

  return (
    <div className="flex-1 flex flex-col" aria-label="نرخ‌های من">
      <PageHeader
        title="نرخ‌های من"
        subtitle="کارمزدها و هزینه‌ها"
        onBack={back}
      />

      <div className="space-y-4 px-4 py-4">
        {/* ── پلکان فعلی ── */}
        <div
          className="rounded-2xl border border-white/5 bg-ls-card p-4"
          aria-label="پلکان کارمزد فعلی"
        >
          <p className="text-[11px] text-white/45">پلکان فعلی</p>
          <p className="mt-1 text-3xl font-black tabular-nums text-ls-purple-soft">
            ٪{toFa(currentTierPct)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-white/60">
            <TrendingUp className="h-3.5 w-3.5 text-ls-green" aria-hidden />
            فروش ماهانهٔ شما:{" "}
            <span className="font-bold tabular-nums text-white/85">
              {toman(MY_GMV_MONTH)}
            </span>
          </p>

          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="پیشرفت فروش ماهانه تا پلکان بعدی"
          >
            <div
              className="h-full rounded-full bg-ls-purple"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-5 text-white/55">
            {nextTierPct ? (
              <>
                ٪{toFa(progressPct)} راه — فقط{" "}
                <span className="font-bold tabular-nums text-white/85">
                  {toman(remaining)}
                </span>{" "}
                فروش تا پلکان ٪{toFa(nextTierPct)}
              </>
            ) : (
              <>بالاترین پلکان کمیسیون را باز کرده‌ای 🎉</>
            )}
          </p>
        </div>

        {/* ── پلکان‌های کمیسیون ── */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold">
            <span aria-hidden>🪜</span>
            پلکان‌های کمیسیون
          </h2>
          <div className="space-y-2">
            {COMMISSION_TIERS.map((t, i) => (
              <div
                key={t.upTo ?? "max"}
                className={
                  i === currentTierIndex
                    ? "flex items-center gap-3 rounded-2xl border border-ls-purple bg-ls-purple/10 p-3.5"
                    : "flex items-center gap-3 rounded-2xl border border-white/5 bg-ls-card p-3.5"
                }
                aria-label={`پلکان کمیسیون ${t.upTo == null ? "بدون سقف" : `تا ${toFa(Math.round((t.upTo ?? 0) / 1_000_000))} میلیون تومان`}`}
              >
                <span
                  className={
                    i === currentTierIndex
                      ? "w-14 shrink-0 text-center text-2xl font-black tabular-nums text-ls-purple-soft"
                      : "w-14 shrink-0 text-center text-2xl font-black tabular-nums text-white/45"
                  }
                >
                  ٪{toFa(t.pct)}
                </span>
                <span className="min-w-0 flex-1 text-xs leading-5 text-white/75">
                  {t.upTo == null
                    ? "بالای ۱۵۰ میلیون تومان فروش ماهانه"
                    : i === 0
                      ? `تا ${toFa(Math.round((t.upTo ?? 0) / 1_000_000))} میلیون تومان فروش ماهانه`
                      : `${toFa(Math.round((TIER_CUTS[i - 1] ?? 0) / 1_000_000))} تا ${toFa(Math.round((t.upTo ?? 0) / 1_000_000))} میلیون تومان فروش ماهانه`}
                </span>
                {i === currentTierIndex && (
                  <span className="shrink-0 rounded-full bg-ls-purple px-2.5 py-1 text-[10px] font-black text-white">
                    فعلی
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── پردازش درگاه ── */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-ls-card p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ls-card-2">
            <CreditCard className="h-5 w-5 text-ls-purple-soft" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold tabular-nums">
              پردازش درگاه: ٪{toFa(GATEWAY_FEE.pct)} + {faNum(GATEWAY_FEE.flatToman)} تومان
            </p>
            <p className="mt-0.5 text-[11px] text-white/45">
              تسویهٔ هفتگی — هر پنج‌شنبه به شبای ثبت‌شده
            </p>
          </div>
        </div>

        {/* ── کارمزد خریدار صفر ── */}
        <div
          className="rounded-2xl border border-ls-green/30 bg-ls-green/10 p-4"
          aria-label="کارمزد خریدار صفر"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0 text-ls-green" aria-hidden />
            <p className="text-sm font-extrabold text-ls-green">
              کارمزد خریدار: صفر
            </p>
          </div>
          <p className="mt-2 text-xs leading-6 text-white/75">{NOTE_BUYER_FEE}</p>
        </div>

        {/* ── ماشین‌حساب هزینه ── */}
        <div
          className="rounded-2xl border border-white/5 bg-ls-card p-4"
          aria-label="ماشین‌حساب خالص درآمد"
        >
          <div className="mb-3 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-ls-purple-soft" aria-hidden />
            <p className="text-sm font-extrabold">ماشین‌حساب خالص درآمد</p>
          </div>
          <label htmlFor="sale-price-input" className="sr-only">
            قیمت فروش به تومان
          </label>
          <Input
            id="sale-price-input"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            inputMode="numeric"
            placeholder="قیمت فروش (تومان) — مثلاً ۲٬۵۰۰٬۰۰۰"
            aria-label="قیمت فروش به تومان"
            className="h-11 rounded-xl border-white/10 bg-ls-card-2 text-sm text-white placeholder:text-white/30"
          />

          <div className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/70">قیمت فروش</span>
              <span className="shrink-0 font-bold tabular-nums">
                {price > 0 ? toman(price) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/70">
                کمیسیون {calc ? `(٪${toFa(calc.commissionPct)})` : ""}
              </span>
              <span className="shrink-0 font-bold tabular-nums text-[#FF3B5C]">
                {calc ? `−${toman(calc.commission)}` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/70">
                پردازش درگاه (٪{toFa(GATEWAY_FEE.pct)} + {faNum(GATEWAY_FEE.flatToman)})
              </span>
              <span className="shrink-0 font-bold tabular-nums text-[#FF3B5C]">
                {calc ? `−${toman(calc.processing)}` : "—"}
              </span>
            </div>
            <div className="border-t border-dashed border-white/10" aria-hidden />
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold">خالص شما</span>
              <span className="shrink-0 text-base font-black tabular-nums text-ls-green">
                {calc ? toman(calc.net) : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* ── نکتهٔ رشد خودکار ── */}
        <p className="rounded-2xl bg-ls-card-2/60 p-3.5 text-center text-[11px] leading-5 text-white/45">
          نرخ‌ها به‌صورت خودکار با رشد فروش بهتر می‌شوند — بدون درخواست
        </p>
      </div>
    </div>
  );
}
