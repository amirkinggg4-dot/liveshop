"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  Layers,
  Lock,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppStore } from "@/store/app-store";
import { useSellerStore } from "@/store/seller-store";
import { useSellerGate } from "@/store/seller-onboarding-store";
import {
  useSellerInventoryStore,
  isItemLocked,
  isLowStock,
} from "@/store/seller-inventory-store";
import { INVENTORY_EXTRAS } from "@/lib/data/seller";
import { cn } from "@/lib/utils";
import { faNum, toFa } from "@/lib/format";
import { getShow } from "@/lib/data/shows";
import type { ShopItem } from "@/lib/data/types";
import {
  PageHeader,
  GradientCover,
  Price,
  StatusChip,
  Chip,
  EmptyState,
} from "@/components/liveshop/shared";
import { AUCTION_ENABLED, LOW_STOCK_THRESHOLD } from "@/lib/config";
import { ITEM_PHOTO } from "@/lib/data/media";
import { ProductEditDialog } from "@/components/liveshop/product-edit-dialog";

/* ─────────────────────────────────────────────────────────────
   انبار کالا — v1.7.1 (بخش ۶ قرارداد API: CRUD /seller/products)
   ─ عکس اصلی کالا (fallback = گرادیان + ایموجی)
   ─ دیالوگ کامل ویرایش کالا: همهٔ فیلدهای لیستینگ
     (product-edit-dialog.tsx) + کپی و حذف با دیالوگ تأیید
   ─ موجودی سریع هر گزینهٔ سایز/رنگ جدا با +/− («ویرایش موجودی»)
   ─ هشدار و فیلتر «موجودی کم» (کمتر از ۳)
   ─ کالای در شو فعال قفل می‌ماند (همان رفتار قبلی)
   ─ عنوان کالا حداکثر ۲ خط، بدون «…»
   ───────────────────────────────────────────────────────────── */

function priceOf(item: ShopItem): number {
  return AUCTION_ENABLED
    ? item.currentBid ?? item.buyNowPrice ?? item.soldPrice ?? item.startPrice
    : item.price;
}

/* v1.4 — فیلترهای حالت قیمت ثابت + v1.7.0 «موجودی کم» */
type FixedFilter = "available" | "inshow" | "soldout" | "lowstock" | "draft";

function isAvailable(item: ShopItem): boolean {
  return item.status !== "sold" && item.stock > 0 && item.status !== "up_next" && item.status !== "auction";
}
function isInShow(item: ShopItem): boolean {
  return item.status === "up_next" || item.status === "auction";
}
function isSoldOut(item: ShopItem): boolean {
  return item.status === "sold" || item.stock <= 0;
}

/* ═══ ردیف موجودی گزینهٔ سایز با +/− سریع ═══ */
function VariantStockRow({
  itemId,
  label,
  stock,
  disabled,
}: {
  itemId: string;
  label: string;
  stock: number;
  disabled: boolean;
}) {
  const adjustVariantStock = useSellerInventoryStore((s) => s.adjustVariantStock);
  const low = stock > 0 && stock < LOW_STOCK_THRESHOLD;
  return (
    <div
      className="flex items-center gap-2 rounded-lg bg-ls-card-2/70 border border-white/5 px-2.5 py-1.5"
      aria-label={`موجودی گزینهٔ ${label}: ${faNum(stock)}`}
    >
      <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white/80">
        سایز {toFa(label)}
      </span>
      <span
        className={cn(
          "shrink-0 text-[11px] font-black tabular-nums",
          stock <= 0
            ? "text-white/35"
            : low
              ? "text-amber-300"
              : "text-ls-green"
        )}
      >
        {stock <= 0 ? "تمام" : faNum(stock)}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => {
            if (disabled) {
              toast("آیتم در شو فعال است — ویرایش قفل است");
              return;
            }
            adjustVariantStock(itemId, label, -1);
          }}
          disabled={stock <= 0}
          aria-label={`کم‌کردن موجودی گزینهٔ ${label}`}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-white/15 text-white/70 hover:bg-white/5 disabled:opacity-30 transition-colors"
        >
          <Minus className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            if (disabled) {
              toast("آیتم در شو فعال است — ویرایش قفل است");
              return;
            }
            adjustVariantStock(itemId, label, +1);
          }}
          aria-label={`بیش‌کردن موجودی گزینهٔ ${label}`}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-ls-green/40 bg-ls-green/10 text-ls-green hover:bg-ls-green/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </span>
    </div>
  );
}

