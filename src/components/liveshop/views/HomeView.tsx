"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   HomeView — صفحهٔ خانه (بازطراحی v1.6.1)
   ─ کارت لایو: عنوان ≤۲ خط، قیمت در ردیف جدا و همیشه کامل، نشان موجودی زیر قیمت
   ─ کاشی دسته‌بندی: لمس → کاوش با همان دستهٔ از پیش انتخاب‌شده (store مشترک)
     + کاشی «همه»
   ─ نوار بالا: دکمهٔ جستجو (→ کاوش با فوکوس روی ورودی) + زنگ اعلان با شمارندهٔ
     ناخوانده از استور صندوق ورودی
   ─ کارت «به‌زودی»: بدون برچسب «قیمت ثابت» (حداکثر یک برچسب وضعیت مثل «امضادار»)،
     شمارش معکوس نسبی («۲ ساعت دیگر»)، لمس → شیت پیش‌نمایش (کاور، فروشنده،
     کالاهای برنامه‌ریزی‌شده با قیمت، یادآوری)، اسکرول افقی snap با دیدن کارت بعد
   ─ حالت‌ها: skeleton استوری‌ها و کارت‌ها، خطا با «تلاش دوباره»، بنر آفلاین
     (navigator.onLine)، «الان لایوی نیست» با پیشنهاد شوهای آینده — کلید mock
     ‏?state=loading|error|empty همه را برای اسکرین‌شات قابل دیدن می‌کند
   ─ ایموجی‌های عنوان بخش‌ها و EmptyState با آیکون lucide یکدست شده
   ─ بنر «چطور کار می‌کنه؟» دکمهٔ بستن دارد و بعد از بستن دیگر نمی‌آید
     (localStorage با try/catch)
   ─ لایهٔ داده: useLiveShows و useCategories (React Query — cursor pagination
     با بارگذاری بیشتر هنگام اسکرول؛ NEXT_PUBLIC_USE_API=true → API واقعی)
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  Bell,
  ChevronLeft,
  Clock,
  Flame,
  Hand,
  LayoutGrid,
  Radio,
  RotateCcw,
  Search,
  Sparkles,
  TriangleAlert,
  UserRoundPlus,
  VideoOff,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/app-store";
import { useInboxStore, selectUnreadCount } from "@/store/inbox-store";
import { useExploreIntentStore } from "@/store/explore-intent-store";
import { faNum } from "@/lib/format";
import { UPCOMING_SHOWS, getSeller } from "@/lib/data/shows";
import { SELLER_PHOTO, SHOW_PHOTO } from "@/lib/data/media";
import {
  ShowCard,
  LiveGridCard,
  SectionTitle,
  CategoryTile,
  EmptyState,
} from "@/components/liveshop/shared";
import { useLiveShows } from "@/hooks/useLiveShows";
import { useCategories } from "@/hooks/useCategories";
import UpcomingPreviewSheet from "./home/upcoming-preview-sheet";
import { upcomingStartsAt, relativeStartFa } from "./home/upcoming";
import type { Show } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type HomeTab = "forYou" | "following";
type ForceState = "loading" | "error" | "empty";

/* ── کلید localStorage بنر «چطور کار می‌کنه؟» (v1.6.1) ── */
const HOW_IT_WORKS_KEY = "liveshop.how-it-works.dismissed.v1";

/* ─────────────────────────────────────────────────────────────
   v1.6.1 — استورهای بیرونی کوچک (الگوی useSyncExternalStore):
   ‏۱) کلید mock ‏?state=  ۲) وضعیت بسته‌شدن بنر (localStorage)
   ‏۳) آنلاین/آفلاین (navigator.onLine) — بدون setState داخل effect
   ───────────────────────────────────────────────────────────── */

const noopSubscribe = () => () => {};

/** mounted؟ — برای متن‌های وابسته به زمان (بدون hydration mismatch):
    سرور/آب‌رسانی «به‌زودی» می‌بیند و بعد از mount لیبل نسبی واقعی می‌آید */
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/** خواندن و پاک‌کردن کلید mock ‏?state= از URL (بدون رفرش صفحه) */
const forcedStateStore = {
  listeners: new Set<() => void>(),
  notify() {
    this.listeners.forEach((l) => l());
  },
  subscribe(cb: () => void) {
    forcedStateStore.listeners.add(cb);
    return () => forcedStateStore.listeners.delete(cb);
  },
  getSnapshot(): ForceState | null {
    try {
      const s = new URLSearchParams(window.location.search).get("state");
      return s === "loading" || s === "error" || s === "empty" ? s : null;
    } catch {
      return null;
    }
  },
  getServerSnapshot(): ForceState | null {
    return null;
  },
  /** پاک‌کردن کلید mock (دکمهٔ «تلاش دوباره») */
  clear() {
    try {
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      /* noop */
    }
    forcedStateStore.notify();
  },
};

