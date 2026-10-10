"use client";

/* ─────────────────────────────────────────────────────────────
   v1.6.2 — کارت «به‌زودی» مشترک خانه/کاوش (استخراج از HomeView)
   ─ بدون برچسب «قیمت ثابت»/«خرید فوری» — حداکثر یک برچسب وضعیت
   ─ شمارش معکوس نسبی («۲ ساعت دیگر») — لیبل بعد از mount
   ─ یادآوری (toggle) + پیش‌بید اختیاری (فقط حالت مزایده)
   همان کارت در کاوش هم استفاده می‌شود تا ظاهر یکدست بماند.
   ───────────────────────────────────────────────────────────── */

import { Bell, Clock, Gavel } from "lucide-react";
import { AUCTION_ENABLED } from "@/lib/config";
import { SHOW_PHOTO } from "@/lib/data/media";
import type { Show } from "@/lib/data/types";
import { ShowCard } from "@/components/liveshop/shared";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/forced-state";
import { upcomingStartsAt, relativeStartFa } from "./upcoming";

/* ── دکمهٔ toggle یادآوری (span نقش‌محور چون ShowCard خودش button است) ── */
export function ReminderToggle({
  show,
  on,
  onToggle,
}: {
  show: Show;
  on: boolean;
  onToggle: (show: Show) => void;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-pressed={on}
      aria-label={`${on ? "حذف یادآوری" : "فعال‌سازی یادآوری"} برای شو ${show.title}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(show);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onToggle(show);
        }
      }}
      className={cn(
        "mt-1.5 flex w-full cursor-pointer select-none items-center justify-center gap-1 rounded-lg py-1.5 text-center text-[11px] font-bold transition-colors",
        on
          ? "bg-ls-green text-[#04281e]"
          : "border border-ls-pink/50 text-ls-pink hover:bg-ls-pink/10"
      )}
    >
      {!on && <Bell className="h-3 w-3" aria-hidden />}
      {on ? "یادآوری فعال ✓" : "یادآوری"}
    </span>
  );
}

/* ── فوتر کارت شو به‌زودی: شمارش معکوس نسبی + دکمهٔ یادآوری ──
   (لیبل نسبی فقط بعد از mount — بدون hydration mismatch) */
export function UpcomingFooter({
  show,
  reminderOn,
  onToggleReminder,
  onPrebid,
}: {
  show: Show;
  reminderOn: boolean;
  onToggleReminder: (show: Show) => void;
  /** فقط کاوش در حالت مزایده می‌فرستد */
  onPrebid?: (show: Show) => void;
}) {
  const mounted = useMounted();
  const startLabel = mounted
    ? relativeStartFa(upcomingStartsAt(show.id))
    : "به‌زودی";
  return (
    <>
      <div className="mt-1 flex items-center gap-2 rounded-lg bg-ls-card-2 px-2.5 py-1.5 text-[11px]">
        <Clock className="w-3 h-3 shrink-0 text-ls-pink" aria-hidden />
        <span className="font-bold text-white/80">{startLabel}</span>
        {onPrebid && (
          <span
            role="button"
            tabIndex={0}
            aria-label={`ثبت پیش‌بید برای شو ${show.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onPrebid(show);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onPrebid(show);
              }
            }}
            className={cn(
              "mr-auto inline-flex cursor-pointer items-center gap-1 rounded-md border border-ls-purple/40 bg-ls-purple/10 px-2 py-0.5 text-[10px] font-bold text-ls-purple-soft transition-colors hover:bg-ls-purple/20",
              !AUCTION_ENABLED && "hidden"
            )}
          >
            <Gavel className="w-3 h-3" aria-hidden />
            پیش‌بید
          </span>
        )}
      </div>
      <ReminderToggle show={show} on={reminderOn} onToggle={onToggleReminder} />
    </>
  );
}

/**
 * کارت «به‌زودی» — همان کارت خانه: بدون برچسب قیمت ثابت، بدون زمان
 * مطلق (شمارش نسبی در فوتر)، عکس کاور و یادآوری.
 */
export function UpcomingShowCard({
  show,
  reminderOn,
  onToggleReminder,
  onClick,
  onPrebid,
}: {
  show: Show;
  reminderOn: boolean;
  onToggleReminder: (show: Show) => void;
  onClick?: () => void;
  onPrebid?: (show: Show) => void;
}) {
  const cleaned: Show = {
    ...show,
    startsAtLabel: undefined,
    tags: show.tags.filter((t) => t !== "قیمت ثابت" && t !== "خرید فوری"),
  };
  return (
    <ShowCard
      compact
      show={cleaned}
      photo={SHOW_PHOTO[show.id]}
      onClick={onClick}
      footer={
        <UpcomingFooter
          show={cleaned}
          reminderOn={reminderOn}
          onToggleReminder={onToggleReminder}
          onPrebid={onPrebid}
        />
      }
    />
  );
}
