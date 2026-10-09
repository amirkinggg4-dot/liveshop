"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { faNum, faClock, toman } from "@/lib/format";
import { CATEGORIES } from "@/lib/data/categories";
import { LIVE_SHOWS, UPCOMING_SHOWS } from "@/lib/data/shows";
import { getAuctionItem, getShowItems } from "@/lib/data/items";
import { ShowCard, SectionTitle, Chip } from "@/components/liveshop/shared";
import type { Show } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type HomeTab = "forYou" | "following";

/* ── فاز ۱ — کمترین قیمت خرید فوری یک شو (با گارد آرایهٔ خالی) ── */
function minBuyNowPrice(showId: string): number | null {
  const prices = getShowItems(showId)
    .map((i) => i.buyNowPrice)
    .filter((p): p is number => typeof p === "number");
  return prices.length > 0 ? Math.min(...prices) : null;
}

/* ── فاز ۱ — نوار پیش‌نمایش «بید فعلی + تایمر» یا «خرید فوری از …» روی کارت شو زنده ── */
function LiveBidBar({ show }: { show: Show }) {
  const auction = getAuctionItem(show.id);

  if (auction) {
    const timer = auction.timerSec ?? 0;
    const urgent = timer <= 30;
    return (
      <div className="mt-1 flex items-center gap-2 rounded-lg bg-ls-card-2 px-2.5 py-1.5 text-[11px]">
        <span
          className="w-1.5 h-1.5 shrink-0 rounded-full bg-ls-purple"
          aria-hidden
        />
        <span className="font-bold text-ls-purple-soft">
          بید فعلی {toman(auction.currentBid ?? auction.startPrice)}
        </span>
        <span
          className={cn(
            "ms-auto inline-flex items-center gap-1 font-bold tabular-nums",
            urgent ? "text-[#FF3B5C]" : "text-white/55"
          )}
        >
          <Clock className="w-3 h-3" aria-hidden />
          {faClock(timer)}
        </span>
      </div>
    );
  }

  const min = minBuyNowPrice(show.id);
  if (min == null) return null;
  return (
    <div className="mt-1 flex items-center gap-2 rounded-lg bg-ls-card-2 px-2.5 py-1.5 text-[11px]">
      <span
        className="w-1.5 h-1.5 shrink-0 rounded-full bg-ls-green"
        aria-hidden
      />
      <span className="font-bold text-ls-green">خرید فوری از {toman(min)}</span>
    </div>
  );
}

/* ── فاز ۱ — دکمهٔ toggle یادآوری (span نقش‌محور چون ShowCard خودش button است) ── */
function ReminderToggle({
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
        "mt-1.5 block w-full cursor-pointer select-none rounded-lg py-1.5 text-center text-[11px] font-bold transition-colors",
        on
          ? "bg-ls-green text-[#04281e]"
          : "border border-ls-pink/50 text-ls-pink hover:bg-ls-pink/10"
      )}
    >
      {on ? "یادآوری فعال ✓" : "یادآوری 🔔"}
    </span>
  );
}

/* ── فاز ۱ — فوتر کارت شو به‌زودی: نوار «شروع: …» + دکمهٔ یادآوری ── */
function UpcomingFooter({
  show,
  reminderOn,
  onToggleReminder,
}: {
  show: Show;
  reminderOn: boolean;
  onToggleReminder: (show: Show) => void;
}) {
  return (
    <>
      <div className="mt-1 flex items-center gap-2 rounded-lg bg-ls-card-2 px-2.5 py-1.5 text-[11px]">
        <Clock className="w-3 h-3 shrink-0 text-ls-pink" aria-hidden />
        <span className="font-bold text-white/75">
          شروع: {show.startsAtLabel ?? "به‌زودی"}
        </span>
      </div>
      <ReminderToggle show={show} on={reminderOn} onToggle={onToggleReminder} />
    </>
  );
}

