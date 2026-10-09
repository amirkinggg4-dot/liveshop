"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { faNum } from "@/lib/format";
import type { InboxKind, InboxNotification } from "@/lib/data/buyer-p1";
import { getInboxKindMeta } from "@/lib/data/buyer-p1";
import { useAppStore } from "@/store/app-store";
import { useInboxStore, selectUnreadCount } from "@/store/inbox-store";
import { EmptyState, PageHeader } from "@/components/liveshop/shared";

/* ─────────────────────────────────────────────────────────────
   صندوق ورودی — فاز ۳ (Atlas تصویر ۲۰)
   اعلان‌های خریدار با فیلتر دسته‌ای (همه/مزایده‌ها/سفارش‌ها/فالو/سیستم)،
   نقطهٔ ناخواندهٔ سبز، خواندن با کلیک و «خواندن همه».
   ───────────────────────────────────────────────────────────── */

type FilterId = "all" | "auction" | "orders" | "follow" | "system";

/* نگاشت دسته‌ها به kindهای اعلان برای فیلتر */
const FILTERS: Array<{ id: FilterId; label: string; kinds: InboxKind[] }> = [
  {
    id: "all",
    label: "همه",
    kinds: ["bid", "win", "payment", "shipping", "follow", "tip", "system"],
  },
  { id: "auction", label: "مزایده‌ها", kinds: ["bid", "win"] },
  { id: "orders", label: "سفارش‌ها", kinds: ["payment", "shipping"] },
  { id: "follow", label: "فالو", kinds: ["follow", "tip"] },
  { id: "system", label: "سیستم", kinds: ["system"] },
];

function matchesFilter(n: InboxNotification, f: FilterId): boolean {
  const def = FILTERS.find((x) => x.id === f);
  return def ? def.kinds.includes(n.kind) : true;
}

export default function InboxView() {
  const back = useAppStore((s) => s.back);
  const notifications = useInboxStore((s) => s.notifications);
  const markRead = useInboxStore((s) => s.markRead);
  const markAllRead = useInboxStore((s) => s.markAllRead);
  const unreadCount = useInboxStore(selectUnreadCount);

  const [filter, setFilter] = useState<FilterId>("all");

  const countOf = (f: FilterId) =>
    notifications.filter((n) => matchesFilter(n, f)).length;
  const visible = notifications.filter((n) => matchesFilter(n, filter));

  const onMarkAll = () => {
    if (unreadCount === 0) {
      toast("ناخوانده‌ای نداری");
      return;
    }
    markAllRead();
    toast.success("همهٔ اعلان‌ها خوانده شد ✅");
  };

  return (
    <div className="flex flex-1 flex-col" aria-label="صندوق ورودی">
      <PageHeader
        title="صندوق ورودی"
        subtitle={
          unreadCount > 0
            ? `${faNum(unreadCount)} ناخوانده`
            : "همه خوانده شده"
        }
        onBack={back}
        trailing={
          <button
            type="button"
            onClick={onMarkAll}
            className="shrink-0 text-xs font-bold text-ls-purple-soft transition-colors hover:text-white"
            aria-label="خواندن همهٔ اعلان‌ها"
          >
            خواندن همه
          </button>
        }
      />

      <div className="px-4 py-4">
        {/* ── چیپ‌های فیلتر با شمارنده ── */}
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
          role="tablist"
          aria-label="فیلتر دستهٔ اعلان‌ها"
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                  active
                    ? "bg-ls-purple text-white"
                    : "bg-ls-card-2 text-white/60 hover:text-white hover:bg-ls-line"
                )}
                aria-label={`نمایش اعلان‌های ${f.label} — ${faNum(countOf(f.id))} اعلان`}
              >
                {f.label} ({faNum(countOf(f.id))})
              </button>
            );
          })}
        </div>

        {/* ── لیست اعلان‌ها ── */}
        {visible.length === 0 ? (
          <EmptyState
            emoji="📭"
            title="اعلانی اینجا نیست"
            desc="اعلان‌های مزایده، سفارش و فروشنده‌ها اینجا جمع می‌شوند."
          />
        ) : (
          <ul
            className="mt-3 max-h-[520px] space-y-2 overflow-y-auto scroll-thin pl-1"
            aria-label="فهرست اعلان‌ها"
          >
            {visible.map((n) => {
              const meta = getInboxKindMeta(n.kind);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-right transition-colors hover:bg-white/5",
                      n.unread
                        ? "border-ls-purple/30 bg-ls-card"
                        : "border-white/5 bg-ls-card"
                    )}
                    aria-label={`${n.unread ? "اعلان ناخوانده" : "اعلان"}: ${n.title} — دستهٔ ${meta.label}`}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                      style={{ backgroundColor: `${n.color}22` }}
                      aria-hidden
                    >
                      {n.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "truncate text-xs",
                            n.unread ? "font-black" : "font-bold text-white/80"
                          )}
                        >
                          {n.title}
                        </span>
                        {n.unread && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-ls-green"
                            aria-label="ناخوانده"
                          />
                        )}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-white/60 line-clamp-2">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[10px] text-white/35">
                        {n.atLabel}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
