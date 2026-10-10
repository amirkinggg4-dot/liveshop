"use client";

/* ─────────────────────────────────────────────────────────────
   v1.6.2 — کارت کوچک کالا در نتایج جستجوی کاوش
   عکس + عنوان (≤۲ خط) + قیمت کامل در ردیف جدا + موجودی در ردیف
   جدا + «در لایوی فلان» — لمس کارت به همان شو می‌برد.
   هیچ متنی با «…» بریده نمی‌شود (عنوان می‌شکند، فروشنده کامل).
   ───────────────────────────────────────────────────────────── */

import { Radio } from "lucide-react";
import { GradientCover, SmartImg } from "@/components/liveshop/shared";
import { toman } from "@/lib/format";
import { stockLabelFa } from "@/lib/data/items";
import type { ProductResult } from "@/hooks/useSearch";
import { cn } from "@/lib/utils";

export default function ProductResultCard({
  product,
  onClick,
}: {
  product: ProductResult;
  onClick?: () => void;
}) {
  const lowStock = product.stock > 0 && product.stock < 3;
  return (
    <button
      onClick={onClick}
      aria-label={`کالا ${product.title}${product.showTitle ? ` — در لایوی ${product.showTitle}` : ""}`}
      className="group text-right w-full overflow-hidden rounded-2xl border border-white/5 bg-ls-card transition-transform active:scale-[.98] hover:border-ls-purple/40"
    >
      {/* عکس کالا (fallback: گرادیان برند) */}
      <div className="relative h-28 w-full">
        {product.image ? (
          <SmartImg
            src={product.image}
            alt={`تصویر کالای ${product.title}`}
            sizes="(max-width: 640px) 45vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <GradientCover
            cover={{ from: "#6C5CFF", to: "#FF3B8B", emoji: "🛍️" }}
            className="absolute inset-0"
            emojiClassName="text-4xl"
          />
        )}
      </div>

      <div className="space-y-1 p-2.5">
        {/* عنوان — حداکثر ۲ خط (تنها جای شکستن) */}
        <p className="line-clamp-2 min-h-10 text-xs font-extrabold leading-5 text-white">
          {product.title}
        </p>
        {product.brand && (
          <p className="break-words text-[10px] font-bold text-white/45">
            {product.brand}
          </p>
        )}

        {/* قیمت — ردیف جدا و همیشه کامل («تومان» کامل، ارقام فارسی) */}
        <span className="block whitespace-nowrap text-[11px] font-black tabular-nums text-ls-green">
          {toman(product.price)}
        </span>

        {/* موجودی — ردیف جدا */}
        <div className="flex">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap",
              product.stock <= 0
                ? "border-white/15 bg-white/10 text-white/60"
                : lowStock
                  ? "border-amber-300/40 bg-amber-300/10 text-amber-300"
                  : "border-ls-green/40 bg-ls-green/10 text-ls-green"
            )}
            aria-live="polite"
          >
            {stockLabelFa(product.stock)}
          </span>
        </div>

        {/* «در لایوی فلان» — بدون بریدن */}
        {product.showTitle && (
          <p className="flex items-start gap-1 pt-0.5 text-[10px] font-bold leading-4 text-ls-purple-soft">
            <Radio className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">
              در لایوی {product.showTitle}
            </span>
          </p>
        )}
      </div>
    </button>
  );
}