export default function HomeView() {
  const setRoot = useAppStore((s) => s.setRoot);
  const openShow = useAppStore((s) => s.openShow);

  /* فاز ۱ — تب «برای شما / دنبال‌شده‌ها» */
  const [tab, setTab] = useState<HomeTab>("forYou");
  /* فاز ۱ — شوهای به‌زودی که یادآوری فعال دارند */
  const [reminders, setReminders] = useState<Set<string>>(new Set());

  const visibleLiveShows =
    tab === "forYou" ? LIVE_SHOWS : LIVE_SHOWS.filter((s) => s.isFollowing);

  const toggleReminder = (show: Show) => {
    const next = new Set(reminders);
    if (next.has(show.id)) {
      next.delete(show.id);
      toast("یادآوری برداشته شد");
    } else {
      next.add(show.id);
      toast.success("یادآوری فعال شد — ۳۰ دقیقه قبل از شروع خبر می‌دهیم");
    }
    setReminders(next);
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8 space-y-6">
      {/* سربرگ خوش‌آمد */}
      <header>
        <h1 className="text-2xl font-black">سلام علی 👋</h1>
        <p className="text-sm text-white/55 mt-1">
          امشب {faNum(LIVE_SHOWS.length)} شو زنده داریم!
        </p>
      </header>

      {/* چیپ‌های دسته‌بندی */}
      <nav
        className="flex gap-2 overflow-x-auto no-scrollbar"
        aria-label="دسته‌بندی‌های خرید"
      >
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            onClick={() => setRoot("explore")}
            className="shrink-0"
          >
            <span aria-hidden>{c.emoji}</span>
            {c.label}
          </Chip>
        ))}
      </nav>

      {/* شوهای زندهٔ داغ */}
      <section aria-label="شوهای زندهٔ داغ">
        <SectionTitle title="شوهای زندهٔ داغ" icon="🔴" />

        {/* فاز ۱ — تب‌های «برای شما / دنبال‌شده‌ها» */}
        <div className="mb-3 flex gap-2" aria-label="فیلتر شوهای زنده">
          <button
            onClick={() => setTab("forYou")}
            aria-pressed={tab === "forYou"}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
              tab === "forYou"
                ? "bg-ls-purple text-white"
                : "bg-ls-card-2 text-white/60 hover:text-white"
            )}
          >
            برای شما
          </button>
          <button
            onClick={() => setTab("following")}
            aria-pressed={tab === "following"}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
              tab === "following"
                ? "bg-ls-purple text-white"
                : "bg-ls-card-2 text-white/60 hover:text-white"
            )}
          >
            دنبال‌شده‌ها
          </button>
        </div>

        {visibleLiveShows.length > 0 ? (
          <div className="space-y-3">
            {visibleLiveShows.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                onClick={() => openShow(show.id)}
                footer={<LiveBidBar show={show} />}
              />
            ))}
          </div>
        ) : (
          /* فاز ۱ — EmptyState کوچک برای تب «دنبال‌شده‌ها»ی خالی */
          <div className="rounded-2xl bg-ls-card border border-white/5 px-6 py-8 text-center">
            <span className="text-3xl" aria-hidden>
              🫥
            </span>
            <p className="mt-2 text-sm font-bold">
              هنوز فروشنده‌ای را دنبال نکرده‌ای
            </p>
            <p className="mt-1 text-xs leading-6 text-white/50">
              از صفحهٔ کاوش فروشنده‌های موردعلاقه‌ات را فالو کن تا لایوهایشان
              اینجا نمایش داده شود.
            </p>
            <button
              onClick={() => setRoot("explore")}
              aria-label="رفتن به صفحهٔ کاوش"
              className="mt-3 rounded-full bg-ls-purple px-4 py-1.5 text-xs font-bold text-white hover:bg-ls-purple-deep transition-colors"
            >
              رفتن به کاوش
            </button>
          </div>
        )}
      </section>

      {/* به‌زودی */}
      <section aria-label="شوهای به‌زودی">
        <SectionTitle title="به‌زودی" icon="🕒" />
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mb-1">
          {UPCOMING_SHOWS.map((show) => (
            <div key={show.id} className="w-[190px] shrink-0">
              <ShowCard
                compact
                show={show}
                onClick={() =>
                  toast("این شو هنوز شروع نشده — یادآوری فعال می‌شود")
                }
                footer={
                  <UpcomingFooter
                    show={show}
                    reminderOn={reminders.has(show.id)}
                    onToggleReminder={toggleReminder}
                  />
                }
              />
            </div>
          ))}
        </div>
      </section>

      {/* بنر معرفی — چطور کار می‌کنه؟ */}
      <section
        aria-label="چطور کار می‌کنه"
        className="rounded-2xl p-px bg-gradient-to-l from-ls-purple via-ls-pink to-ls-purple shadow-lg shadow-ls-purple/20"
      >
        <div className="bg-ls-card rounded-[calc(1rem-1px)] p-4 space-y-3">
          <h2 className="font-extrabold text-sm">✨ چطور کار می‌کنه؟</h2>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className="bg-ls-card-2 rounded-lg px-2.5 py-1.5">
              ۱. شو رو ببین
            </span>
            <span className="text-ls-pink" aria-hidden>
              ←
            </span>
            <span className="bg-ls-card-2 rounded-lg px-2.5 py-1.5">
              ۲. بید بده
            </span>
            <span className="text-ls-pink" aria-hidden>
              ←
            </span>
            <span className="bg-ls-card-2 rounded-lg px-2.5 py-1.5 text-ls-green">
              ۳. برنده شو!
            </span>
          </div>
          <p className="text-xs leading-6 text-white/55">
            در شوهای زنده، کالاها یکی‌یکی مزایده می‌شوند. تایمر را دنبال کن و
            بید بده؛ اگر بالاترین بید را داشته باشی، همان لحظه کالا برای تو
            ثبت می‌شود!
          </p>
        </div>
      </section>
    </div>
  );
}