/** بنر «چطور کار می‌کنه؟» — خواندن/نوشتن localStorage با try/catch + اطلاع‌رسانی */
const howItWorksStore = {
  listeners: new Set<() => void>(),
  notify() {
    this.listeners.forEach((l) => l());
  },
  subscribe(cb: () => void) {
    const on = () => cb();
    howItWorksStore.listeners.add(cb);
    window.addEventListener("liveshop:how-it-works", on);
    window.addEventListener("storage", on);
    return () => {
      howItWorksStore.listeners.delete(cb);
      window.removeEventListener("liveshop:how-it-works", on);
      window.removeEventListener("storage", on);
    };
  },
  getSnapshot(): boolean {
    try {
      return localStorage.getItem(HOW_IT_WORKS_KEY) === "1";
    } catch {
      return false;
    }
  },
  getServerSnapshot(): boolean {
    return false;
  },
  dismiss() {
    try {
      localStorage.setItem(HOW_IT_WORKS_KEY, "1");
    } catch {
      /* ذخیره ممکن نشد — فقط برای همین نشست بسته می‌ماند */
    }
    howItWorksStore.notify();
  },
};

/** navigator.onLine — الگوی رسمی React برای وضعیت شبکه */
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/* ─────────────────────────── اجزای کوچک خانه ─────────────────────────── */

/* ── دایرهٔ استوری «همین حالا زنده» با حلقهٔ رنگی برند ── */
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
      {/* v1.6.1 — بدون truncate: اسم بلند می‌شکند ولی با «…» بریده نمی‌شود */}
      <span className="w-full text-center text-[10px] font-bold leading-3.5 break-words text-white/75">
        {seller.name}
      </span>
    </button>
  );
}

/* ── دکمهٔ toggle یادآوری (span نقش‌محور چون ShowCard خودش button است) ── */
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
   v1.6.1 — «شروع: …» با زمان مطلق → شمارش نسبی («۲ ساعت دیگر»)
   (لیبل نسبی فقط بعد از mount — بدون hydration mismatch) */
function UpcomingFooter({
  show,
  reminderOn,
  onToggleReminder,
}: {
  show: Show;
  reminderOn: boolean;
  onToggleReminder: (show: Show) => void;
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
      </div>
      <ReminderToggle show={show} on={reminderOn} onToggle={onToggleReminder} />
    </>
  );
}

/* ── v1.6.1 — اسکلت‌های حالت بارگذاری (استوری‌ها، دسته‌ها، کارت‌ها) ── */
function StoriesSkeleton() {
  return (
    <div className="flex gap-3 pb-1" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex w-[68px] shrink-0 flex-col items-center gap-1.5">
          <Skeleton className="h-[68px] w-[68px] rounded-full" />
          <Skeleton className="h-2.5 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="flex gap-1.5 pb-1" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex w-[76px] shrink-0 flex-col items-center gap-1">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <Skeleton className="h-2.5 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function LiveGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-white/10 bg-ls-card"
        >
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
        </div>
      ))}
    </div>
  );
}

/* ── v1.6.1 — بنر آفلاین (navigator.onLine) ── */
function OfflineBanner() {
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2.5 text-xs font-bold text-amber-300"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      اتصال اینترنت قطع است — آخرین داده‌های ذخیره‌شده نشان داده می‌شود
    </div>
  );
}

/* ── v1.6.1 — حالت خطا با دکمهٔ «تلاش دوباره» ── */
function LiveErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-ls-card px-6 py-10 text-center">
      <span
        className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-ls-card-2 ring-1 ring-white/10"
        aria-hidden
      >
        <TriangleAlert className="h-8 w-8 text-amber-300" />
      </span>
      <p className="font-bold text-white/90">لود لایوها خطا خورد</p>
      <p className="mt-1 text-xs leading-6 text-white/60">
        اتصالت را بررسی کن و دوباره امتحان کن.
      </p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ls-purple px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-ls-purple-deep"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        تلاش دوباره
      </button>
    </div>
  );
}

