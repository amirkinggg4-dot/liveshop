"use client";

/* ─────────────────────────────────────────────────────────────
   v1.6.2 — لایهٔ دادهٔ فهرست شوهای کاوش: useExploreShows (React Query)
   ─ NEXT_PUBLIC_USE_API=true → GET /api/v1/shows?status=LIVE و
     ‏?status=SCHEDULED (قرارداد docs/api-spec.md §2) با ?category=slug
   ─ در غیر این صورت همان mock قبلی (LIVE_SHOWS + UPCOMING_SHOWS)
   ─ نوع خروجی هر دو حالت یکی است: ExploreShowsPage { live, upcoming }
   پیش‌فرض: flag خاموش (mock).
   ───────────────────────────────────────────────────────────── */

import { useQuery } from "@tanstack/react-query";
import { LIVE_SHOWS, UPCOMING_SHOWS } from "@/lib/data/shows";
import type { Show } from "@/lib/data/types";
import type { SortId } from "@/components/liveshop/views/explore/filters";
import {
  apiShowToUiShow,
  USE_LIVE_API,
  type ApiShowsResponse,
} from "./useLiveShows";

export interface ExploreShowsPage {
  live: Show[];
  upcoming: Show[];
}

const MOCK_DELAY_MS = 250;

/** mock — فیلتر با برچسب فارسی دسته (Show.category در mock فارسی است) */
export async function fetchMockExploreShows(
  categoryLabel: string | null
): Promise<ExploreShowsPage> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  return {
    live: categoryLabel
      ? LIVE_SHOWS.filter((s) => s.category === categoryLabel)
      : [...LIVE_SHOWS],
    upcoming: categoryLabel
      ? UPCOMING_SHOWS.filter((s) => s.category === categoryLabel)
      : [...UPCOMING_SHOWS],
  };
}

/** حالت API — دو درخواست موازی LIVE + SCHEDULED با slug دسته.
    v1.6.3 — sort به سرور پاس می‌شود (popular|newest|price_asc|price_desc) */
const API_SORT: Record<SortId, string> = {
  popular: "popular",
  newest: "newest",
  cheapest: "price_asc",
  expensive: "price_desc",
};

async function fetchApiExploreShows(
  categorySlug: string | null,
  sort: SortId
): Promise<ExploreShowsPage> {
  const params = new URLSearchParams({ sort: API_SORT[sort] });
  if (categorySlug) params.set("category", categorySlug);
  const qs = params.toString();
  const [liveRes, schedRes] = await Promise.all([
    fetch(`/api/v1/shows?status=LIVE&${qs}`),
    fetch(`/api/v1/shows?status=SCHEDULED&${qs}`),
  ]);
  if (!liveRes.ok || !schedRes.ok) {
    throw new Error(
      `GET /shows failed: ${liveRes.status}/${schedRes.status}`
    );
  }
  const live = ((await liveRes.json()) as ApiShowsResponse).shows.map(
    (s) => apiShowToUiShow(s, "live")
  );
  const upcoming = ((await schedRes.json()) as ApiShowsResponse).shows.map(
    (s) => apiShowToUiShow(s, "upcoming")
  );
  return { live, upcoming };
}

/**
 * هوک فهرست شوهای کاوش — زنده‌ها و به‌زودی‌ها جدا (UI همان کارت‌های
 * خانه را می‌گذارد: LiveGridCard برای زنده، کارت «به‌زودی» برای آینده).
 * v1.6.3 — sort اختیاری: در حالت API به سرور پاس می‌شود.
 */
export function useExploreShows(
  category: {
    id: string;
    label: string;
  } | null,
  sort: SortId = "popular"
) {
  return useQuery<ExploreShowsPage, Error>({
    queryKey: [
      "explore-shows",
      USE_LIVE_API ? "api" : "mock",
      category?.id ?? null,
      USE_LIVE_API ? sort : "client-side",
    ],
    queryFn: () =>
      USE_LIVE_API
        ? fetchApiExploreShows(category?.id ?? null, sort)
        : fetchMockExploreShows(category?.label ?? null),
  });
}
