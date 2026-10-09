"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Lightbulb, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { faNum } from "@/lib/format";
import {
  HEALTH_METRICS,
  HEALTH_SCORE,
  HEALTH_TASKS,
  HEALTH_TIPS,
  POLICY_ROWS,
} from "@/lib/data/seller-analytics";
import { selectDoneCount, useSellerP1Store } from "@/store/seller-p1-store";
import { useAppStore } from "@/store/app-store";
import { PageHeader, SectionTitle } from "@/components/liveshop/shared";

/* ─────────────────────────────────────────────────────────────
   سلامت اکانت فروشنده — فاز ۳ (Atlas تصویر ۳۰)
   حلقهٔ امتیاز ۹۲، هشدار کهربایی اسکن دیرهنگام، شاخص‌ها،
   کارهای بهبود (چک‌باکس روی استور P1)، وضعیت قوانین و توصیه‌ها.
   ───────────────────────────────────────────────────────────── */

const RING_R = 52;
const RING_CIRC = 2 * Math.PI * RING_R;
const RING_PROGRESS = HEALTH_SCORE / 100;

export default function SellerHealthView() {
  const back = useAppStore((s) => s.back);
  const doneTaskIds = useSellerP1Store((s) => s.doneTaskIds);
  const toggleTask = useSellerP1Store((s) => s.toggleTask);
  const doneCount = useSellerP1Store(selectDoneCount);

  return (
    <div className="flex-1 flex flex-col" aria-label="سلامت اکانت فروشنده">
      <PageHeader
        title="سلامت اکانت"
        subtitle="امتیاز، قوانین و کارهای بهبود"
        onBack={back}
      />

      <div className="space-y-5 px-4 py-4">
        {/* ── قهرمان امتیاز — حلقهٔ SVG ── */}
        <div
          className="flex items-center gap-4 rounded-2xl border border-white/5 bg-ls-card p-4"
          aria-label={`امتیاز سلامت اکانت: ${faNum(HEALTH_SCORE)} از ۱۰۰`}
        >
          <div className="relative h-[120px] w-[120px] shrink-0">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              role="img"
              aria-hidden
            >
              <circle
                cx="60"
                cy="60"
                r={RING_R}
                fill="none"
                strokeWidth="10"
                className="stroke-ls-card-2"
              />
              <circle
                cx="60"
                cy="60"
                r={RING_R}
                fill="none"
                strokeWidth="10"
                stroke="#00C896"
                strokeLinecap="round"
                strokeDasharray={`${RING_CIRC * RING_PROGRESS} ${RING_CIRC}`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black tabular-nums text-white">
                {faNum(HEALTH_SCORE)}
              </span>
              <span className="text-xs font-bold text-ls-green">عالی</span>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">امتیاز سلامت فروشنده</p>
            <p className="mt-1.5 text-xs leading-5 text-white/50">
              آستانهٔ سالم: ۸۰ — زیر ۸۰ محدودیت نمایش
            </p>
            <span className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-ls-green/40 bg-ls-green/15 px-2.5 py-1 text-[10px] font-bold text-ls-green">
              <Sparkles className="h-3 w-3" aria-hidden />
              بالای آستانه — نمایش کامل شوی تو
            </span>
          </div>
        </div>

        {/* ── هشدار کهربایی اسکن دیرهنگام ── */}
        <div
          className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4"
          role="alert"
          aria-label="هشدار اسکن دیرهنگام"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/15"
            aria-hidden
          >
            <Truck className="h-4 w-4 text-amber-300" />
          </span>
          <p className="text-xs font-bold leading-5 text-amber-200">
            {faNum(2)} سفارش هفتهٔ پیش دیر اسکن شدند — این هفته جبران کن تا نرخ بالای ٪۸۰ بماند
          </p>
        </div>

        {/* ── شاخص‌ها ── */}
        <div>
          <SectionTitle title="شاخص‌ها" />
          <div
            className="divide-y divide-white/5 rounded-2xl border border-white/5 bg-ls-card p-4"
            aria-label="فهرست شاخص‌های سلامت"
          >
            {HEALTH_METRICS.map((m) => (
              <div key={m.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    m.status === "good" ? "bg-ls-green" : "bg-amber-400"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white/85">{m.label}</p>
                    <p
                      className={`shrink-0 text-sm font-extrabold tabular-nums ${
                        m.status === "warn" ? "text-amber-300" : "text-white"
                      }`}
                    >
                      {m.value}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-white/45">{m.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── کارهای بهبود ── */}
        <div>
          <SectionTitle
            title="کارهای بهبود"
            action={
              <span
                className="rounded-full bg-ls-card-2 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white/60"
                aria-label={`${faNum(doneCount)} از ${faNum(HEALTH_TASKS.length)} کار تکمیل شده`}
              >
                {faNum(doneCount)}/{faNum(HEALTH_TASKS.length)}
              </span>
            }
          />
          <div className="rounded-2xl border border-white/5 bg-ls-card p-4">
            <div
              className="divide-y divide-white/5"
              aria-label="چک‌لیست کارهای بهبود امتیاز"
            >
              {HEALTH_TASKS.map((t) => {
                const done = doneTaskIds.includes(t.id);
                return (
                  <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Checkbox
                      checked={done}
                      onCheckedChange={() => toggleTask(t.id)}
                      aria-label={`علامت‌زدن کار: ${t.title}`}
                      className="data-[state=checked]:border-ls-purple data-[state=checked]:bg-ls-purple"
                    />
                    <p
                      className={`min-w-0 flex-1 text-sm font-bold ${
                        done ? "text-white/40 line-through" : "text-white/90"
                      }`}
                    >
                      {t.title}
                    </p>
                    <span
                      className="shrink-0 rounded-full bg-ls-purple/20 px-2 py-0.5 text-[10px] font-bold tabular-nums text-ls-purple-soft"
                      aria-label={`اثر این کار: ${t.impact}`}
                    >
                      {t.impact}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 border-t border-white/5 pt-3 text-[10px] text-white/40">
              هر کار تکمیل‌شده مستقیم روی امتیاز سلامت اثر می‌گذارد
            </p>
          </div>
        </div>

        {/* ── وضعیت قوانین ── */}
        <div>
          <SectionTitle title="وضعیت قوانین" />
          <div
            className="divide-y divide-white/5 rounded-2xl border border-white/5 bg-ls-card p-4"
            aria-label="وضعیت سیاست‌های فروشنده"
          >
            {POLICY_ROWS.map((p) => (
              <div key={p.label} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <ShieldCheck className="h-5 w-5 shrink-0 text-ls-green" aria-hidden />
                <p className="min-w-0 flex-1 text-sm font-bold text-white/85">{p.label}</p>
                <span className="shrink-0 rounded-full border border-ls-green/40 bg-ls-green/15 px-2.5 py-0.5 text-[10px] font-bold text-ls-green">
                  فعال
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── توصیه‌ها ── */}
        <div className="rounded-2xl border border-ls-purple/30 bg-ls-purple/10 p-4">
          <p className="flex items-center gap-1.5 text-sm font-extrabold">
            <Lightbulb className="h-4 w-4 text-ls-purple-soft" aria-hidden />
            چطور بالای ۸۰ بمانیم
          </p>
          <ul className="mt-2.5 space-y-2" aria-label="توصیه‌های حفظ امتیاز سلامت">
            {HEALTH_TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-xs leading-5 text-white/75">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ls-purple-soft" aria-hidden />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