/* ── v1.6.1 — «الان لایوی نیست» با پیشنهاد شوهای آینده ── */
function EmptyLiveState({
  onOpenPreview,
}: {
  onOpenPreview: (show: Show) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-ls-card px-6 py-8 text-center">
      <span
        className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-ls-card-2 ring-1 ring-white/10 animate-ls-float"
        aria-hidden
      >
        <VideoOff className="h-8 w-8 text-ls-purple-soft" />
      </span>
      <p className="font-bold text-white/90">الان لایوی نیست</p>
      <p className="mt-1 text-xs leading-6 text-white/60">
        فروشنده‌ها کمی بعد برمی‌گردند — این شوهای آینده را از دست نده:
      </p>
      <div className="mt-4 space-y-1.5 text-right">
        {UPCOMING_SHOWS.slice(0, 3).map((show) => (
          <button
            key={show.id}
            onClick={() => onOpenPreview(show)}
            className="flex w-full items-center gap-2 rounded-xl bg-ls-card-2 px-3 py-2.5 text-right transition-colors hover:bg-ls-line"
            aria-label={`پیش‌نمایش شو ${show.title}`}
          >
            <span className="min-w-0 flex-1 truncate text-xs font-bold text-white/85">
              {show.title}
            </span>
            <span className="shrink-0 text-[10px] font-bold tabular-nums text-ls-pink">
              {relativeStartFa(upcomingStartsAt(show.id))}
            </span>
            <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-white/40" aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── v1.6.1 — بنر «چطور کار می‌کنه؟» با بستن + localStorage (try/catch) ── */
function HowItWorksBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <section
      aria-label="چطور کار می‌کنه"
      data-testid="how-it-works"
      className="relative rounded-2xl p-px bg-gradient-to-l from-ls-purple via-ls-pink to-ls-purple shadow-lg shadow-ls-purple/20"
    >
      <div className="rounded-[calc(1rem-1px)] bg-ls-card p-4 pb-3.5 space-y-3">
        <button
          onClick={onDismiss}
          aria-label="بستن بنر چطور کار می‌کنه"
          className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-ls-card-2 text-white/60 transition-colors hover:bg-ls-line hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <h2 className="flex items-center gap-2 text-sm font-extrabold pl-9">
          <Sparkles className="h-4 w-4 shrink-0 text-ls-pink" aria-hidden />
          چطور کار می‌کنه؟
        </h2>
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <span className="bg-ls-card-2 rounded-lg px-2.5 py-1.5">
            ۱. شو رو ببین
          </span>
          <span className="text-ls-pink" aria-hidden>
            ←
          </span>
          <span className="bg-ls-card-2 rounded-lg px-2.5 py-1.5">
            ۲. کالای موردعلاقه رو انتخاب کن
          </span>
          <span className="text-ls-pink" aria-hidden>
            ←
          </span>
          <span className="bg-ls-card-2 rounded-lg px-2.5 py-1.5 text-ls-green">
            ۳. همین لحظه بخر!
          </span>
        </div>
        <p className="text-xs leading-6 text-white/65">
          در شوهای زنده، فروشنده کالا را جلوی دوربین نشان می‌دهد و تو همان
          لحظه با قیمت ثابت می‌خری. پولت به‌صورت امانی نزد لحظه می‌ماند و
          بعد از تحویل به فروشنده آزاد می‌شود — خیالت راحت!
        </p>
      </div>
    </section>
  );
}

/* ═════════════════════════════════ نمای خانه ═══════════════════════════════ */

export default function HomeView() {
  const setRoot = useAppStore((s) => s.setRoot);
  const openShow = useAppStore((s) => s.openShow);
  const setExploreIntent = useExploreIntentStore((s) => s.setIntent);

  /* شمارندهٔ ناخواندهٔ صندوق ورودی برای زنگ اعلان */
  const unreadCount = useInboxStore(selectUnreadCount);

  /* لایهٔ داده — React Query (mock یا API با NEXT_PUBLIC_USE_API) */
  const liveShowsQuery = useLiveShows();
  const categoriesQuery = useCategories();
  const shows = liveShowsQuery.shows;
  const categories = categoriesQuery.data ?? [];

  /* فاز ۱ — تب «برای شما / دنبال‌شده‌ها» */
  const [tab, setTab] = useState<HomeTab>("forYou");
  /* شوهای به‌زودی که یادآوری فعال دارند */
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  /* شیت پیش‌نمایش شو به‌زودی */
  const [previewShow, setPreviewShow] = useState<Show | null>(null);

  /* استورهای بیرونی — بدون setState داخل effect (v1.6.1) */
  /* کلید mock ?state=loading|error|empty برای دیدن و گرفتن عکس همهٔ حالت‌ها */
  const forcedState = useSyncExternalStore(
    forcedStateStore.subscribe,
    forcedStateStore.getSnapshot,
    forcedStateStore.getServerSnapshot
  );
  /* بنر «چطور کار می‌کنه؟» — بعد از بستن (localStorage) دیگر نمایش داده نمی‌شود */
  const howItWorksDismissed = useSyncExternalStore(
    howItWorksStore.subscribe,
    howItWorksStore.getSnapshot,
    howItWorksStore.getServerSnapshot
  );
  /* وضعیت آفلاین (navigator.onLine) */
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );

  const dismissHowItWorks = () => howItWorksStore.dismiss();

  /* بارگذاری بیشتر هنگام اسکرول (صفحه‌بندی cursor) */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) liveShowsQuery.loadMore();
      },
      { rootMargin: "240px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [liveShowsQuery.loadMore, shows.length]);

  /* وضعیت نمایشی UI — با کلید mock قابل تحمیل است */
  const uiState: "loading" | "error" | "empty" | "ready" = useMemo(() => {
    if (forcedState === "loading") return "loading";
    if (liveShowsQuery.isLoading) return "loading";
    if (forcedState === "error" || liveShowsQuery.isError) return "error";
    if (forcedState === "empty" || shows.length === 0) return "empty";
    return "ready";
  }, [forcedState, liveShowsQuery.isLoading, liveShowsQuery.isError, shows.length]);

  const visibleLiveShows =
    tab === "forYou"
      ? shows
      : shows.filter((s) => s.isFollowing);

  /* «برای شما» خالی = حالت empty؛ «دنبال‌شده‌ها» خالی = EmptyState فالو */
  const followingTabEmpty =
    uiState === "ready" && tab === "following" && visibleLiveShows.length === 0;

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

  /* لمس کاشی دسته‌بندی → کاوش با همان دستهٔ از پیش انتخاب‌شده */
  const goExploreCategory = (categoryId: string | null) => {
    setExploreIntent({ category: categoryId, focusSearch: false });
    setRoot("explore");
  };
  /* دکمهٔ جستجو → کاوش با فوکوس روی ورودی جستجو */
  const goExploreSearch = () => {
    setExploreIntent({ category: null, focusSearch: true });
    setRoot("explore");
  };

  /* «تلاش دوباره» — پاک‌کردن حالت تحمیلی + refetch هر دو کوئری */
  const retry = () => {
    forcedStateStore.clear();
    void liveShowsQuery.refetch();
    void categoriesQuery.refetch();
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8 space-y-6">
      {/* v1.6.1 — بنر آفلاین */}
      {!online && <OfflineBanner />}

      {/* سربرگ خوش‌آمد + نوار بالا: جستجو و زنگ اعلان */}
      <header className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-black">
            سلام علی
            <Hand className="h-5 w-5 text-ls-pink" aria-hidden />
          </h1>
          <p className="mt-1 text-sm text-white/65">
            {uiState === "loading"
              ? "در حال آماده‌سازی لایوها…"
              : `امشب ${faNum(shows.length)} شو زنده داریم!`}
          </p>
        </div>
        <button
          onClick={goExploreSearch}
          aria-label="جستجو — رفتن به کاوش"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ls-card-2 text-white/80 transition-colors hover:bg-ls-line hover:text-white"
        >
          <Search className="h-5 w-5" aria-hidden />
        </button>
        <button
          onClick={() => setRoot("inbox")}
          aria-label={`اعلان‌ها${unreadCount > 0 ? ` — ${faNum(unreadCount)} ناخوانده` : ""}`}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ls-card-2 text-white/80 transition-colors hover:bg-ls-line hover:text-white"
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unreadCount > 0 && (
            <span
              className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF3B5C] px-1 text-[10px] font-black text-white ring-2 ring-ls-bg tabular-nums"
              aria-hidden
            >
              {faNum(unreadCount)}
            </span>
          )}
        </button>
      </header>

      {/* بنر «چطور کار می‌کنه؟» — بعد از بستن (localStorage) دیگر نمی‌آید */}
      {!howItWorksDismissed && <HowItWorksBanner onDismiss={dismissHowItWorks} />}

      {/* ردیف «همین حالا زنده»: دایره‌های استوری با حلقهٔ رنگی */}
      {uiState !== "error" && uiState !== "empty" && (
        <section aria-label="همین حالا زنده" className="space-y-2">
          <SectionTitle title="همین حالا زنده" lucide={Radio} />
          {uiState === "loading" ? (
            <StoriesSkeleton />
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {shows.map((s) => (
                <StoryBubble key={s.id} show={s} onOpen={openShow} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* دسته‌بندی‌ها: کاشی «همه» + کارت‌های عکس‌دار — لمس → کاوش با دستهٔ انتخابی */}
      <nav
        className="flex snap-x gap-1.5 overflow-x-auto no-scrollbar pb-1"
        aria-label="دسته‌بندی‌های خرید"
      >
        {uiState === "loading" ? (
          <CategoriesSkeleton />
        ) : (
          <>
            <CategoryTile
              id="all"
              label="همه"
              icon={LayoutGrid}
              onClick={() => goExploreCategory(null)}
            />
            {categories.map((c) => (
              <CategoryTile
                key={c.id}
                id={c.id}
                label={c.label}
                onClick={() => goExploreCategory(c.id)}
              />
            ))}
          </>
        )}
      </nav>

      {/* شوهای زندهٔ داغ — گرید دوسطحی کارت عمودی ۴:۵ */}
      <section aria-label="شوهای زندهٔ داغ">
        <SectionTitle title="شوهای زندهٔ داغ" lucide={Flame} />

        {/* تب‌های «برای شما / دنبال‌شده‌ها» */}
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

        {uiState === "loading" ? (
          <LiveGridSkeleton />
        ) : uiState === "error" ? (
          <LiveErrorState onRetry={retry} />
        ) : uiState === "empty" ? (
          <EmptyLiveState onOpenPreview={setPreviewShow} />
        ) : followingTabEmpty ? (
          /* EmptyState کوچک برای تب «دنبال‌شده‌ها»ی خالی — v1.6.1: آیکون lucide */
          <EmptyState
            lucide={UserRoundPlus}
            title="هنوز فروشنده‌ای را دنبال نکرده‌ای"
            desc="از صفحهٔ کاوش فروشنده‌های موردعلاقه‌ات را فالو کن تا لایوهایشان اینجا نمایش داده شود."
            action={
              <button
                onClick={() => setRoot("explore")}
                aria-label="رفتن به صفحهٔ کاوش"
                className="rounded-full bg-ls-purple px-4 py-1.5 text-xs font-bold text-white hover:bg-ls-purple-deep transition-colors"
              >
                رفتن به کاوش
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {visibleLiveShows.map((show) => (
                <LiveGridCard
                  key={show.id}
                  show={show}
                  onClick={() => openShow(show.id)}
                />
              ))}
            </div>
            {/* صفحه‌بندی cursor — بارگذاری بیشتر هنگام اسکرول */}
            <div ref={sentinelRef} aria-hidden className="h-px" />
            {liveShowsQuery.isFetchingNextPage && (
              <div
                className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-white/50"
                role="status"
              >
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-ls-purple"
                  aria-hidden
                />
                در حال بارگذاری لایوهای بیشتر…
              </div>
            )}
            {!liveShowsQuery.hasMore && shows.length > 0 && (
              <p className="mt-3 text-center text-[11px] font-bold text-white/35">
                همهٔ لایوهای زنده را دیدی ✓
              </p>
            )}
          </>
        )}
      </section>

      {/* به‌زودی — کارت‌ها با شمارش نسبی، بدون برچسب «قیمت ثابت»، snap با دیدن کارت بعد */}
      <section aria-label="شوهای به‌زودی">
        <SectionTitle title="به‌زودی" lucide={Clock} />
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto no-scrollbar pb-1 -mb-1">
          {UPCOMING_SHOWS.map((raw) => {
            /* v1.6.1 — حذف برچسب «قیمت ثابت» (و «خرید فوری» حراجی) —
               حداکثر یک برچسب وضعیت مثل «امضادار» می‌ماند.
               زمان مطلق (startsAtLabel) هم برمی‌داریم تا با شمارش نسبی فوتر
               تکراری نشود — نشان کاور به «به‌زودی» برمی‌گردد */
            const show: Show = {
              ...raw,
              startsAtLabel: undefined,
              tags: raw.tags.filter(
                (t) => t !== "قیمت ثابت" && t !== "خرید فوری"
              ),
            };
            return (
              <div
                key={show.id}
                className="w-[80%] max-w-[300px] shrink-0 snap-start"
              >
                <ShowCard
                  compact
                  show={show}
                  photo={SHOW_PHOTO[show.id]}
                  onClick={() => setPreviewShow(show)}
                  footer={
                    <UpcomingFooter
                      show={show}
                      reminderOn={reminders.has(show.id)}
                      onToggleReminder={toggleReminder}
                    />
                  }
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* شیت پیش‌نمایش شو به‌زودی */}
      <UpcomingPreviewSheet
        show={previewShow}
        open={previewShow !== null}
        onOpenChange={(o) => {
          if (!o) setPreviewShow(null);
        }}
        reminderOn={previewShow ? reminders.has(previewShow.id) : false}
        onToggleReminder={toggleReminder}
      />
    </div>
  );
}
