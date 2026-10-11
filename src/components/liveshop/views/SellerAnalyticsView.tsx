"use client";

import { useState } from "react";
import {
  BarChart3,
  Clock3,
  Eye,
  Flame,
  MousePointerClick,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { compactFa, faNum, toFa, toman } from "@/lib/format";
import {
  ANALYTIC_KPIS,
  ANALYTIC_PERIODS,
  FUNNEL,
  HEAT_HOURS,
  HEAT_PEAK_LABEL,
  REVENUE_SERIES,
  TOP_ITEMS,
  type AnalyticPeriod,
} from "@/lib/data/seller-analytics";
import { useAppStore } from "@/store/app-store";
import { Chip, PageHeader } from "@/components/liveshop/shared";

/* ─────────────────────────────────────────────────────────────
   آنالیتیکس فروشنده — فاز ۳ (Atlas تصویر ۳۱)
   دوره‌های ۷ روز/۳۰ روز/فصل با ۴ KPI، روند فروش ۸ هفته (نمودار میله‌ای
   CSS خالص)، قیف تبدیل، پرفروش‌ترین‌ها و نقشهٔ حرارتی بهترین ساعت پخش.
   ───────────────────────────────────────────────────────────── */

/** اعشار فارسی با یک رقم اعشار — 2.4 → «۲٫۴» ، 58.0645… → «۵۸٫۱» */
const faDec = (n: number) =>
  toFa((Math.round(n * 10) / 10).toString().replace(".", "٫"));

type Accent = "purple" | "pink" | "green" | "white";

const ACCENT_TEXT: Record<Accent, string> = {
  purple: "text-ls-purple-soft",
  pink: "text-ls-pink",
  green: "text-ls-green",
  white: "text-white",
};

const ACCENT_BG: Record<Accent, string> = {
  purple: "bg-ls-purple/15",
  pink: "bg-ls-pink/15",
  green: "bg-ls-green/15",
  white: "bg-white/10",
};

export default function SellerAnalyticsView() {
  const back = useAppStore((s) => s.back);
  const [period, setPeriod] = useState<AnalyticPeriod>(ANALYTIC_PERIODS[0]);
  const kpi = ANALYTIC_KPIS[period];

  const maxWeek = Math.max(...REVENUE_SERIES.map((w) => w.value));
  const seriesSum = REVENUE_SERIES.reduce((acc, w) => acc + w.value, 0);
  const funnelFirst = FUNNEL[0].value;
  const funnelLast = FUNNEL[FUNNEL.length - 1].value;
  const overallConv = (funnelLast / funnelFirst) * 100;
  const peakHour = HEAT_HOURS.find((h) => h.value === Math.max(...HEAT_HOURS.map((x) => x.value)));

  return (
    <div className="flex-1 flex flex-col" aria-label="آنالیتیکس فروشنده">
      <PageHeader title="آنالیتیکس" subtitle="عملکرد فروش شما" onBack={back} />

      <div className="space-y-4 px-4 py-4">
        {/* ── چیپ‌های دوره ── */}
        <div className="flex items-center gap-2" role="group" aria-label="انتخاب دورهٔ آماری">
          {ANALYTIC_PERIODS.map((p) => (
            <Chip key={p} active={period === p} onClick={() => setPeriod(p)}>
              {p}
            </Chip>
          ))}
          <span className="mr-auto flex items-center gap-1 text-[10px] font-bold text-ls-green">
            <TrendingUp className="h-3 w-3" aria-hidden />
            {kpi.deltaLabel}
          </span>
        </div>

        {/* ── کارت‌های KPI ── */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-2xl border border-white/5 bg-ls-card p-4"
            aria-label={`فروش ناخالص دورهٔ ${period}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${ACCENT_BG.purple}`}
                aria-hidden
              >
                <ShoppingBag className={`h-4 w-4 ${ACCENT_TEXT.purple}`} />
              </span>
              <p className="text-[11px] text-white/45">فروش (GMV)</p>
            </div>
            <p className={`mt-2 text-lg font-black tabular-nums ${ACCENT_TEXT.purple}`}>
              {faNum(kpi.gmv)}
              <span className="mr-1 text-[10px] font-bold text-white/40">تومان</span>
            </p>
          </div>

          <div
            className="rounded-2xl border border-white/5 bg-ls-card p-4"
            aria-label={`تعداد سفارش‌های دورهٔ ${period}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${ACCENT_BG.pink}`}
                aria-hidden
              >
                <ShoppingCart className={`h-4 w-4 ${ACCENT_TEXT.pink}`} />
              </span>
              <p className="text-[11px] text-white/45">سفارش‌ها</p>
            </div>
            <p className={`mt-2 text-lg font-black tabular-nums ${ACCENT_TEXT.pink}`}>
              {faNum(kpi.orders)}
              <span className="mr-1 text-[10px] font-bold text-white/40">سفارش</span>
            </p>
          </div>

          <div
            className="rounded-2xl border border-white/5 bg-ls-card p-4"
            aria-label={`بیننده‌های دورهٔ ${period}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${ACCENT_BG.green}`}
                aria-hidden
              >
                <Eye className={`h-4 w-4 ${ACCENT_TEXT.green}`} />
              </span>
              <p className="text-[11px] text-white/45">بیننده</p>
            </div>
            <p className={`mt-2 text-lg font-black tabular-nums ${ACCENT_TEXT.green}`}>
              {compactFa(kpi.viewers)}
            </p>
          </div>

          <div
            className="rounded-2xl border border-white/5 bg-ls-card p-4"
            aria-label={`نرخ تبدیل دورهٔ ${period}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${ACCENT_BG.white}`}
                aria-hidden
              >
                <MousePointerClick className={`h-4 w-4 ${ACCENT_TEXT.white}`} />
              </span>
              <p className="text-[11px] text-white/45">نرخ تبدیل</p>
            </div>
            <p className="mt-2 text-lg font-black tabular-nums text-white">
              ٪{faDec(kpi.conversion)}
            </p>
          </div>
        </div>

        {/* ── روند فروش ۸ هفته — نمودار میله‌ای CSS خالص ── */}
        <div className="rounded-2xl border border-white/5 bg-ls-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-extrabold">
              <BarChart3 className="h-4 w-4 text-ls-purple-soft" aria-hidden />
              روند فروش ۸ هفته
            </p>
            <span
              className="text-[10px] tabular-nums text-white/40"
              aria-label={`سقف محور: ${toman(maxWeek)}`}
            >
              سقف: {compactFa(maxWeek)} تومان
            </span>
          </div>
          <div
            className="mt-4 flex h-28 items-end gap-1.5"
            role="img"
            aria-label={`نمودار میله‌ای فروش هفتگی — جمع ${toman(seriesSum)}`}
          >
            {REVENUE_SERIES.map((w) => (
              <span
                key={w.label}
                title={`${w.label} — ${toman(w.value)}`}
                aria-label={`${w.label}: ${toman(w.value)}`}
                className="flex h-full min-w-0 flex-1 items-end"
              >
                <span
                  aria-hidden
                  className="w-full min-h-1 rounded-t bg-ls-purple/70 transition-colors hover:bg-ls-purple"
                  style={{ height: `${(w.value / maxWeek) * 100}%` }}
                />
              </span>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5" aria-hidden>
            {REVENUE_SERIES.map((w, i) => (
              <span
                key={w.label}
                className="min-w-0 flex-1 truncate text-center text-[9px] text-white/40"
              >
                {i % 2 === 0 ? w.label : ""}
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-white/50">
            جمع ۸ هفته:{" "}
            <span className="font-bold tabular-nums text-white/80">{toman(seriesSum)}</span>
          </p>
        </div>

        {/* ── قیف تبدیل ── */}
        <div className="rounded-2xl border border-white/5 bg-ls-card p-4">
          <p className="flex items-center gap-1.5 text-sm font-extrabold">
            <Flame className="h-4 w-4 text-ls-pink" aria-hidden />
            قیف تبدیل
          </p>
          <div className="mt-3 space-y-3">
            {FUNNEL.map((step, i) => {
              const widthPct = (step.value / funnelFirst) * 100;
              const stepConv = i > 0 ? (step.value / FUNNEL[i - 1].value) * 100 : null;
              return (
                <div key={step.label}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-white/85">{step.label}</span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums">
                      {stepConv != null && (
                        <span className="text-[10px] text-white/45">
                          ٪{faDec(stepConv)} از مرحلهٔ قبل
                        </span>
                      )}
                      <span className="font-bold text-white/90">{faNum(step.value)}</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-ls-card-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${widthPct}%`, backgroundColor: step.color }}
                      aria-hidden
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-white/50">
            تبدیل کل: ٪{faDec(overallConv)} — از بازدید شو تا خریدار
          </p>
        </div>

        {/* ── پرفروش‌ترین‌ها ── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-extrabold">
              <Trophy className="h-4 w-4 text-ls-purple-soft" aria-hidden />
              پرفروش‌ترین‌ها
            </p>
            <span className="text-[11px] font-bold text-white/45">
              {faNum(TOP_ITEMS.length)} آیتم
            </span>
          </div>
          <ul
            className="max-h-64 space-y-2 overflow-y-auto scroll-thin pl-1"
            aria-label="فهرست پرفروش‌ترین آیتم‌ها"
          >
            {TOP_ITEMS.map((item, i) => (
              <li
                key={item.title}
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-ls-card p-3"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ls-card-2 text-lg"
                  aria-hidden
                >
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-white/45">
                    {faNum(item.soldCount)} فروش
                  </p>
                </div>
                <span className="shrink-0 text-xs font-extrabold tabular-nums text-ls-purple-soft">
                  {toman(item.gmv)}
                </span>
                <span
                  className="w-5 shrink-0 text-center text-[10px] font-black text-white/30"
                  aria-hidden
                >
                  {toFa(i + 1)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── بهترین ساعت پخش — نوار حرارتی ── */}
        <div className="rounded-2xl border border-white/5 bg-ls-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-extrabold">
              <Clock3 className="h-4 w-4 text-ls-green" aria-hidden />
              بهترین ساعت پخش
            </p>
            <span className="text-[10px] text-white/40">شدت بیننده در ۱۲ ساعت</span>
          </div>
          <div
            className="mt-3 grid grid-cols-12 gap-1"
            role="img"
            aria-label={`نقشهٔ حرارتی بیننده بر اساس ساعت — ${HEAT_PEAK_LABEL}`}
          >
            {HEAT_HOURS.map((h) => {
              const isPeak = peakHour != null && h.label === peakHour.label;
              return (
                <span
                  key={h.label}
                  title={`ساعت ${h.label} — شدت ${toFa(h.value)}٪`}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    aria-hidden
                    className={`h-6 w-full rounded bg-ls-green ${isPeak ? "ring-2 ring-ls-green" : ""}`}
                    style={{ opacity: h.value / 100 }}
                  />
                  <span className="text-[8px] tabular-nums text-white/40">{h.label}</span>
                </span>
              );
            })}
          </div>
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-white/50">
            <Flame className="h-3.5 w-3.5 text-ls-green" aria-hidden />
            {HEAT_PEAK_LABEL}
          </p>
        </div>
      </div>
    </div>
  );
}
