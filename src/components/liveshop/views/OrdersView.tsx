"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageOpen, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { faNum } from "@/lib/format";
import { faIncludes } from "@/lib/persian";
import {
  ORDER_TABS,
  orderMatchesTab,
  ORDER_STATUS_LABEL,
  type OrderTabId,
} from "@/lib/order-state";
import { useAppStore } from "@/store/app-store";
import { useOrdersStore } from "@/store/orders-store";
import {
  getForcedOrderStage,
  useForcedOrderStage,
} from "@/lib/forced-state";
import { ORDER_STAGE_KEY_TO_STATUS } from "@/lib/order-state";
import type { Order } from "@/lib/data/types";
import { SectionTitle, EmptyState, GradientCover, Price } from "@/components/liveshop/shared";
import { DayLabel, OrderStatusBadge } from "@/components/liveshop/order-ui";

/* ═══════════════════════════════════════════════════════════════════════════
   v1.8.0 — فهرست سفارش‌ها (نمای خریدار)
   ─ عکس اصلی کالا (نه ایموجی)، عنوان تا ۲ خط بدون «…»
   ─ تاریخ شمسی، مبلغ، برچسب وضعیت روشن فارسی با آیکون
   ─ تب‌ها: همه / جاری / تحویل‌شده / لغو و مسترد با شمارش
   ─ جستجو بر اساس شمارهٔ سفارش یا نام کالا (نرمال‌سازی فارسی)
   ─ کلید دموی ?orderStage= برای دیدن هر ۶ مرحله و گرفتن عکس
   ═══════════════════════════════════════════════════════════════════════════ */

