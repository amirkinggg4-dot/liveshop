"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   HomeView — صفحهٔ خانه (بازطراحی v1.3.2)
   ─ ردیف «همین حالا زنده» با دایره‌های استوری و حلقهٔ رنگی (جدید)
   ─ چیپ‌های دسته‌بندی کوچک‌تر با اسکرول افقی روان
   ─ فید لایو دوسطحی (گرید ۲ ستونه، کارت عمودی ۴:۵ با عکس تمام‌کارت — LiveGridCard)
   ─ کارت‌های «به‌زودی» با عکس واقعی (بدون ایموجی بزرگ) + یادآوری
   ─ تب‌بار پایین: safe-area و عدم هم‌پوشانی در AppShell رعایت شده است
   قواعد طلایی: منطق/استور/دیتا دست نخورد — فقط چیدمان و ظاهر (فاز ۱ حفظ شد).
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import Image from "next/image";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { faNum } from "@/lib/format";
import { CATEGORIES } from "@/lib/data/categories";
import { LIVE_SHOWS, UPCOMING_SHOWS, getSeller } from "@/lib/data/shows";
import { SELLER_PHOTO, SHOW_PHOTO } from "@/lib/data/media";
import {
  ShowCard,
  LiveGridCard,
  SectionTitle,
  Chip,
} from "@/components/liveshop/shared";
import type { Show } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type HomeTab = "forYou" | "following";

/* ── v1.3.2 — دایرهٔ استوری «همین حالا زنده» با حلقهٔ رنگی برند ── */
function StoryBubble({
  show,
  onOpen,
}: {
  show: Show;
  onOpen: (id: string) => void;
}) {
  const seller = getSeller(show.sellerId);
  const photo = SELLER_PHOTO[show.sellerId];
  return (
    <button
      onClick={() => onOpen(show.id)}
      className="flex w-[68px] shrink-0 flex-col items-center gap-1"
      aria-label={`ورود به شو زندهٔ ${seller.name}`}
    >
      <span
        className="relative h-[68px] w-[68px] rounded-full p-[2.5px]"
        style={{
          background:
            "conic-gradient(from 210deg, #6C5CFF, #FF3B8B, #00C896, #6C5CFF)",
        }}
      >
        <span className="relative block h-full w-full overflow-hidden rounded-full border-[2.5px] border-ls-bg">
          {photo ? (
            <Image
              src={photo}
              alt=""
              fill
              sizes="68px"
              className="object-cover"
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center text-xl"
              style={{ backgroundColor: `${seller.color}33` }}
              aria-hidden
            >
              {seller.emoji}
            </span>
          )}
        </span>
        {/* نشان کوچک «زنده» روی حلقه */}
        <span className="absolute -bottom-0.5 left-1/2 flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap rounded-full bg-[#FF3B5C] px-1.5 py-px text-[8px] font-black text-white shadow-md ring-1 ring-ls-bg">
          <span
            className="h-1 w-1 rounded-full bg-white animate-ls-pulse"
            aria-hidden
          />
          زنده
        </span>
      </span>
      <span className="w-full truncate text-center text-[10px] font-bold text-white/75">
        {seller.name}
      </span>
    </button>
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
        <span className="font-bold text-white/80">
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
        <p className="text-sm text-white/65 mt-1">
          امشب {faNum(LIVE_SHOWS.length)} شو زنده داریم!
        </p>
      </header>

      {/* v1.3.2 — ردیف «همین حالا زنده»: دایره‌های استوری با حلقهٔ رنگی */}
      <section aria-label="همین حالا زنده" className="space-y-2">
        <SectionTitle title="همین حالا زنده" icon="🔴" />
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {LIVE_SHOWS.map((s) => (
            <StoryBubble key={s.id} show={s} onOpen={openShow} />
          ))}
        </div>
      </section>

      {/* چیپ‌های دسته‌بندی — v1.3.2: کوچک‌تر + اسکرول افقی روان */}
      <nav
        className="flex snap-x gap-2 overflow-x-auto no-scrollbar"
        aria-label="دسته‌بندی‌های خرید"
      >
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            onClick={() => setRoot("explore")}
            className="shrink-0 snap-start px-2.5 py-1 text-[11px]"
          >
            <span aria-hidden>{c.emoji}</span>
            {c.label}
          </Chip>
        ))}
      </nav>

      {/* شوهای زندهٔ داغ — v1.3.2: گرید دوسطحی کارت عمودی ۴:۵ */}
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
                : "bg-ls-card-2 text-white/70 hover:text-white"
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
                : "bg-ls-card-2 text-white/70 hover:text-white"
            )}
          >
            دنبال‌شده‌ها
          </button>
        </div>

        {visibleLiveShows.length > 0 ? (
          /* v1.3.2 — گرید ۲ ستونه؛ عرض هر کارت در ۳۹۰px ≈ ۱۷۳px، نسبت ۴:۵ */
          <div className="grid grid-cols-2 gap-3">
            {visibleLiveShows.map((show) => (
              <LiveGridCard
                key={show.id}
                show={show}
                onClick={() => openShow(show.id)}
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
            <p className="mt-1 text-xs leading-6 text-white/60">
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

      {/* به‌زودی — v1.3.2: کاور با عکس واقعی به‌جای ایموجی بزرگ */}
      <section aria-label="شوهای به‌زودی">
        <SectionTitle title="به‌زودی" icon="🕒" />
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mb-1">
          {UPCOMING_SHOWS.map((show) => (
            <div key={show.id} className="w-[190px] shrink-0">
              <ShowCard
                compact
                show={show}
                photo={SHOW_PHOTO[show.id]}
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
          <p className="text-xs leading-6 text-white/65">
            در شوهای زنده، کالاها یکی‌یکی مزایده می‌شوند. تایمر را دنبال کن و
            بید بده؛ اگر بالاترین بید را داشته باشی، همان لحظه کالا برای تو
            ثبت می‌شود!
          </p>
        </div>
      </section>
    </div>
  );
}
