"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { faNum } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import { useOrdersStore } from "@/store/orders-store";
import type { Order } from "@/lib/data/types";
import {
  GradientCover,
  Chip,
  Price,
  SectionTitle,
  EmptyState,
} from "@/components/liveshop/shared";

type OrderFilter = "all" | "active" | "done";

const FILTERS: { id: OrderFilter; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "active", label: "جاری" },
  { id: "done", label: "تحویل‌شده" },
];

function isDelivered(o: Order) {
  return o.timeline.every((st) => st.done);
}

/** وضعیت نمایشی سفارش: برچسب اولین مرحلهٔ انجام‌نشده یا «تحویل شد» */
function OrderStatusChip({ order }: { order: Order }) {
  const pending = order.timeline.find((st) => !st.done);
  if (pending) {
    return (
      <span className="inline-flex items-center rounded-full border border-ls-pink/50 px-2 py-0.5 text-[10px] font-bold text-ls-pink whitespace-nowrap">
        {pending.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-ls-green/15 border border-ls-green/40 px-2 py-0.5 text-[10px] font-bold text-ls-green whitespace-nowrap">
      تحویل شد
    </span>
  );
}

export default function OrdersView() {
  const orders = useOrdersStore((s) => s.orders);
  const openOrder = useAppStore((s) => s.openOrder);
  const setRoot = useAppStore((s) => s.setRoot);

  const [filter, setFilter] = useState<OrderFilter>("all");

  const filtered = orders.filter((o) => {
    if (filter === "active") return !isDelivered(o);
    if (filter === "done") return isDelivered(o);
    return true;
  });

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

        {/* چیپ‌های فیلتر */}
        <div className="flex items-center gap-2 mb-4" role="tablist" aria-label="فیلتر سفارش‌ها">
          {FILTERS.map((f) => (
            <Chip
              key={f.id}
              active={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="📦"
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
      ) : (
        <div className="flex-1 space-y-2.5 px-4 pb-4">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={() => openOrder(o.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-2xl bg-ls-card border border-white/5 p-3 text-right",
                "transition-colors hover:border-ls-purple/40 active:scale-[.99]"
              )}
              aria-label={`مشاهدهٔ سفارش ${o.itemTitle} با شمارهٔ ${o.id}`}
            >
              <GradientCover
                cover={o.cover}
                className="w-14 h-14 rounded-xl shrink-0"
                emojiClassName="text-2xl"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{o.itemTitle}</p>
                <p className="text-xs text-white/50 truncate">{o.sellerName}</p>
                <p className="mt-0.5 text-[11px] text-white/35 tabular-nums">
                  سفارش #{o.id}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Price amount={o.total} className="text-sm" />
                <OrderStatusChip order={o} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