export default function OrdersView() {
  const orders = useOrdersStore((s) => s.orders);
  const openOrder = useAppStore((s) => s.openOrder);
  const setRoot = useAppStore((s) => s.setRoot);

  const [tab, setTab] = useState<OrderTabId>("all");
  const [query, setQuery] = useState("");

  /* کلید دمو — فهرست را به یک مرحله قفل می‌کند */
  const stageKey = useForcedOrderStage();
  const forcedStatus = stageKey ? ORDER_STAGE_KEY_TO_STATUS[stageKey] : null;

  /* حالت عادی پیش از هر چیز: آزادسازی خودکار سفارش‌های سررسیدشده */
  useEffect(() => {
    if (!getForcedOrderStage()) {
      useOrdersStore.getState().autoReleaseTick();
    }
  }, []);

  const filtered = useMemo(() => {
    let list: Order[] = orders;
    if (forcedStatus) list = list.filter((o) => o.status === forcedStatus);
    if (tab !== "all") list = list.filter((o) => orderMatchesTab(o.status, tab));
    const q = query.trim();
    if (q) {
      list = list.filter(
        (o) => faIncludes(o.itemTitle, q) || faIncludes(o.id, q)
      );
    }
    return list;
  }, [orders, tab, query, forcedStatus]);

  const counts = useMemo(() => {
    const base = forcedStatus
      ? orders.filter((o) => o.status === forcedStatus)
      : orders;
    const c: Record<OrderTabId, number> = {
      all: base.length,
      active: 0,
      delivered: 0,
      closed: 0,
    };
    for (const o of base) {
      for (const t of ORDER_TABS) {
        if (t.id !== "all" && orderMatchesTab(o.status, t.id)) {
          c[t.id] += 1;
        }
      }
    }
    return c;
  }, [orders, forcedStatus]);

  const searching = query.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col" aria-label="سفارش‌های من">
      <div className="px-4 pt-4">
        <SectionTitle
          title="سفارش‌های من"
          action={
            <span className="rounded-full bg-ls-card-2 px-2.5 py-1 text-[11px] font-bold text-white/60 tabular-nums">
              {faNum(filtered.length)} سفارش
            </span>
          }
        />

        {/* جستجو: شمارهٔ سفارش یا نام کالا */}
        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی شمارهٔ سفارش یا نام کالا…"
            aria-label="جستجو در سفارش‌ها"
            className="h-10 w-full rounded-xl border border-white/10 bg-ls-card-2 pr-9 pl-3 text-sm outline-none placeholder:text-white/35 focus:border-ls-purple/60"
          />
        </div>

        {/* تب‌ها با شمارش */}
        <div
          className="mb-4 flex items-center gap-2"
          role="tablist"
          aria-label="فیلتر سفارش‌ها"
        >
          {ORDER_TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t.id
                  ? "bg-ls-purple text-white"
                  : "bg-ls-card-2 text-white/70 hover:text-white hover:bg-ls-line"
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                  tab === t.id ? "bg-white/20" : "bg-white/10 text-white/50"
                )}
              >
                {faNum(counts[t.id])}
              </span>
            </button>
          ))}
        </div>

        {/* بنر حالت دمو — فقط با کلید ?orderStage= */}
        {stageKey && (
          <p
            className="mb-3 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-[11px] font-bold text-amber-300"
            role="note"
            aria-label={`حالت دمو — نمایش مرحلهٔ ${ORDER_STATUS_LABEL[forcedStatus!]}`}
          >
            حالت دمو — همهٔ سفارش‌ها در مرحلهٔ «
            {ORDER_STATUS_LABEL[forcedStatus!]}»
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        searching ? (
          <EmptyState
            lucide={SearchX}
            title="چیزی پیدا نشد"
            desc="شمارهٔ سفارش یا نام کالا را دقیق‌تر بنویس."
          />
        ) : tab !== "all" ? (
          <EmptyState
            lucide={PackageOpen}
            title={
              tab === "closed"
                ? "سفارش لغو یا مسترد‌شده نداری"
                : tab === "delivered"
                  ? "هنوز سفارشی تحویل نشده"
                  : "سفارش جاری نداری"
            }
            desc="وقتی در لایو خرید کنی، سفارش‌هایت اینجا دیده می‌شود."
            action={
              <button
                onClick={() => setRoot("explore")}
                className="h-10 rounded-xl bg-ls-purple px-5 text-sm font-extrabold text-white transition-transform active:scale-[.98]"
                aria-label="رفتن به کاوش"
              >
                رفتن به کاوش
              </button>
            }
          />
        ) : (
          <EmptyState
            lucide={PackageOpen}
            title="هنوز سفارشی نداری"
            desc="وقتی در لایو خرید کنی، سفارش‌هایت اینجا دیده می‌شود."
            action={
              <button
                onClick={() => setRoot("explore")}
                className="h-10 rounded-xl bg-ls-purple px-5 text-sm font-extrabold text-white transition-transform active:scale-[.98]"
                aria-label="رفتن به کاوش"
              >
                رفتن به کاوش
              </button>
            }
          />
        )
      ) : (
        <div className="flex-1 space-y-2.5 px-4 pb-4">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={() => openOrder(o.id)}
              className={cn(
                "w-full rounded-2xl bg-ls-card border border-white/5 p-3 text-right",
                "transition-colors hover:border-ls-purple/40 active:scale-[.99]"
              )}
              aria-label={`مشاهدهٔ سفارش ${o.itemTitle} با شمارهٔ ${o.id}`}
            >
              <div className="flex items-start gap-3">
                {/* عکس اصلی کالا — نه ایموجی */}
                <GradientCover
                  cover={o.cover}
                  photo={o.photo}
                  className="h-16 w-16 shrink-0 rounded-xl"
                  emojiClassName="text-2xl"
                  sizes="128px"
                />
                <div className="min-w-0 flex-1">
                  {/* عنوان تا ۲ خط — بدون «…» (شکستن و برش بی‌نقطه) */}
                  <p className="max-h-10 overflow-hidden break-words text-sm font-bold leading-5">
                    {o.itemTitle}
                  </p>
                  <p className="mt-0.5 break-words text-[11px] text-white/50">
                    {o.sellerName}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <DayLabel ms={o.createdAtMs} className="text-[10px] text-white/40" />
                    <span
                      className="text-[10px] text-white/35 tabular-nums"
                      aria-label={`شمارهٔ سفارش ${o.id}`}
                    >
                      سفارش #{o.id}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Price amount={o.total} className="text-sm" />
                  <OrderStatusBadge status={o.status} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
