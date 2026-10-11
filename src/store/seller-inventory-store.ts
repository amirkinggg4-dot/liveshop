"use client";

import { create } from "zustand";
import type { ShopItem } from "@/lib/data/types";
import { ITEMS_SH1 } from "@/lib/data/items";
import { LOW_STOCK_THRESHOLD } from "@/lib/config";

/* ─────────────────────────────────────────────────────────────
   v1.7.0 — انبار فروشنده (بخش ۶ قرارداد API — CRUD کالا)
   ساختار داده هم‌شکل ShopItem / Variant است تا بعداً به
   POST/PATCH/DELETE /seller/products و /seller/products/:id/variants
   وصل شود. قوانین امروز API همین‌جا شبیه‌سازی می‌شوند:
   ─ کالای در شو فعال (auction/up_next) قفل است — ویرایش/حذف ندارد
   ─ ویرایش موجودی هر گزینهٔ سایز جدا با ± و سریع
   ─ موجودی کل با واریانت‌ها جمع خودکار می‌شود
   seed: کپی مستقل از ITEMS_SH1 (صفحات فروشنده این کپی را ویرایش می‌کنند؛
   اتاق لایو مثل قبل از دیتای ثابت می‌خواند — reset با رفرش صفحه).
   ───────────────────────────────────────────────────────────── */

let copyCounter = 0;

interface SellerInventoryState {
  items: ShopItem[];

  /** ویرایش فیلدهای کالا — اگر variants دارد موجودی کل خودکار جمع می‌شود */
  updateItem: (id: string, patch: Partial<ShopItem>) => void;
  /** ± سریع موجودی یک گزینهٔ سایز/رنگ (کف ۰) */
  adjustVariantStock: (id: string, variantLabel: string, delta: number) => void;
  /** کپی کالا — رونوشت قابل‌ویرایش با وضعیت buy_now */
  duplicateItem: (id: string) => ShopItem | null;
  /** حذف کالا — فقط اگر در شو فعال نباشد (برمی‌گرداند انجام شد یا نه) */
  removeItem: (id: string) => boolean;
}

/** آیا کالا در شو فعال است؟ (همان قفل فعلی انبار) */
export function isItemLocked(item: ShopItem): boolean {
  return item.status === "auction" || item.status === "up_next";
}

/** هشدار موجودی کم — کمتر از آستانه (۳) و تمام‌نشده */
export function isLowStock(item: ShopItem): boolean {
  return item.stock > 0 && item.stock < LOW_STOCK_THRESHOLD;
}

const SEED: ShopItem[] = ITEMS_SH1.map((i) => ({
  ...i,
  variants: i.variants?.map((v) => ({ ...v })),
}));

export const useSellerInventoryStore = create<SellerInventoryState>((set, get) => ({
  items: SEED,

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((it) => {
        if (it.id !== id) return it;
        if (isItemLocked(it)) return it; // قفل شو فعال
        const next: ShopItem = { ...it, ...patch };
        if (next.variants && next.variants.length > 0) {
          next.stock = next.variants.reduce((a, v) => a + v.stock, 0);
        }
        return next;
      }),
    })),

  adjustVariantStock: (id, variantLabel, delta) =>
    set((s) => ({
      items: s.items.map((it) => {
        if (it.id !== id || isItemLocked(it) || !it.variants) return it;
        const variants = it.variants.map((v) =>
          v.label === variantLabel ? { ...v, stock: Math.max(0, v.stock + delta) } : v
        );
        return {
          ...it,
          variants,
          stock: variants.reduce((a, v) => a + v.stock, 0),
        };
      }),
    })),

  duplicateItem: (id) => {
    const src = get().items.find((i) => i.id === id);
    if (!src) return null;
    copyCounter += 1;
    const copy: ShopItem = {
      ...src,
      id: `copy-${copyCounter}-${src.id}`,
      sku: `${src.sku}-C${copyCounter}`,
      status: "buy_now",
      title: `${src.title} (کپی)`,
      variants: src.variants?.map((v) => ({ ...v })),
      currentBid: undefined,
      soldPrice: undefined,
      soldTo: undefined,
    };
    set((s) => ({ items: [...s.items, copy] }));
    return copy;
  },

  removeItem: (id) => {
    const src = get().items.find((i) => i.id === id);
    if (!src || isItemLocked(src)) return false;
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
    return true;
  },
}));
