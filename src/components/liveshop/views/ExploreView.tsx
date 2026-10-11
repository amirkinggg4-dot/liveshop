"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   ExploreView — صفحهٔ کاوش (بازطراحی v1.6.2)
   ─ کارت‌های نتیجه: همان LiveGridCard خانه (عکس تمام‌کارت، دو ستونه،
     قیمت کالای پین‌شده کامل، موجودی در ردیف جدا) — اسم فروشنده بریده نمی‌شود
   ─ شوهای آینده با همان کارت «به‌زودی» خانه (UpcomingShowCard مشترک)
     و لمس → همان شیت پیش‌نمایش خانه
   ─ همهٔ ایموجی‌ها → آیکون lucide (جستجوهای ذخیره‌شده، تیتر بخش‌ها،
     حالت خالی، نتیجه‌ای پیدا نشد)
   ─ «فقط لایوها» کلید Switch در نوار ابزار — تیتر بخش جدا و ثابت
   ─ عنوان کاشی‌های دسته تا ۲ خط (بدون «…»)
   ─ جستجو: نتایج در سه تب شوها / کالاها / فروشندگان؛ کارت کوچک کالا با
     «در لایوی فلان» که به همان شو می‌برد؛ جستجوی فارسی بدون حساسیت به
     ی/ي و ک/ك و ارقام فارسی/لاتین (src/lib/persian.ts)
   ─ فیلتر (شیت پایین): بازهٔ قیمت، سایز، برند، وضعیت کالا، فقط زنده؛
     مرتب‌سازی: محبوب‌ترین/تازه‌ترین/ارزان‌ترین/گران‌ترین؛ نشان تعداد روی
     دکمهٔ فیلتر + چیپ‌های فعال قابل‌حذف
   ─ جستجوی خالی: «جستجوهای اخیر» (قابل پاک‌کردن، localStorage با try/catch)
     و «پرطرفدارها»؛ «ذخیرهٔ این جستجو» از صفحهٔ نتایج در دسترس است
   ─ حالت‌ها مثل خانه: skeleton، خطا با «تلاش دوباره»، آفلاین — با ?state=
   ─ لایهٔ داده: useSearch و useExploreShows (React Query — NEXT_PUBLIC_USE_API
     → GET /search?q= و GET /shows?status=LIVE|SCHEDULED، spec §2)؛ پیش‌فرض mock
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowUpDown,
  BadgeCheck,
  Clock,
  Compass,
  Flame,
  Moon,
  Radio,
  RotateCcw,
  Search,
  SearchX,
  SlidersHorizontal,
  TriangleAlert,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import { useExploreIntentStore } from "@/store/explore-intent-store";
import { faNum } from "@/lib/format";
import { normalizeFa } from "@/lib/persian";
import { forcedStateStore, useForcedState, useOnline } from "@/lib/forced-state";
import { CATEGORIES } from "@/lib/data/categories";
import {
  Avatar,
  CategoryIcon,
  CategoryTile,
  EmptyState,
  LiveGridCard,
  RatingStars,
  SectionTitle,
} from "@/components/liveshop/shared";
import { SavedSearchesRow } from "@/components/liveshop/saved-searches";
import PreBidSheet from "@/components/liveshop/pre-bid-sheet";
import { UpcomingShowCard } from "./home/upcoming-card";
import UpcomingPreviewSheet from "./home/upcoming-preview-sheet";
import ProductResultCard from "./explore/product-card";
import FilterSheet from "./explore/filter-sheet";
import SortSheet from "./explore/sort-sheet";
import { RecentSearchesSection, useRecentSearches } from "./explore/recent-searches";
import {
  EMPTY_FILTERS,
  activeFilterChips,
  filterProductResult,
  filterShow,
  filtersCount,
  sortLabel,
  sortProducts,
  sortShows,
  type ExploreFilters,
  type SortId,
} from "./explore/filters";
import {
  EMPTY_SEARCH,
  useSearch,
  type SearchResults,
  type SellerResult,
} from "@/hooks/useSearch";
import { useExploreShows } from "@/hooks/useExploreShows";
import { useCategories } from "@/hooks/useCategories";
import { AUCTION_ENABLED } from "@/lib/config";
import type { Category, Show } from "@/lib/data/types";

