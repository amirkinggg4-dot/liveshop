"use client";

/* ─────────────────────────────────────────────────────────────
   v1.6.1 — لایهٔ دادهٔ خانه: useCategories (React Query)
   ─ NEXT_PUBLIC_USE_API=true → GET /api/v1/categories (spec §2)
   ─ در غیر این صورت همان mock قبلی (CATEGORIES)
   ─ نوع خروجی هر دو حالت یکی است: Category[] (lib/data/types)
   پیش‌فرض: flag خاموش (mock).
   ───────────────────────────────────────────────────────────── */

import { useQuery } from "@tanstack/react-query";
import { CATEGORIES } from "@/lib/data/categories";
import type { Category } from "@/lib/data/types";

/* ── شکل پاسخ API (route ‏/api/v1/categories) ── */

export interface ApiCategory {
  id: string;
  slug: string;
  nameFa: string;
  liveShowCount: number;
  showCount: number;
  productCount: number;
}

export interface ApiCategoriesResponse {
  categories: ApiCategory[];
}

/** تبدیل پاسخ API به تایپ UI (Category) — بدون خطا روی فیلدهای null */
export function apiCategoryToUiCategory(raw: ApiCategory): Category {
  return {
    id: raw.id,
    label: raw.nameFa,
    /* API ایموجی ندارد — کارت دسته از عکس/آیکون lucide استفاده می‌کند */
    emoji: "",
    liveCount: raw.liveShowCount,
  };
}

/** flag — پیش‌فرض خاموش؛ فقط با NEXT_PUBLIC_USE_API="true" روشن می‌شود */
const USE_API = process.env.NEXT_PUBLIC_USE_API === "true";

async function fetchApiCategories(): Promise<Category[]> {
  const res = await fetch("/api/v1/categories");
  if (!res.ok) throw new Error(`GET /categories failed: ${res.status}`);
  const data = (await res.json()) as ApiCategoriesResponse;
  return data.categories.map(apiCategoryToUiCategory);
}

async function fetchMockCategories(): Promise<Category[]> {
  await new Promise((r) => setTimeout(r, 150));
  return CATEGORIES;
}

/** هوک دسته‌بندی‌های خانه */
export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: ["categories", USE_API ? "api" : "mock"],
    queryFn: USE_API ? fetchApiCategories : fetchMockCategories,
  });
}