export default function SellerInventoryView() {
  const back = useAppStore((s) => s.back);
  const push = useAppStore((s) => s.push);
  const [query, setQuery] = useState("");

  /* v1.7.0 — گیت onboarding: لیستینگ جدید تا تأیید فروشندگی غیرفعال است */
  const gate = useSellerGate();

  /* فاز ۲ — فیلتر وضعیت انبار + پیش‌نویس‌های فروشنده
     v1.4 — در حالت قیمت ثابت: موجود / تمام‌شده / در شو / پیش‌نویس
     v1.7.0 — فیلتر «موجودی کم» */
  const [filter, setFilter] = useState<
    "all" | "auction" | "up_next" | "buy_now" | "sold" | "draft" | FixedFilter
  >(AUCTION_ENABLED ? "all" : "available");
  const drafts = useSellerStore((s) => s.drafts);

  /* v1.7.0 — منبع دادهٔ انبار: استور کپی‌شدنی (CRUD mock) */
  const items = useSellerInventoryStore((s) => s.items);
  const duplicateItem = useSellerInventoryStore((s) => s.duplicateItem);
  const removeItem = useSellerInventoryStore((s) => s.removeItem);

  /* ردیف بازشدهٔ واریانت‌ها */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /* دیالوگ‌ها */
  const [editFor, setEditFor] = useState<string | null>(null);
  const [deleteFor, setDeleteFor] = useState<string | null>(null);

  const total = getShow("sh1").itemsTotal;
  const q = query.trim().toLowerCase();

  const searched = useMemo(
    () => (q ? items.filter((i) => i.title.toLowerCase().includes(q)) : items),
    [items, q]
  );

  /* فاز ۲ — منبع نهایی لیست بر اساس فیلتر وضعیت (پیش‌نویس‌ها جدا رندر می‌شوند) */
  const visible =
    filter === "all"
      ? searched
      : filter === "available"
        ? searched.filter(isAvailable)
        : filter === "inshow"
          ? searched.filter(isInShow)
          : filter === "soldout"
            ? searched.filter(isSoldOut)
            : filter === "lowstock"
              ? searched.filter(isLowStock)
              : filter === "draft"
                ? searched
                : searched.filter((i) => i.status === filter);

  const availableCount = items.filter(isAvailable).length;
  const inShowCount = items.filter(isInShow).length;
  const soldOutCount = items.filter(isSoldOut).length;
  const lowStockCount = items.filter(isLowStock).length;
  const auctionCount = items.filter((i) => i.status === "auction").length;
  const soldCount = items.filter((i) => i.status === "sold").length;

  const editItem = items.find((i) => i.id === editFor) ?? null;
  const deleteItem = items.find((i) => i.id === deleteFor) ?? null;

  const onDuplicate = (item: ShopItem) => {
    const copy = duplicateItem(item.id);
    if (copy) {
      toast.success(`رونوشت «${item.title}» در انبار ساخته شد`);
    }
  };

  const onDeleteConfirm = () => {
    if (!deleteFor) return;
    const ok = removeItem(deleteFor);
    setDeleteFor(null);
    if (ok) {
      toast.success("کالا از انبار حذف شد");
    } else {
      toast.error("کالای در شو فعال حذف نمی‌شود");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="انبار کالا"
        subtitle={`${faNum(total)} آیتم`}
        onBack={back}
      />

      <div className="px-4 pt-4 pb-4 space-y-4">
        {/* چیپ‌های شمارش وضعیت — v1.4 + v1.7.0 هشدار موجودی کم */}
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar"
          aria-label="خلاصهٔ وضعیت آیتم‌ها"
        >
          <Chip className="shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-ls-green" aria-hidden />
            موجود {faNum(availableCount)}
          </Chip>
          <Chip className="shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-ls-purple" aria-hidden />
            در شو {faNum(inShowCount)}
          </Chip>
          <Chip className="shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" aria-hidden />
            تمام‌شده {faNum(soldOutCount)}
          </Chip>
          {lowStockCount > 0 && (
            <Chip className="shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300" aria-hidden />
              موجودی کم {faNum(lowStockCount)}
            </Chip>
          )}
        </div>

        {/* فیلتر وضعیت — v1.7.0: «موجودی کم» اضافه شد */}
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar"
          aria-label="فیلتر وضعیت انبار"
        >
          {(AUCTION_ENABLED
            ? [
                { key: "all", label: "همه" },
                { key: "auction", label: "در مزایده" },
                { key: "up_next", label: "آیتم بعدی" },
                { key: "buy_now", label: "خرید فوری" },
                { key: "sold", label: "فروخته" },
                { key: "lowstock", label: `موجودی کم (${faNum(lowStockCount)})` },
                { key: "draft", label: `پیش‌نویس (${faNum(drafts.length)})` },
              ]
            : [
                { key: "available", label: "موجود" },
                { key: "inshow", label: "در شو" },
                { key: "soldout", label: "تمام‌شده" },
                { key: "lowstock", label: `موجودی کم (${faNum(lowStockCount)})` },
                { key: "draft", label: `پیش‌نویس (${faNum(drafts.length)})` },
                { key: "all", label: "همه" },
              ]
          ).map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key as typeof filter)}
              aria-pressed={filter === c.key}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                filter === c.key
                  ? "bg-ls-purple text-white"
                  : "bg-ls-card-2 text-white/60 hover:text-white"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* جستجو */}
        <div className="relative">
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی آیتم…"
            aria-label="جستجوی آیتم در انبار"
            className="pr-9 bg-ls-card border-white/10 rounded-xl h-10 text-sm placeholder:text-white/35"
          />
        </div>

        {/* لیست آیتم‌ها — پیش‌نویس‌ها جدا */}
        {filter === "draft" ? (
          drafts.length > 0 ? (
            <div
              className="space-y-2.5 max-h-96 overflow-y-auto scroll-thin pl-1"
              aria-label="لیست پیش‌نویس‌های انبار"
            >
              {drafts.map((d) => (
                <div
                  key={d.id}
                  className="w-full flex items-center gap-3 bg-ls-card border border-white/5 rounded-2xl p-3 text-right"
                >
                  <GradientCover
                    cover={d.cover}
                    className="w-12 h-12 rounded-xl shrink-0"
                    emojiClassName="text-xl"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-sm truncate">
                      {d.title}
                    </span>
                    <span className="block text-[11px] text-white/45 truncate mt-0.5">
                      {d.brand}
                    </span>
                    <span className="block text-[10px] text-amber-300 mt-1">
                      ناقص: {d.missing.join("، ")}
                    </span>
                  </span>
                  <button
                    onClick={() => push("sellerListing")}
                    aria-label={`تکمیل لیستینگ ${d.title}`}
                    className="shrink-0 rounded-xl border border-ls-pink/50 text-ls-pink px-3 py-2 text-[11px] font-bold hover:bg-ls-pink/10 active:scale-[.98] transition-all"
                  >
                    تکمیل لیستینگ
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="📝"
              title="پیش‌نویسی نداری"
              desc="با دکمهٔ «آیتم جدید» لیستینگ را شروع کن."
            />
          )
        ) : visible.length > 0 ? (
          <div
            className="space-y-2.5 max-h-96 overflow-y-auto scroll-thin pl-1"
            aria-label="لیست آیتم‌های انبار"
          >
            {visible.map((item) => {
              /* فاز ۲ — وزن آیتم از INVENTORY_EXTRAS */
              const extra = INVENTORY_EXTRAS[item.sku];
              const locked = isItemLocked(item);
              const low = isLowStock(item);
              const expanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-2xl border bg-ls-card p-3 transition-colors",
                    low
                      ? "border-amber-300/40 bg-amber-300/5"
                      : "border-white/5"
                  )}
                  aria-label={`کالا ${item.title}${low ? " — موجودی کم" : ""}`}
                >
                  {/* ردیف اصلی */}
                  <div className="flex items-center gap-3">
                    <GradientCover
                      cover={item.cover}
                      className="w-12 h-12 rounded-xl shrink-0"
                      emojiClassName="text-xl"
                      photo={ITEM_PHOTO[item.id]}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-1.5">
                        {/* v1.7.1 — عنوان حداکثر ۲ خط، بدون «…» */}
                        <span className="block font-bold text-sm line-clamp-2 break-words min-w-0">
                          {item.title}
                        </span>
                        {low && (
                          <span className="shrink-0 rounded-full bg-amber-300/15 border border-amber-300/40 px-1.5 py-0.5 text-[9px] font-black text-amber-300">
                            موجودی کم
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-white/45 truncate mt-0.5">
                        {item.brand}
                        {item.size ? ` • سایز ${item.size}` : ""} • {toFa(item.sku)}
                        {" • "}
                        <span
                          className={cn(
                            "tabular-nums",
                            low ? "font-bold text-amber-300" : "",
                            item.stock <= 0 && "text-white/35"
                          )}
                        >
                          {item.stock <= 0
                            ? "تمام شد"
                            : `موجودی ${faNum(item.stock)}`}
                        </span>
                      </span>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <Price amount={priceOf(item)} className="text-sm" />
                      <StatusChip status={item.status} />
                    </div>
                  </div>

                  {/* v1.7.0 — قفل ویرایش و وزن: دو خط جدا (روی هم نمی‌افتند) */}
                  {(locked || extra) && (
                    <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
                      {locked && (
                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300">
                          <Lock className="h-3 w-3 shrink-0" aria-hidden />
                          قفل ویرایش — در شو فعال
                        </p>
                      )}
                      {extra && (
                        <p className="text-[10px] text-white/40 tabular-nums">
                          وزن: {faNum(extra.weightGrams)} گرم
                        </p>
                      )}
                    </div>
                  )}

                  {/* واریانت‌ها — بازشده */}
                  {expanded && item.variants && item.variants.length > 0 && (
                    <div
                      className="mt-2 space-y-1.5 border-t border-white/5 pt-2"
                      aria-label={`موجودی گزینه‌های ${item.title}`}
                    >
                      {item.variants.map((v) => (
                        <VariantStockRow
                          key={v.label}
                          itemId={item.id}
                          label={v.label}
                          stock={v.stock}
                          disabled={locked}
                        />
                      ))}
                    </div>
                  )}

                  {/* اکشن‌ها — v1.7.0: ویرایش/کپی/حذف + +/- واریانت */}
                  <div className="mt-2.5 flex items-center gap-1.5 border-t border-white/5 pt-2.5">
                    {!locked && (
                      <button
                        type="button"
                        onClick={() => setEditFor(item.id)}
                        aria-label={`ویرایش ${item.title}`}
                        className="flex items-center gap-1 rounded-lg border border-ls-purple/40 bg-ls-purple/10 px-2.5 py-1.5 text-[11px] font-bold text-ls-purple-soft hover:bg-ls-purple/20 transition-colors active:scale-[.98]"
                      >
                        <Pencil className="h-3 w-3" aria-hidden />
                        ویرایش
                      </button>
                    )}
                    {item.variants && item.variants.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : item.id)}
                        aria-expanded={expanded}
                        aria-label={`${expanded ? "بستن" : "نمایش"} ویرایش موجودی گزینه‌های ${item.title}`}
                        className="flex items-center gap-1 rounded-lg border border-ls-green/40 bg-ls-green/10 px-2.5 py-1.5 text-[11px] font-bold text-ls-green hover:bg-ls-green/20 transition-colors active:scale-[.98]"
                      >
                        <Layers className="h-3 w-3" aria-hidden />
                        ویرایش موجودی
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDuplicate(item)}
                      aria-label={`کپی ${item.title}`}
                      className="flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-bold text-white/70 hover:bg-white/5 transition-colors active:scale-[.98]"
                    >
                      <Copy className="h-3 w-3" aria-hidden />
                      کپی
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (locked) {
                          toast("آیتم در شو فعال است — حذف قفل است");
                          return;
                        }
                        setDeleteFor(item.id);
                      }}
                      aria-label={`حذف ${item.title} — با تأیید`}
                      className="flex items-center gap-1 rounded-lg border border-ls-pink/40 text-ls-pink px-2.5 py-1.5 text-[11px] font-bold hover:bg-ls-pink/10 transition-colors active:scale-[.98]"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden />
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            emoji="📦"
            title="آیتمی پیدا نشد"
            desc="عبارت جستجو را تغییر بده یا فیلتر دیگری انتخاب کن."
          />
        )}

        {/* دکمهٔ شناور آیتم جدید — v1.7.0 گیت لیستینگ */}
        <div className="sticky bottom-24 z-20">
          {gate.approved ? (
            <button
              onClick={() => push("sellerListing")}
              aria-label="افزودن آیتم جدید"
              className="w-full bg-ls-purple text-white font-extrabold rounded-full py-3.5 shadow-lg shadow-ls-purple/40 flex items-center justify-center gap-2 hover:bg-ls-purple-deep transition-colors active:scale-[.99]"
            >
              <Plus className="w-5 h-5" aria-hidden />
              آیتم جدید
            </button>
          ) : (
            <>
              <button
                disabled
                aria-disabled="true"
                aria-label="آیتم جدید — غیرفعال تا تأیید فروشندگی"
                className="w-full bg-ls-card-2 text-white/35 font-extrabold rounded-full py-3.5 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock className="w-4.5 h-4.5" aria-hidden />
                آیتم جدید — قفل
              </button>
              <p
                className="mt-1.5 text-center text-[11px] font-bold text-amber-300"
                role="alert"
              >
                {gate.reason}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ═══ دیالوگ ویرایش کالا ═══ */}
      {editItem && <ProductEditDialog item={editItem} onClose={() => setEditFor(null)} />}

      {/* ═══ دیالوگ تأیید حذف کالا ═══ */}
      <AlertDialog
        open={deleteFor != null}
        onOpenChange={(v) => !v && setDeleteFor(null)}
      >
        <AlertDialogContent className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle>حذف کالا از انبار؟</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-5">
              «{deleteItem?.title}» برای همیشه از انبار حذف می‌شود. این کار
              برگشت‌پذیر نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            <AlertDialogAction
              onClick={onDeleteConfirm}
              className="bg-ls-pink text-white hover:bg-ls-pink/90"
              aria-label="تأیید حذف کالا"
            >
              بله، حذف شود
            </AlertDialogAction>
            <AlertDialogCancel className="border-white/15 bg-transparent text-white/70">
              انصراف
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
