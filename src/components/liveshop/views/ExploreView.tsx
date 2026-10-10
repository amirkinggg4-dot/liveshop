"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Clock, Gavel } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";
import { useExploreIntentStore } from "@/store/explore-intent-store";
import { faNum } from "@/lib/format";
import { SHOWS, SELLERS, LIVE_SHOWS, UPCOMING_SHOWS } from "@/lib/data/shows";
import { CATEGORIES } from "@/lib/data/categories";
import type { Category, Show } from "@/lib/data/types";
import {
  ShowCard,
  SectionTitle,
  Avatar,
  RatingStars,
  EmptyState,
  CategoryIcon,
  CategoryTile,
} from "@/components/liveshop/shared";
import { SavedSearchesRow } from "@/components/liveshop/saved-searches";
import PreBidSheet from "@/components/liveshop/pre-bid-sheet";
import { cn } from "@/lib/utils";
import { AUCTION_ENABLED } from "@/lib/config";

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

/* ── فاز ۱ — فوتر کارت شو به‌زودی: نوار «شروع: …» + دکمهٔ یادآوری (الگوی یکسان با HomeView) ──
   فاز ۳ (P1) — افزودنی: دکمهٔ «پیش‌بید» در همان ردیف (بدون تغییر بقیهٔ فوتر) */
function UpcomingFooter({
  show,
  reminderOn,
  onToggleReminder,
  onPrebid,
}: {
  show: Show;
  reminderOn: boolean;
  onToggleReminder: (show: Show) => void;
  onPrebid: (show: Show) => void;
}) {
  return (
    <>
      <div className="mt-1 flex items-center gap-2 rounded-lg bg-ls-card-2 px-2.5 py-1.5 text-[11px]">
        <Clock className="w-3 h-3 shrink-0 text-ls-pink" aria-hidden />
        <span className="font-bold text-white/75">
          شروع: {show.startsAtLabel ?? "به‌زودی"}
        </span>
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
      </div>
      <ReminderToggle show={show} on={reminderOn} onToggle={onToggleReminder} />
    </>
  );
}

