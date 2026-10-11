"use client";

import { useEffect } from "react";
import {
  ArrowLeft,
  CalendarPlus,
  Clock3,
  Eye,
  PackageCheck,
  ShoppingBag,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { faClock, faNum, toman } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import { useLiveStore } from "@/store/live-store";
import { EmptyState, PageHeader } from "@/components/liveshop/shared";

/* ─────────────────────────────────────────────────────────────
   v1.7.0 — گزارش پایان لایو (بخش ۶ قرارداد API: POST /seller/shows/:id/end)
   بعد از «پایان پخش» در داشبورد زندهٔ فروشنده ساخته می‌شود:
   مدت، اوج بیننده، تعداد و مبلغ فروش، پرفروش‌ترین کالا، سفارش‌های جدید
   + دکمه‌های «رفتن به سفارش‌ها» و «ساخت شوی بعدی».
   ───────────────────────────────────────────────────────────── */

function ReportRow({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  tone?: "default" | "green" | "purple";
}) {
  const toneCls = {
    default: "text-white",
    green: "text-ls-green",
    purple: "text-ls-purple-soft",
  } as const;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-ls-card-2 p-3">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          tone === "green"
            ? "bg-ls-green/15 text-ls-green"
            : tone === "purple"
              ? "bg-ls-purple/15 text-ls-purple-soft"
              : "bg-white/10 text-white/70"
        )}
        aria-hidden
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-white/50">{label}</p>
        <p
          className={cn(
            "mt-0.5 text-sm font-black tabular-nums",
            toneCls[tone]
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function SellerLiveReportView() {
  const back = useAppStore((s) => s.back);
  const push = useAppStore((s) => s.push);
  const setRoot = useAppStore((s) => s.setRoot);
  const report = useLiveStore((s) => s.lastReport);

  /* عنوان صفحه برای دسترس‌پذیری */
  useEffect(() => {
    document.title = "گزارش پایان لایو — LiveShop";
  }, []);

  return (
    <div className="flex-1 flex flex-col" aria-label="گزارش پایان لایو">
      <PageHeader
        title="گزارش پایان لایو"
        subtitle={report ? report.showTitle : "خلاصهٔ این پخش"}
        onBack={back}
      />

      <div className="px-4 pt-4 pb-8 space-y-4">
        {!report ? (
          <EmptyState
            emoji="📊"
            title="گزارشی ساخته نشده"
            desc="بعد از پایان پخش زنده، خلاصهٔ این‌جا نمایش داده می‌شود."
          />
        ) : (
          <>
            {/* سرصفحهٔ گزارش */}
            <section
              aria-label="خلاصهٔ پخش"
              className="rounded-2xl border border-ls-purple/30 bg-gradient-to-l from-ls-purple/15 to-ls-pink/10 p-4"
            >
              <p className="text-[11px] text-white/55">
                پخش «{report.showTitle}» تمام شد — خلاصهٔ عملکرد:
              </p>
              <p className="mt-1 text-[10px] text-white/40 tabular-nums">
                پایان: {report.endedAtLabel}
              </p>
            </section>

            {/* ردیف‌های گزارش */}
            <section
              aria-label="آمار پخش"
              className="space-y-2"
            >
              <ReportRow
                icon={Clock3}
                label="مدت پخش"
                value={`${faClock(report.durationSec)} پخش زنده`}
              />
              <ReportRow
                icon={Eye}
                label="اوج بینندهٔ همزمان"
                value={`${faNum(report.peakViewers)} نفر`}
              />
              <ReportRow
                icon={ShoppingBag}
                label="فروش این پخش"
                value={`${faNum(report.salesCount)} عدد · ${toman(report.salesAmount)}`}
                tone="green"
              />
              <ReportRow
                icon={PackageCheck}
                label="سفارش جدید ساخته‌شده"
                value={`${faNum(report.salesCount)} سفارش`}
              />
            </section>

            {/* پرفروش‌ترین کالا */}
            {report.topItem && (
              <section
                aria-label="پرفروش‌ترین کالای این پخش"
                className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/20 text-amber-300">
                    <Trophy className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-amber-300">
                      پرفروش‌ترین کالا
                    </p>
                    <p className="mt-0.5 truncate text-sm font-black">
                      {report.topItem.title}
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs tabular-nums text-white/75">
                  {faNum(report.topItem.qty)} عدد فروخت · {toman(report.topItem.amount)}
                </p>
              </section>
            )}

            {/* دکمه‌های بعدی */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => setRoot("sellerOrders")}
                aria-label="رفتن به سفارش‌ها"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ls-purple py-3.5 text-sm font-black text-white shadow-lg shadow-ls-purple/30 transition-colors hover:bg-ls-purple-deep active:scale-[.99]"
              >
                <PackageCheck className="h-4.5 w-4.5" aria-hidden />
                رفتن به سفارش‌ها
                <ArrowLeft className="h-4 w-4 opacity-70" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => push("sellerSchedule")}
                aria-label="ساخت شوی بعدی"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-ls-pink/50 bg-ls-pink/10 py-3.5 text-sm font-black text-ls-pink transition-colors hover:bg-ls-pink/20 active:scale-[.99]"
              >
                <CalendarPlus className="h-4.5 w-4.5" aria-hidden />
                ساخت شوی بعدی
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
