/* ─────────────────────────────────────────────────────────────
   v1.6.2 — فیلترهای کاوش: تایپ، شمارش، چیپ‌های فعال و منطق اعمال
   ─ بازهٔ قیمت، سایز، برند، وضعیت کالا (نو/دست‌دوم)، فقط زنده
   ─ مرتب‌سازی: محبوب‌ترین، تازه‌ترین، ارزان‌ترین، گران‌ترین
   ───────────────────────────────────────────────────────────── */

import type { ShopItem, Show } from "@/lib/data/types";
import { getPinnedItem } from "@/lib/data/items";

export interface ExploreFilters {
  minPrice: number | null;
  maxPrice: number | null;
  sizes: string[];
  brands: string[];
  /** null = بدون فیلتر وضعیت */
  condition: "new" | "used" | null;
}

export const EMPTY_FILTERS: ExploreFilters = {
  minPrice: null,
  maxPrice: null,
  sizes: [],
  brands: [],
  condition: null,
};

export type SortId = "popular" | "newest" | "cheapest" | "expensive";

export const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "popular", label: "محبوب‌ترین" },
  { id: "newest", label: "تازه‌ترین" },
  { id: "cheapest", label: "ارزان‌ترین" },
  { id: "expensive", label: "گران‌ترین" },
];

export function sortLabel(id: SortId): string {
  return SORT_OPTIONS.find((s) => s.id === id)?.label ?? "محبوب‌ترین";
}

/* ── گزینه‌های فیلتر از دیتای mock ── */

const SIZE_ORDER = ["۴۰", "۴۱", "۴۲", "۴۲.۵", "۴۳", "۴۴"];

export function availableSizes(items: ShopItem[]): string[] {
  const set = new Set<string>();
  for (const it of items) {
    if (it.size) set.add(it.size);
    for (const v of it.variants ?? []) {
      if (/^[۰-۹0-9]/.test(v.label)) set.add(v.label); /* فقط سایز عددی */
    }
  }
  return [...set].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
}

export function availableBrands(items: ShopItem[]): string[] {
  return [...new Set(items.map((i) => i.brand))];
}

/* ── قیمت پین‌شدهٔ شو (mock: از getPinnedItem؛ API: فیلد خود Show) ── */

export function showPinnedPrice(show: Show): number | null {
  if (show.pinnedPrice !== undefined) return show.pinnedPrice;
  return getPinnedItem(show.id)?.price ?? null;
}

/* ── شمارش فیلترهای فعال (بدون «فقط زنده» — پیش‌فرض پایه است) ── */

export function filtersCount(f: ExploreFilters): number {
  let n = 0;
  if (f.minPrice != null || f.maxPrice != null) n += 1;
  n += f.sizes.length;
  n += f.brands.length;
  if (f.condition != null) n += 1;
  return n;
}

export interface ActiveChip {
  key: string;
  label: string;
  clear: (f: ExploreFilters) => ExploreFilters;
}

/** چیپ‌های قابل‌حذف فیلتر فعال */
export function activeFilterChips(f: ExploreFilters): ActiveChip[] {
  const chips: ActiveChip[] = [];
  if (f.minPrice != null || f.maxPrice != null) {
    const from = f.minPrice != null ? f.minPrice.toLocaleString("fa-IR") : "";
    const to = f.maxPrice != null ? f.maxPrice.toLocaleString("fa-IR") : "";
    chips.push({
      key: "price",
      label:
        f.minPrice != null && f.maxPrice != null
          ? `قیمت: ${from} تا ${to}`
          : f.minPrice != null
            ? `قیمت: از ${from}`
            : `قیمت: تا ${to}`,
      clear: (x) => ({ ...x, minPrice: null, maxPrice: null }),
    });
  }
  for (const s of f.sizes) {
    chips.push({
      key: `size:${s}`,
      label: `سایز ${s}`,
      clear: (x) => ({ ...x, sizes: x.sizes.filter((v) => v !== s) }),
    });
  }
  for (const b of f.brands) {
    chips.push({
      key: `brand:${b}`,
      label: b,
      clear: (x) => ({ ...x, brands: x.brands.filter((v) => v !== b) }),
    });
  }
  if (f.condition != null) {
    chips.push({
      key: "condition",
      label: f.condition === "new" ? "نو" : "دست‌دوم",
      clear: (x) => ({ ...x, condition: null }),
    });
  }
  return chips;
}

/* ── منطق اعمال فیلتر ── */

function priceInRange(price: number, f: ExploreFilters): boolean {
  if (f.minPrice != null && price < f.minPrice) return false;
  if (f.maxPrice != null && price > f.maxPrice) return false;
  return true;
}

export function filterItem(item: ShopItem, f: ExploreFilters): boolean {
  return filterProductResult(
    {
      price: item.price,
      brand: item.brand,
      size: item.size ?? null,
      variantLabels: (item.variants ?? []).map((v) => v.label),
      condition: item.condition,
    },
    f
  );
}

/** فیلتر روی نتیجهٔ جستجوی کالا (کارت کوچک) — فیلدهای نال = نام‌شناخته و رد */
export function filterProductResult(
  p: {
    price: number;
    brand: string;
    size?: string | null;
    variantLabels?: string[];
    condition?: string | null;
  },
  f: ExploreFilters
): boolean {
  if (!priceInRange(p.price, f)) return false;
  if (f.brands.length > 0 && !f.brands.includes(p.brand)) return false;
  if (f.condition != null) {
    if (!p.condition) return false;
    const isNew = p.condition.startsWith("نو");
    const isUsed =
      p.condition === "در حد نو" || p.condition === "کارکرده";
    if (f.condition === "new" ? !isNew : !isUsed) return false;
  }
  if (f.sizes.length > 0) {
    const labels = [p.size ?? "", ...(p.variantLabels ?? [])];
    if (!f.sizes.some((s) => labels.includes(s))) return false;
  }
  return true;
}

/** فیلتر شو: فقط بازهٔ قیمت روی کالای پین‌شده (شوی بی‌قیمت رد می‌شود) */
export function filterShow(show: Show, f: ExploreFilters): boolean {
  if (f.minPrice == null && f.maxPrice == null) return true;
  const price = showPinnedPrice(show);
  return price != null && priceInRange(price, f);
}

/* ── مرتب‌سازی ── */

export function sortProducts<T extends { price: number }>(
  list: T[],
  sort: SortId
): T[] {
  const arr = [...list];
  if (sort === "cheapest") arr.sort((a, b) => a.price - b.price);
  if (sort === "expensive") arr.sort((a, b) => b.price - a.price);
  return arr;
}

export function sortShows(list: Show[], sort: SortId): Show[] {
  const arr = [...list];
  if (sort === "popular") arr.sort((a, b) => b.viewers - a.viewers);
  if (sort === "cheapest")
    arr.sort(
      (a, b) =>
        (showPinnedPrice(a) ?? Infinity) - (showPinnedPrice(b) ?? Infinity)
    );
  if (sort === "expensive")
    arr.sort((a, b) => (showPinnedPrice(b) ?? -1) - (showPinnedPrice(a) ?? -1));
  /* «تازه‌ترین» در mock ترتیب فهرست (جدیدترین اول) می‌ماند */
  return arr;
}