export default function ExploreView() {
  const openShow = useAppStore((s) => s.openShow);
  /* v1.6.1 — نیت مشترک خانه → کاوش: دستهٔ از پیش انتخاب‌شده + فوکوس جستجو
     (حداقل تغییر: فقط مصرف نیت هنگام mount — بقیهٔ صفحه دست‌نخورده) */
  const intentCategory = useExploreIntentStore((s) => s.category);
  const intentFocusSearch = useExploreIntentStore((s) => s.focusSearch);
  const consumeIntent = useExploreIntentStore((s) => s.consume);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<Category | null>(() =>
    intentCategory
      ? CATEGORIES.find((c) => c.id === intentCategory) ?? null
      : null
  );
  /* فاز ۱ — چیپ «فقط لایوها» (پیش‌فرض مثل baseline: فقط زنده‌ها) */
  const [liveOnly, setLiveOnly] = useState(true);
  /* فاز ۱ — شوهای به‌زودی که یادآوری فعال دارند */
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  /* فاز ۳ (P1) — شیت پیش‌بید برای شو به‌زودی */
  const [prebidShow, setPrebidShow] = useState<Show | null>(null);

  /* v1.6.1 — مصرف یک‌بارهٔ نیت: فوکوس روی ورودی جستجو + پاک‌کردن نیت */
  useEffect(() => {
    if (intentFocusSearch) searchInputRef.current?.focus();
    if (intentCategory || intentFocusSearch) consumeIntent();
  }, []);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const showResults = searching
    ? SHOWS.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      )
    : [];
  const sellerResults = searching
    ? SELLERS.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.handle.toLowerCase().includes(q)
      )
    : [];

  const liveList = activeCat
    ? LIVE_SHOWS.filter((s) => s.category === activeCat.label)
    : LIVE_SHOWS;
  const upcomingList = activeCat
    ? UPCOMING_SHOWS.filter((s) => s.category === activeCat.label)
    : UPCOMING_SHOWS;
  /* فاز ۱ — حالت ادغام: به‌زودی‌ها هم داخل همان لیستِ شوها می‌آیند */
  const mergedList = [...liveList, ...upcomingList];

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

  const sectionTitle = activeCat
    ? activeCat.label
    : liveOnly
      ? "فقط زنده‌ها"
      : "همهٔ شوها";

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8 space-y-5">
      {/* نوار جستجو */}
      <div className="relative">
        <Search
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none"
          aria-hidden
        />
        <Input
          ref={searchInputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی شو، فروشنده و کالا…"
          aria-label="جستجوی شو، فروشنده و کالا"
          className="pr-9 bg-ls-card border-white/10 rounded-xl h-10 text-sm placeholder:text-white/35"
        />
      </div>

      {/* فاز ۳ (P1) — ردیف جستجوهای ذخیره‌شده (تصویر ۱۴) — فقط اضافه‌شده */}
      <SavedSearchesRow
        currentQuery={query.trim() || undefined}
        onPick={(q) => setQuery(q)}
 />

      {searching ? (
        /* ── حالت نتایج جستجو ── */
        <>
          {showResults.length > 0 && (
            <section aria-label="نتایج شوها">
              <SectionTitle title="شوها" icon="🎬" />
              <div className="grid grid-cols-2 gap-3">
                {showResults.map((show) => (
                  <ShowCard
                    key={show.id}
                    compact
                    show={show}
                    onClick={() => openShow(show.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {sellerResults.length > 0 && (
            <section aria-label="نتایج فروشندگان">
              <SectionTitle title="فروشندگان" icon="🛍️" />
              <div className="space-y-2">
                {sellerResults.map((seller) => (
                  <div
                    key={seller.id}
                    className="flex items-center gap-3 bg-ls-card border border-white/5 rounded-2xl p-3"
                  >
                    <Avatar emoji={seller.emoji} color={seller.color} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">
                        {seller.name}{" "}
                        {seller.verified && (
                          <span
                            className="text-ls-purple-soft"
                            title="فروشندهٔ تأییدشده"
                          >
                            ✓
                          </span>
                        )}
                      </p>
                      <p
                        className="text-xs text-white/45 truncate"
                        dir="ltr"
                      >
                        @{seller.handle}
                      </p>
                      <RatingStars
                        rating={seller.rating}
                        count={seller.ratingsCount}
                      />
                    </div>
                    <button
                      onClick={() =>
                        toast(`«${seller.name}» فالو شد ✓`)
                      }
                      aria-label={`فالو ${seller.name}`}
                      className="shrink-0 rounded-full border border-ls-purple/50 text-ls-purple-soft px-3.5 py-1.5 text-xs font-bold hover:bg-ls-purple/10 transition-colors"
                    >
                      فالو
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {showResults.length === 0 && sellerResults.length === 0 && (
            <EmptyState
              emoji="🔍"
              title="نتیجه‌ای پیدا نشد"
              desc={`برای «${query.trim()}» چیزی پیدا نکردیم. عبارت دیگری را امتحان کن.`}
            />
          )}
        </>
      ) : (
        /* ── حالت پیش‌فرض کاوش ── */
        <>
          {activeCat && (
            <button
              onClick={() => setActiveCat(null)}
              aria-label="حذف فیلتر دسته‌بندی"
              className="self-start inline-flex items-center gap-1.5 rounded-full bg-ls-purple text-white px-3 py-1.5 text-xs font-bold hover:bg-ls-purple-deep transition-colors"
            >
              <CategoryIcon id={activeCat.id} className="h-3.5 w-3.5" />
              {activeCat.label}
              <X className="w-3.5 h-3.5" aria-hidden />
            </button>
          )}

          <section aria-label="دسته‌بندی‌ها">
            <SectionTitle title="دسته‌بندی‌ها" icon="🧭" />
            {/* v1.4.1 — کارت‌های کوچک عکس‌دار (بدون ایموجی) در یک ردیف افقی اسکرولی — مثل خانه */}
            <div className="flex snap-x gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {CATEGORIES.map((c) => (
                <CategoryTile
                  key={c.id}
                  id={c.id}
                  label={c.label}
                  subtitle={`${faNum(c.liveCount)} شو زنده`}
                  active={activeCat?.id === c.id}
                  onClick={() => setActiveCat(c)}
                />
              ))}
            </div>
          </section>

          <section aria-label={sectionTitle}>
            <SectionTitle
              title={sectionTitle}
              icon="🔴"
              action={
                /* فاز ۱ — چیپ toggle «فقط لایوها» */
                <button
                  onClick={() => setLiveOnly((v) => !v)}
                  aria-pressed={liveOnly}
                  aria-label={
                    liveOnly
                      ? "نمایش شوهای به‌زودی هم در همین لیست"
                      : "نمایش فقط شوهای زنده"
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                    liveOnly
                      ? "bg-ls-purple text-white"
                      : "bg-ls-card-2 text-white/60 hover:text-white"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      liveOnly ? "bg-white" : "bg-white/40"
                    )}
                    aria-hidden
                  />
                  فقط لایوها
                </button>
              }
            />
            {liveOnly ? (
              /* حالت پیش‌فرض مثل baseline — فقط لایوها */
              liveList.length > 0 ? (
                <div className="space-y-3">
                  {liveList.map((show) => (
                    <ShowCard
                      key={show.id}
                      show={show}
                      onClick={() => openShow(show.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  emoji="🛌"
                  title="الان لایو فعالی در این دسته نیست"
                  desc="به‌زودی شوهای جدید این دسته را از دست نده!"
                />
              )
            ) : (
              /* فاز ۱ — حالت ادغام: زنده‌ها + به‌زودی‌ها در یک لیست */
              mergedList.length > 0 ? (
                <div className="space-y-3">
                  {mergedList.map((show) =>
                    show.status === "upcoming" ? (
                      <ShowCard
                        key={show.id}
                        show={show}
                        onClick={() => openShow(show.id)}
                        footer={
                          <UpcomingFooter
                            show={show}
                            reminderOn={reminders.has(show.id)}
                            onToggleReminder={toggleReminder}
                            onPrebid={setPrebidShow}
                          />
                        }
                      />
                    ) : (
                      <ShowCard
                        key={show.id}
                        show={show}
                        onClick={() => openShow(show.id)}
                      />
                    )
                  )}
                </div>
              ) : (
                <EmptyState
                  emoji="🛌"
                  title="الان لایو فعالی در این دسته نیست"
                  desc="به‌زودی شوهای جدید این دسته را از دست نده!"
                />
              )
            )}
          </section>

          {/* ردیف به‌زودی — فقط در حالت «فقط لایوها» (در حالت ادغام، داخل لیست بالا می‌آیند) */}
          {liveOnly && upcomingList.length > 0 && (
            <section aria-label="شوهای به‌زودی">
              <SectionTitle title="به‌زودی" icon="🕒" />
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mb-1">
                {upcomingList.map((show) => (
                  <div key={show.id} className="w-[190px] shrink-0">
                    <ShowCard
                      compact
                      show={show}
                      onClick={() => openShow(show.id)}
                      footer={
                        <UpcomingFooter
                          show={show}
                          reminderOn={reminders.has(show.id)}
                          onToggleReminder={toggleReminder}
                          onPrebid={setPrebidShow}
                        />
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* فاز ۳ (P1) — شیت پیش‌بید شو به‌زودی — فقط در حالت مزایده */}
      {AUCTION_ENABLED && prebidShow && (
        <PreBidSheet
          key={prebidShow.id}
          show={prebidShow}
          open
          onOpenChange={(v) => {
            if (!v) setPrebidShow(null);
          }}
        />
      )}
    </div>
  );
}
