"use client";

/* ─────────────────────────────────────────────────────────────
   v1.6.2 — لایهٔ دادهٔ جستجوی کاوش: useSearch (React Query)
   ─ NEXT_PUBLIC_USE_API=true → GET /api/v1/search?q=
     (قرارداد docs/api-spec.md §2 — شوها، فروشندگان، کالاها)
   ─ در غیر این صورت جستجوی mock روی همان دیتای محلی با نرمال‌سازی
     فارسی (ی/ي، ک/ك، ارقام فارسی/لاتین) — src/lib/persian.ts
   ─ نوع خروجی هر دو حالت یکی است: SearchResults
   پیش‌فرض: flag خاموش (mock). حداقل ۲ نویسه (مطابق قرارداد API).
   ───────────────────────────────────────────────────────────── */

import { useQuery } from "@tanstack/react-query";
import { ALL_ITEMS } from "@/lib/data/items";
import { ITEM_PHOTO } from "@/lib/data/media";
import { SHOWS, SELLERS, getShow } from "@/lib/data/shows";
import { faIncludes, normalizeFa } from "@/lib/persian";
import type { Show } from "@/lib/data/types";
import {
  apiShowToUiShow,
  USE_LIVE_API,
  type ApiShowCard,
} from "./useLiveShows";

/* ── تایپ‌های UI (خروجی یکسان mock/API) ── */

/** کالای نتیجهٔ جستجو — «در لایوی …» به همان شو می‌برد */
export interface ProductResult {
  id: string;
  title: string;
  brand: string;
  image: string | null;
  price: number;
  stock: number;
  /** شو میزبان (mock همیشه دارد؛ API فعلی showId برنمی‌گرداند → null) */
  showId: string | null;
  showTitle: string | null;
  /* برای فیلتر سایز/وضعیت — API فعلی این‌ها را ندارد → null */
  size: string | null;
  variantLabels: string[];
  condition: string | null;
}

export interface SellerResult {
  id: string;
  name: string;
  handle: string;
  verified: boolean;
  /** API فعلی rating برنمی‌گرداند → null یعنی مخفی */
  rating: number | null;
  ratingsCount: number | null;
  followers: number | null;
  /** mock: ایموجی/رنگ برند؛ API: avatarUrl (اولویت با avatarUrl) */
  emoji: string;
  color: string;
  avatarUrl: string | null;
}

export interface SearchResults {
  shows: Show[];
  products: ProductResult[];
  sellers: SellerResult[];
}

export const EMPTY_SEARCH: SearchResults = {
  shows: [],
  products: [],
  sellers: [],
};

/* ── شکل پاسخ GET /api/v1/search (src/app/api/v1/search/route.ts) ── */

export interface ApiSearchResponse {
  query: string;
  shows: ApiShowCard[];
  sellers: {
    id: string;
    shopName: string;
    slug: string;
    avatarUrl: string | null;
    verified: boolean;
    followersCount: number;
  }[];
  products: {
    id: string;
    title: string;
    brand: string | null;
    image: string | null;
    price: number;
    seller: { shopName: string; slug: string };
    totalStock: number;
  }[];
}

/** تبدیل پاسخ /search به تایپ UI — بدون خطا روی فیلدهای null */
export function apiSearchToUi(raw: ApiSearchResponse): SearchResults {
  return {
    shows: raw.shows
      .map((s) => apiShowToUiShow(s))
      .filter((s) => s.status === "live" || s.status === "upcoming"),
    products: raw.products.map((p) => ({
      id: p.id,
      title: p.title,
      brand: p.brand ?? "",
      image: p.image ?? null,
      price: p.price,
      stock: p.totalStock ?? 0,
      showId: null,
      showTitle: null,
      size: null,
      variantLabels: [],
      condition: null,
    })),
    sellers: raw.sellers.map((s) => ({
      id: s.id,
      name: s.shopName,
      handle: s.slug,
      verified: s.verified,
      rating: null,
      ratingsCount: null,
      followers: s.followersCount ?? null,
      emoji: "🛍️",
      color: "#6C5CFF",
      avatarUrl: s.avatarUrl ?? null,
    })),
  };
}

/* ── جستجوی mock با نرمال‌سازی فارسی ── */

const MOCK_DELAY_MS = 300;

export function searchMock(query: string): SearchResults {
  if (normalizeFa(query).length === 0) return EMPTY_SEARCH;
  const shows = SHOWS.filter(
    (s) => faIncludes(s.title, query) || faIncludes(s.category, query)
  );
  const products = ALL_ITEMS.filter(
    (i) => faIncludes(i.title, query) || faIncludes(i.brand, query)
  ).map((i) => ({
    id: i.id,
    title: i.title,
    brand: i.brand,
    image: ITEM_PHOTO[i.id] ?? null,
    price: i.price,
    stock: i.variants?.length
      ? i.variants.reduce((sum, v) => sum + v.stock, 0)
      : i.stock,
    showId: i.showId,
    showTitle: getShow(i.showId).title,
    size: i.size ?? null,
    variantLabels: (i.variants ?? []).map((v) => v.label),
    condition: i.condition,
  }));
  const sellers = SELLERS.filter(
    (s) => faIncludes(s.name, query) || faIncludes(s.handle, query)
  ).map((s) => ({
    id: s.id,
    name: s.name,
    handle: s.handle,
    verified: s.verified,
    rating: s.rating,
    ratingsCount: s.ratingsCount,
    followers: s.followers,
    emoji: s.emoji,
    color: s.color,
    avatarUrl: null,
  }));
  return { shows, products, sellers };
}

async function fetchMockSearch(query: string): Promise<SearchResults> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  return searchMock(query);
}

/* ── حالت API واقعی ── */

async function fetchApiSearch(query: string): Promise<SearchResults> {
  const res = await fetch(
    `/api/v1/search?q=${encodeURIComponent(query.trim())}`
  );
  if (!res.ok) throw new Error(`GET /search failed: ${res.status}`);
  const data = (await res.json()) as ApiSearchResponse;
  return apiSearchToUi(data);
}

/**
 * هوک جستجوی کاوش — فعال از ۲ نویسه به بعد (مطابق قرارداد API).
 * کلید کوئری با متنِ نرمال‌شده است تا «كتاب» و «کتاب» یک کش داشته باشند.
 */
export function useSearch(query: string) {
  const normalized = normalizeFa(query);
  const enabled = normalized.length >= 2;
  return useQuery<SearchResults, Error>({
    queryKey: ["search", USE_LIVE_API ? "api" : "mock", normalized],
    queryFn: () =>
      USE_LIVE_API ? fetchApiSearch(query) : fetchMockSearch(query),
    enabled,
    /* حین تایپ نتایج قبلی می‌ماند — پرش چشمک‌زا ندارد */
    placeholderData: (prev) => prev,
  });
}