/* ── پیشنهادهای پرطرفدار (mock) ── */
const POPULAR_QUERIES = [
  "کتونی",
  "مونسترا",
  "پوکمون",
  "جردن",
  "عطر",
  "هدفون",
  "فانکو پاپ",
  "بونسای",
];

/* ── اسکلت‌های حالت بارگذاری ── */

function TilesSkeleton() {
  return (
    <div className="flex gap-1.5 overflow-hidden pb-1" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex w-[76px] shrink-0 flex-col items-center gap-1">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <Skeleton className="h-2.5 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
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

/* ── v1.6.3 — گرید نتیجهٔ جستجو (علت باگ قبلی و درمانش):
   قبل: زنده‌ها و به‌زودی‌ها در «دو گرید جدا»ی grid-cols-2 بودند؛ با نتایج کم،
   هر گرید فقط خانهٔ راست (شروع RTL) را پر می‌کرد → «یک ستونِ نیم‌عرض در راست
   با چپ خالی». حالا همهٔ نتایج در یک گرید واکنش‌گرا می‌نشینند:
   موبایل ۲ ستون (مثل خانه)، دسکتاپ ۳ تا ۴ ستون.
   تک‌نتیجه: کارت کل ردیف را نمی‌گیرد (کشیده نمی‌شود) و هم‌قد خانهٔ گرید
   هم نیست (ریز نمی‌شود) — با سقف عرض معقول در سمت شروع (راست) می‌نشیند. */
function ResultGrid({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {count === 1 ? (
        <div className="col-span-full max-w-[280px] justify-self-start">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/* ── بنر آفلاین / کارت خطا (هم‌شکل خانه) ── */

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

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-ls-card px-6 py-10 text-center">
      <span
        className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-ls-card-2 ring-1 ring-white/10"
        aria-hidden
      >
        <TriangleAlert className="h-8 w-8 text-amber-300" />
      </span>
      <p className="font-bold text-white/90">لود کاوش خطا خورد</p>
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

/* ── ردیف فروشنده در تب «فروشندگان» — اسم بریده نمی‌شود ── */

function SellerResultRow({ seller }: { seller: SellerResult }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-ls-card p-3">
      {seller.avatarUrl ? (
        <span
          className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10"
          aria-hidden
        >
          <img
            src={seller.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </span>
      ) : (
        <Avatar emoji={seller.emoji} color={seller.color} />
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 break-words text-sm font-bold text-white">
          <span className="min-w-0">{seller.name}</span>
          {seller.verified && (
            <BadgeCheck
              className="h-4 w-4 shrink-0 text-ls-purple-soft"
              aria-label="فروشندهٔ تأییدشده"
            />
          )}
        </p>
        <p className="text-xs text-white/45" dir="ltr">
          @{seller.handle}
        </p>
        {seller.rating != null && (
          <RatingStars
            rating={seller.rating}
            count={seller.ratingsCount ?? undefined}
          />
        )}
      </div>
      <button
        onClick={() => toast(`«${seller.name}» فالو شد`)}
        aria-label={`فالو ${seller.name}`}
        className="shrink-0 rounded-full border border-ls-purple/50 px-3.5 py-1.5 text-xs font-bold text-ls-purple-soft transition-colors hover:bg-ls-purple/10"
      >
        فالو
      </button>
    </div>
  );
}

/* ═══════════════════════════════ نمای کاوش ═══════════════════════════════ */

export default function ExploreView() {
  const openShow = useAppStore((s) => s.openShow);
  /* نیت مشترک خانه → کاوش: دستهٔ از پیش انتخاب‌شده + فوکوس جستجو */
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
  /* «فقط لایوها» — کلید نوار ابزار (پیش‌فرض مثل baseline: فقط زنده‌ها) */
  const [liveOnly, setLiveOnly] = useState(true);
  const [sort, setSort] = useState<SortId>("popular");
  const [filters, setFilters] = useState<ExploreFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  /* یادآوری شوهای به‌زودی + شیت پیش‌نمایش/پیش‌بید */
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const [previewShow, setPreviewShow] = useState<Show | null>(null);
  const [prebidShow, setPrebidShow] = useState<Show | null>(null);

  /* استورهای بیرونی — بدون setState داخل effect */
  const forcedState = useForcedState();
  const online = useOnline();
  const recent = useRecentSearches();

  /* مصرف یک‌بارهٔ نیت: فوکوس ورودی + پاک‌کردن نیت */
  useEffect(() => {
    if (intentFocusSearch) searchInputRef.current?.focus();
    if (intentCategory || intentFocusSearch) consumeIntent();
  }, []);

  /* لایهٔ داده — React Query (mock یا API با NEXT_PUBLIC_USE_API) */
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];
  /* v1.6.3 — در حالت API مرتب‌سازی و فیلتر به سرور هم پاس داده می‌شود
     (سمت کلاینت هم همان منطق قبلی اعمال می‌شود — نتیجه یکسان می‌ماند) */
  const exploreShowsQuery = useExploreShows(activeCat, sort);
  const searchQuery = useSearch(query, filters);

  const searching = normalizeFa(query).length >= 2;

  /* ── فهرست پیش‌فرض کاوش ── */
  const showsData = exploreShowsQuery.data;
  const liveList = useMemo(() => {
    const base = showsData?.live ?? [];
    return sortShows(base.filter((s) => filterShow(s, filters)), sort);
  }, [showsData, filters, sort]);
  const upcomingList = useMemo(() => {
    const base = showsData?.upcoming ?? [];
    return base.filter((s) => filterShow(s, filters));
  }, [showsData, filters]);

  /* ── نتایج جستجو (پس از فیلتر و مرتب‌سازی) ── */
  const results: SearchResults = searchQuery.data ?? EMPTY_SEARCH;
  const liveResults = useMemo(
    () =>
      sortShows(
        results.shows.filter((s) => s.status === "live" && filterShow(s, filters)),
        sort
      ),
    [results.shows, filters, sort]
  );
  const upcomingResults = useMemo(
    () =>
      results.shows.filter(
        (s) => s.status === "upcoming" && filterShow(s, filters)
      ),
    [results.shows, filters]
  );
  const shownUpcomingResults = liveOnly ? [] : upcomingResults;
  const productResults = useMemo(
    () =>
      sortProducts(
        results.products.filter((p) => filterProductResult(p, filters)),
        sort
      ),
    [results.products, filters, sort]
  );
  const sellerResults = useMemo(() => {
    const arr = [...results.sellers];
    if (sort === "popular") {
      arr.sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
    }
    return arr;
  }, [results.sellers, sort]);
  const totalResults =
    liveResults.length +
    shownUpcomingResults.length +
    productResults.length +
    sellerResults.length;

  /* ── وضعیت نمایشی UI — با کلید mock قابل تحمیل است ── */
  const uiState: "loading" | "error" | "ready" = useMemo(() => {
    if (forcedState === "loading") return "loading";
    if (!searching && exploreShowsQuery.isLoading) return "loading";
    if (forcedState === "error" || exploreShowsQuery.isError) return "error";
    return "ready";
  }, [forcedState, searching, exploreShowsQuery.isLoading, exploreShowsQuery.isError]);

  const searchState: "loading" | "error" | "ready" = useMemo(() => {
    if (!searching) return "ready";
    if (searchQuery.isFetching && !searchQuery.data) return "loading";
    if (searchQuery.isError) return "error";
    return "ready";
  }, [searching, searchQuery.isFetching, searchQuery.data, searchQuery.isError]);

  const filterCount = filtersCount(filters);
  const chips = activeFilterChips(filters);

  /* دستهٔ فعال و خالی‌بودن فهرست پیش‌فرض */
  const forcedEmpty = forcedState === "empty";
  const defaultListEmpty = liveOnly
    ? liveList.length === 0
    : liveList.length + upcomingList.length === 0;

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

  /* اجرای جستجو — ثبت در «جستجوهای اخیر» (localStorage try/catch) */
  const runSearch = (q: string) => {
    setQuery(q);
    if (normalizeFa(q).length >= 2) recent.add(q);
  };

  /* «تلاش دوباره» — پاک‌کردن حالت تحمیلی + refetch کوئری‌ها */
  const retry = () => {
    forcedStateStore.clear();
    void exploreShowsQuery.refetch();
    if (searching) void searchQuery.refetch();
  };

  const showDefaultEmpty = uiState === "ready" && (forcedEmpty || defaultListEmpty);

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8 space-y-5">
      {/* بنر آفلاین */}
      {!online && <OfflineBanner />}

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
          onKeyDown={(e) => {
            if (e.key === "Enter" && normalizeFa(query).length >= 2) {
              recent.add(query.trim());
            }
          }}
          placeholder="جستجوی شو، کالا و فروشنده…"
          aria-label="جستجوی شو، کالا و فروشنده"
          className="pr-9 bg-ls-card border-white/10 rounded-xl h-10 text-sm placeholder:text-white/35"
        />
        {query.length > 0 && (
          <button
            onClick={() => setQuery("")}
            aria-label="پاک‌کردن متن جستجو"
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-ls-card-2 text-white/60 transition-colors hover:text-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      {/* ردیف جستجوهای ذخیره‌شده + «ذخیرهٔ این جستجو» در صفحهٔ نتایج */}
      <SavedSearchesRow
        currentQuery={query.trim() || undefined}
        onPick={(q) => runSearch(q)}
      />

      {/* نوار ابزار: فیلتر + مرتب‌سازی + کلید «فقط لایوها» */}
      <div
        role="toolbar"
        aria-label="ابزارهای فهرست و نتایج"
        className="flex flex-wrap items-center gap-2"
      >
        <button
          onClick={() => setFilterOpen(true)}
          aria-label={`فیلترها${filterCount > 0 ? ` — ${faNum(filterCount)} فعال` : ""}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-ls-card-2 px-3.5 py-2 text-xs font-bold text-white/85 transition-colors hover:bg-ls-line hover:text-white"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          فیلتر
          {filterCount > 0 && (
            <span
              className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-ls-purple px-1 text-[10px] font-black text-white tabular-nums"
              aria-hidden
            >
              {faNum(filterCount)}
            </span>
          )}
        </button>
        <button
          onClick={() => setSortOpen(true)}
          aria-label={`مرتب‌سازی — فعال: ${sortLabel(sort)}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-ls-card-2 px-3.5 py-2 text-xs font-bold text-white/85 transition-colors hover:bg-ls-line hover:text-white"
        >
          <ArrowUpDown className="h-4 w-4" aria-hidden />
          {sortLabel(sort)}
        </button>
        <label
          htmlFor="explore-live-only"
          className="mr-auto inline-flex cursor-pointer items-center gap-2 rounded-full bg-ls-card-2 py-1.5 pl-2 pr-3 text-[11px] font-bold text-white/80"
        >
          فقط لایوها
          <Switch
            id="explore-live-only"
            checked={liveOnly}
            onCheckedChange={setLiveOnly}
            aria-label="نمایش فقط شوهای زنده"
          />
        </label>
      </div>

      {/* چیپ‌های فیلتر فعال — قابل حذف */}
      {chips.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5"
          aria-label="فیلترهای فعال"
        >
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilters((prev) => c.clear(prev))}
              aria-label={`حذف فیلتر ${c.label}`}
              className="inline-flex items-center gap-1 rounded-full border border-ls-purple/40 bg-ls-purple/10 py-1 pl-1.5 pr-3 text-xs font-bold text-ls-purple-soft transition-colors hover:bg-ls-purple/20"
            >
              {c.label}
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ))}
        </div>
      )}

      {searching ? (
        /* ══ حالت نتایج جستجو ══ */
        searchState === "loading" ? (
          <GridSkeleton count={4} />
        ) : searchState === "error" ? (
          <ErrorCard onRetry={retry} />
        ) : totalResults === 0 ? (
          <EmptyState
            lucide={SearchX}
            title="نتیجه‌ای پیدا نشد"
            desc={`برای «${query.trim()}» چیزی پیدا نکردیم. عبارت دیگری را امتحان کن.`}
          />
        ) : (
          <Tabs defaultValue="shows" dir="rtl" className="gap-4">
            <TabsList className="grid w-full grid-cols-3 bg-ls-card">
              <TabsTrigger value="shows" className="text-xs font-bold">
                شوها ({faNum(liveResults.length + shownUpcomingResults.length)})
              </TabsTrigger>
              <TabsTrigger value="products" className="text-xs font-bold">
                کالاها ({faNum(productResults.length)})
              </TabsTrigger>
              <TabsTrigger value="sellers" className="text-xs font-bold">
                فروشندگان ({faNum(sellerResults.length)})
              </TabsTrigger>
            </TabsList>

            {/* تب شوها — زنده‌ها و به‌زودی‌ها در یک گرید (رفع باگ ستونِ نیم‌عرض) */}
            <TabsContent value="shows" className="space-y-4">
              {liveResults.length + shownUpcomingResults.length === 0 ? (
                <p className="py-6 text-center text-xs font-bold text-white/45">
                  در این گروه نتیجه‌ای نبود
                </p>
              ) : (
                <ResultGrid count={liveResults.length + shownUpcomingResults.length}>
                  {liveResults.map((show) => (
                    <LiveGridCard
                      key={show.id}
                      show={show}
                      onClick={() => openShow(show.id)}
                    />
                  ))}
                  {shownUpcomingResults.map((show) => (
                    <UpcomingShowCard
                      key={show.id}
                      show={show}
                      reminderOn={reminders.has(show.id)}
                      onToggleReminder={toggleReminder}
                      onClick={() => setPreviewShow(show)}
                      onPrebid={setPrebidShow}
                    />
                  ))}
                </ResultGrid>
              )}
            </TabsContent>

            {/* تب کالاها */}
            <TabsContent value="products">
              {productResults.length === 0 ? (
                <p className="py-6 text-center text-xs font-bold text-white/45">
                  در این گروه نتیجه‌ای نبود
                </p>
              ) : (
                <ResultGrid count={productResults.length}>
                  {productResults.map((p) => (
                    <ProductResultCard
                      key={p.id}
                      product={p}
                      onClick={() => {
                        if (p.showId) openShow(p.showId);
                        else toast("این کالا فعلاً در لایوی زنده نیست");
                      }}
                    />
                  ))}
                </ResultGrid>
              )}
            </TabsContent>

            {/* تب فروشندگان — دسکتاپ چند ستونه، موبایل ردیف کامل (اسم کامل + فالو) */}
            <TabsContent value="sellers">
              {sellerResults.length === 0 ? (
                <p className="py-6 text-center text-xs font-bold text-white/45">
                  در این گروه نتیجه‌ای نبود
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {sellerResults.map((s) => (
                    <SellerResultRow key={s.id} seller={s} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )
      ) : (
        /* ══ حالت پیش‌فرض کاوش ══ */
        <>
          {activeCat && (
            <button
              onClick={() => setActiveCat(null)}
              aria-label="حذف فیلتر دسته‌بندی"
              className="self-start inline-flex items-center gap-1.5 rounded-full bg-ls-purple px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-ls-purple-deep"
            >
              <CategoryIcon id={activeCat.id} className="h-3.5 w-3.5" />
              {activeCat.label}
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}

          {/* جستجوی خالی: جستجوهای اخیر + پرطرفدارها — فقط در حالت آماده */}
          {!activeCat && uiState === "ready" && (
            <>
              <RecentSearchesSection onPick={(q) => runSearch(q)} />
              <section aria-label="پرطرفدارها">
                <SectionTitle title="پرطرفدارها" lucide={Flame} />
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => runSearch(q)}
                      aria-label={`جستجوی ${q}`}
                      className="rounded-full bg-ls-card-2 px-3 py-1.5 text-xs font-bold text-white/75 transition-colors hover:bg-ls-line hover:text-white"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* دسته‌بندی‌ها */}
          <section aria-label="دسته‌بندی‌ها">
            <SectionTitle title="دسته‌بندی‌ها" lucide={Compass} />
            {uiState === "loading" ? (
              <TilesSkeleton />
            ) : (
              <div className="flex snap-x gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {categories.map((c) => (
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
            )}
          </section>

          {/* فهرست شوها — تیتر ثابت (کلید «فقط لایوها» در نوار ابزار است) */}
          <section aria-label="فهرست شوها">
            <SectionTitle title="فهرست شوها" lucide={Radio} />
            {uiState === "loading" ? (
              <GridSkeleton />
            ) : uiState === "error" ? (
              <ErrorCard onRetry={retry} />
            ) : showDefaultEmpty ? (
              <EmptyState
                lucide={Moon}
                title="الان لایو فعالی در این دسته نیست"
                desc="به‌زودی شوهای جدید این دسته را از دست نده!"
              />
            ) : liveOnly ? (
              liveList.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {liveList.map((show) => (
                    <LiveGridCard
                      key={show.id}
                      show={show}
                      onClick={() => openShow(show.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-white/5 bg-ls-card px-4 py-5 text-center text-xs font-bold text-white/50">
                  لایوی در این فهرست نیست — شوهای به‌زودی را پایین ببین
                </p>
              )
            ) : (
              /* حالت ادغام: زنده‌ها + به‌زودی‌ها با کارت‌های خانه */
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {liveList.map((show) => (
                  <LiveGridCard
                    key={show.id}
                    show={show}
                    onClick={() => openShow(show.id)}
                  />
                ))}
                {upcomingList.map((show) => (
                  <UpcomingShowCard
                    key={show.id}
                    show={show}
                    reminderOn={reminders.has(show.id)}
                    onToggleReminder={toggleReminder}
                    onClick={() => setPreviewShow(show)}
                    onPrebid={setPrebidShow}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ردیف به‌زودی — در حالت «فقط لایوها» (در حالت ادغام داخل لیست بالا) */}
          {uiState === "ready" &&
            liveOnly &&
            upcomingList.length > 0 &&
            !forcedEmpty && (
              <section aria-label="شوهای به‌زودی">
                <SectionTitle title="به‌زودی" lucide={Clock} />
                <div className="-mb-1 flex snap-x snap-mandatory gap-3 overflow-x-auto no-scrollbar pb-1">
                  {upcomingList.map((show) => (
                    <div
                      key={show.id}
                      className="w-[80%] max-w-[300px] shrink-0 snap-start"
                    >
                      <UpcomingShowCard
                        show={show}
                        reminderOn={reminders.has(show.id)}
                        onToggleReminder={toggleReminder}
                        onClick={() => setPreviewShow(show)}
                        onPrebid={setPrebidShow}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
        </>
      )}

      {/* شیت‌ها */}
      {filterOpen && (
        <FilterSheet
          key="filter-open"
          open
          onOpenChange={setFilterOpen}
          filters={filters}
          liveOnly={liveOnly}
          onApply={(f, lo) => {
            setFilters(f);
            setLiveOnly(lo);
          }}
        />
      )}
      {sortOpen && (
        <SortSheet
          key="sort-open"
          open
          onOpenChange={setSortOpen}
          sort={sort}
          onPick={(s) => {
            setSort(s);
            toast(`مرتب‌سازی: ${sortLabel(s)}`);
          }}
        />
      )}
      <UpcomingPreviewSheet
        show={previewShow}
        open={previewShow !== null}
        onOpenChange={(o) => {
          if (!o) setPreviewShow(null);
        }}
        reminderOn={previewShow ? reminders.has(previewShow.id) : false}
        onToggleReminder={toggleReminder}
      />
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
