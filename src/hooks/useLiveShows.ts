"use client";

/* ─────────────────────────────────────────────────────────────
   v1.6.1 — لایهٔ دادهٔ خانه: useLiveShows (React Query)
   ─ NEXT_PUBLIC_USE_API=true → GET /api/v1/shows?status=LIVE
     (قرارداد docs/api-spec.md §2 — کارت‌ها شامل کالای پین‌شده با قیمت/موجودی)
   ─ در غیر این صورت همان دیتای mock قبلی (LIVE_SHOWS) — بدون تغییر رفتار
   ─ نوع خروجی هر دو حالت یکی است: LiveShowsPage { shows: Show[]; nextCursor }
   ─ صفحه‌بندی cursor: useInfiniteQuery + بارگذاری بیشتر هنگام اسکرول
   پیش‌فرض: flag خاموش (mock).
   ───────────────────────────────────────────────────────────── */

import { useInfiniteQuery } from "@tanstack/react-query";
import { LIVE_SHOWS } from "@/lib/data/shows";
import type { Show } from "@/lib/data/types";

/** اندازهٔ هر صفحهٔ فید لایو خانه */
export const LIVE_SHOWS_PAGE_SIZE = 4;

/** خروجی یکسان هر دو حالت mock/API — صفحه‌بندی با cursor */
export interface LiveShowsPage {
  shows: Show[];
  nextCursor: string | null;
}

/* ── شکل پاسخ API (serializer ‏showCard در src/lib/server/shows.ts) ── */

export interface ApiShowCard {
  id: string;
  title: string;
  coverUrl: string | null;
  status: "LIVE" | "SCHEDULED" | "ENDED" | "CANCELED";
  scheduledAt: string | null;
  startedAt: string | null;
  /** v1.6.3 — شروع واقعی شوهای SCHEDULED (پایهٔ شمارش معکوس نسبی) */
  startsAt: string | null;
  viewers: number;
  category: { slug: string; nameFa: string } | null;
  seller: {
    id: string;
    slug: string;
    shopName: string;
    avatarUrl: string | null;
    verified: boolean;
    /** v1.6.3 — فقط وقتی درخواست توکن معتبر دارد وجود دارد */
    isFollowed?: boolean;
  };
  pinnedItem: {
    showItemId: string;
    productTitle: string;
    image: string | null;
    price: number;
    stock: number;
  } | null;
}

export interface ApiShowsResponse {
  shows: ApiShowCard[];
  nextCursor: string | null;
}

/** وضعیت API → وضعیت UI (v1.6.2 — کاوش SCHEDULED را هم می‌خواند) */
export function apiShowStatusToUi(
  status: ApiShowCard["status"]
): Show["status"] {
  if (status === "LIVE") return "live";
  if (status === "SCHEDULED") return "upcoming";
  return "ended";
}

/** تبدیل پاسخ API به تایپ UI (Show) — بدون خطا روی فیلدهای null
    v1.6.2 — وضعیت قابل override است (SCHEDULED → upcoming برای کاوش)
    v1.6.3 — startsAt واقعی + isFollowed → isFollowing («دنبال‌شده‌ها» خانه) */
export function apiShowToUiShow(
  raw: ApiShowCard,
  status: Show["status"] = apiShowStatusToUi(raw.status)
): Show {
  return {
    id: raw.id,
    title: raw.title,
    sellerId: raw.seller.id,
    category: raw.category?.nameFa ?? "",
    status,
    viewers: raw.viewers ?? 0,
    /* کاور واقعی از photoUrl می‌آید؛ cover فقط fallback گرادیان است */
    cover: { from: "#6C5CFF", to: "#FF3B8B", emoji: "🛍️" },
    itemsTotal: 0,
    itemsSold: 0,
    /* v1.6.3 — فالو واقعی کاربر (توکن اختیاری)؛ بی‌توکن false مثل قبل */
    isFollowing: raw.seller.isFollowed ?? false,
    tags: [],
    /* v1.6.3 — شروع واقعی شو به‌زودی → شمارش نسبی بدون دادهٔ mock */
    startsAt: raw.startsAt ?? raw.scheduledAt ?? null,
    photoUrl: raw.coverUrl ?? null,
    sellerName: raw.seller.shopName,
    sellerAvatar: raw.seller.avatarUrl,
    sellerVerified: raw.seller.verified,
    pinnedPrice: raw.pinnedItem ? raw.pinnedItem.price : null,
    pinnedStock: raw.pinnedItem ? raw.pinnedItem.stock : null,
  };
}

/** flag — پیش‌فرض خاموش؛ فقط با NEXT_PUBLIC_USE_API="true" روشن می‌شود */
export const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_API === "true";

/* ── v1.6.3 — توکن اختیاری برای فیلد isFollowed ──
   رابط کاربری فعلاً صفحهٔ ورود ندارد؛ هر وقت جریان لاگین توکن دسترسی را در
   localStorage بنویسد، درخواست‌های /shows و /search همان را به‌صورت
   Bearer می‌فرستند و «دنبال‌شده‌ها» از سرور می‌آید. (try/catch — حافظهٔ
   محلی ممکن است در حالت‌های حریم خصوصی نباشد) */
const ACCESS_TOKEN_KEY = "liveshop.accessToken";

export function getStoredAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

/* ── حالت API واقعی: GET /api/v1/shows?status=LIVE&limit=&cursor= ── */

async function fetchApiLiveShowsPage(
  cursor?: string
): Promise<LiveShowsPage> {
  const params = new URLSearchParams({
    status: "LIVE",
    limit: String(LIVE_SHOWS_PAGE_SIZE),
  });
  if (cursor) params.set("cursor", cursor);
  const token = getStoredAccessToken();
  const res = await fetch(`/api/v1/shows?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    throw new Error(`GET /shows failed: ${res.status}`);
  }
  const data = (await res.json()) as ApiShowsResponse;
  return {
    shows: data.shows.map((s) => apiShowToUiShow(s)),
    nextCursor: data.nextCursor,
  };
}

/* ── حالت mock: همان LIVE_SHOWS، برش‌شده به صفحات با cursor عددی ── */

const MOCK_DELAY_MS = 350;

export async function fetchMockLiveShowsPage(
  cursor?: string
): Promise<LiveShowsPage> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  const start = cursor ? Number(cursor) : 0;
  if (Number.isNaN(start) || start < 0 || start >= LIVE_SHOWS.length) {
    return { shows: [], nextCursor: null };
  }
  const shows = LIVE_SHOWS.slice(start, start + LIVE_SHOWS_PAGE_SIZE);
  const next = start + LIVE_SHOWS_PAGE_SIZE;
  return {
    shows,
    nextCursor: next < LIVE_SHOWS.length ? String(next) : null,
  };
}

/**
 * هوک فید لایو خانه — صفحه‌بندی cursor با useInfiniteQuery.
 * shows = ادغام صفحات بارگذاری‌شده (به‌ترتیب).
 */
export function useLiveShows() {
  const q = useInfiniteQuery({
    queryKey: ["live-shows", USE_LIVE_API ? "api" : "mock"],
    initialPageParam: undefined as string | undefined,
    queryFn: ({
      pageParam,
    }: {
      pageParam: string | undefined;
    }): Promise<LiveShowsPage> =>
      USE_LIVE_API
        ? fetchApiLiveShowsPage(pageParam)
        : fetchMockLiveShowsPage(pageParam),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const shows: Show[] = q.data
    ? q.data.pages.flatMap((p) => p.shows)
    : [];

  return {
    ...q,
    shows,
    hasMore: q.hasNextPage,
    loadMore: () => {
      if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
    },
  };
}
