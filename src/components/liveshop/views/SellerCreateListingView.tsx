"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Info, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toFa, faNum } from "@/lib/format";
import type { Cover } from "@/lib/data/types";
import { useAppStore } from "@/store/app-store";
import { useSellerStore } from "@/store/seller-store";
import { GradientCover, PageHeader } from "@/components/liveshop/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AUCTION_ENABLED } from "@/lib/config";

/* ─────────────────────────────────────────────────────────────
   ساخت لیستینگ جدید — v1.4 «قیمت ثابت»
   گرید عکس، مشخصات کالا، قیمت ثابت + موجودی، سایزها/رنگ‌ها با
   موجودی جدا، وزن و ابعاد، فیلدهای ارسال ایران، قوانین دسته و
   انتشار / ذخیرهٔ پیش‌نویس (به انبار seller-store).
   فیلدهای حراج (شروع مزایده + خرید فوری) پشت AUCTION_ENABLED
   حفظ شده‌اند و پاک نشده‌اند.
   ───────────────────────────────────────────────────────────── */

/* گرادیان‌های پیش‌فرض کاور — با کلیک روی جایگاه‌های خالی می‌چرخند */
const PRESET_COVERS: Cover[] = [
  { from: "#FF3B8B", to: "#6C5CFF", emoji: "👟" },
  { from: "#6C5CFF", to: "#1b1729", emoji: "👟" },
  { from: "#00C896", to: "#0b5f4a", emoji: "👟" },
  { from: "#FFB454", to: "#7c2d12", emoji: "👟" },
];

const CONDITIONS = ["نو با جعبه", "نو بدون جعبه", "کارکرده"] as const;

/** پارس ورودی عددی — ارقام فارسی به لاتین + حذف جداکننده‌ها */
function parseFaNum(s: string): number {
  const latin = s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  const digits = latin.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

/* گزینهٔ سایز/رنگ با موجودی جدا */
interface VariantRow {
  label: string;
  stock: string;
}

export default function SellerCreateListingView() {
  const back = useAppStore((s) => s.back);
  const addDraft = useSellerStore((s) => s.addDraft);

  /* کاور مشترک گرید عکس — جایگاه‌های خالی آن را جلو می‌برند */
  const [coverIdx, setCoverIdx] = useState(0);
  const [coverPicked, setCoverPicked] = useState(false);
  const currentCover = PRESET_COVERS[coverIdx] ?? PRESET_COVERS[0];

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]>("نو با جعبه");

  /* ── v1.4 — قیمت ثابت + موجودی + گزینه‌ها ── */
  const [priceInput, setPriceInput] = useState("");
  const [stockInput, setStockInput] = useState("۱");
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [newVariantLabel, setNewVariantLabel] = useState("");

  /* وزن و ابعاد بسته */
  const [weightInput, setWeightInput] = useState("۹۰۰");
  const [dimsInput, setDimsInput] = useState("");

  /* ── فیلدهای حراج (پشت AUCTION_ENABLED — حفظ‌شده) ── */
  const [startPriceInput, setStartPriceInput] = useState("");
  const [binOn, setBinOn] = useState(true);
  const [binPriceInput, setBinPriceInput] = useState("");

  const price = parseFaNum(priceInput);
  const stock = Math.max(0, parseFaNum(stockInput));

  const advanceCover = () => {
    setCoverIdx((i) => (i + 1) % PRESET_COVERS.length);
    setCoverPicked(true);
  };

  /* افزودن گزینهٔ سایز/رنگ */
  const addVariant = () => {
    const label = newVariantLabel.trim();
    if (!label) {
      toast.error("برچسب سایز/رنگ را وارد کن");
      return;
    }
    if (variants.some((v) => v.label === label)) {
      toast.error("این گزینه از قبل هست");
      return;
    }
    setVariants((vs) => [...vs, { label, stock: "۱" }]);
    setNewVariantLabel("");
  };

  const removeVariant = (label: string) =>
    setVariants((vs) => vs.filter((v) => v.label !== label));

  /* انتشار با اعتبارسنجی — در دمو به انبار «اضافه» می‌شود */
  const publish = () => {
    if (!title.trim()) {
      toast.error("عنوان را وارد کن");
      return;
    }
    if (AUCTION_ENABLED) {
      /* حالت مزایده — اعتبارسنجی قبلی (حفظ‌شده) */
      const startPrice = parseFaNum(startPriceInput);
      if (startPrice <= 0) {
        toast.error("قیمت شروع مزایده را وارد کن");
        return;
      }
    } else {
      /* v1.4 — حالت قیمت ثابت */
      if (price <= 0) {
        toast.error("قیمت ثابت را وارد کن");
        return;
      }
      if (variants.length === 0 && stock <= 0) {
        toast.error("موجودی باید حداقل ۱ عدد باشد");
        return;
      }
    }
    toast.success("لیستینگ منتشر شد ✅ — به انبار اضافه شد");
    back();
  };

  /* ذخیرهٔ پیش‌نویس — فیلدهای ناقص در missing ثبت می‌شوند */
  const saveDraft = () => {
    if (!title.trim()) {
      toast.error("عنوان را وارد کن");
      return;
    }
    const missing = [
      !coverPicked && "عکس اصلی",
      !AUCTION_ENABLED && price <= 0 && "قیمت ثابت",
      AUCTION_ENABLED && parseFaNum(startPriceInput) <= 0 && "قیمت شروع",
    ].filter((x): x is string => Boolean(x));
    addDraft({
      title: title.trim(),
      brand: brand.trim() || "بدون برند",
      emoji: "👟",
      cover: { ...currentCover },
      missing,
    });
    toast.success("پیش‌نویس ذخیره شد — در انبار می‌بینی");
    back();
  };

  const variantTotalStock = variants.reduce((s, v) => s + parseFaNum(v.stock), 0);

  return (
    <div className="flex-1 flex flex-col" aria-label="ساخت لیستینگ جدید">
      <PageHeader
        title="لیستینگ جدید"
        onBack={back}
        trailing={
          <button
            type="button"
            onClick={saveDraft}
            className="shrink-0 text-xs font-bold text-ls-purple-soft transition-colors hover:text-ls-purple"
            aria-label="ذخیرهٔ پیش‌نویس لیستینگ"
          >
            ذخیرهٔ پیش‌نویس
          </button>
        }
      />

      <div className="space-y-4 px-4 py-4 pb-2">
        {/* ── گرید عکس‌ها: باکس اصلی + دو جایگاه خالی ── */}
        <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="عکس‌های آگهی">
          <div
            className="relative aspect-square overflow-hidden rounded-2xl border border-white/10"
            aria-label="عکس اصلی آگهی"
          >
            <GradientCover
              cover={currentCover}
              className="h-full w-full"
              emojiClassName="text-3xl"
            />
            <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-black text-white">
              اصلی
            </span>
          </div>
          {[0, 1].map((i) => (
            <button
              key={i}
              type="button"
              onClick={advanceCover}
              aria-label={`انتخاب طرح گرادیان عکس — جایگاه ${toFa(i + 2)}`}
              className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-ls-card/60 transition-colors hover:border-ls-purple/50"
            >
              <Plus className="h-5 w-5 text-white/30" aria-hidden />
            </button>
          ))}
        </div>

        {/* ── مشخصات کالا ── */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="listing-title" className="text-xs text-white/70">
              عنوان آگهی
            </Label>
            <Input
              id="listing-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً نایک دَنک لو پاندا"
              className="h-10 rounded-xl border-white/10 bg-ls-card-2 text-sm"
              aria-label="عنوان آگهی"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="listing-brand" className="text-xs text-white/70">
                برند
              </Label>
              <Input
                id="listing-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="مثلاً نایک"
                className="h-10 rounded-xl border-white/10 bg-ls-card-2 text-sm"
                aria-label="برند کالا"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="listing-size" className="text-xs text-white/70">
                سایز اصلی
              </Label>
              <Input
                id="listing-size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="۴۲"
                className="h-10 rounded-xl border-white/10 bg-ls-card-2 text-sm tabular-nums"
                aria-label="سایز کالا"
              />
            </div>
          </div>
        </div>

        {/* ── وضعیت کالا ── */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="وضعیت کالا">
          {CONDITIONS.map((c) => {
            const active = condition === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(c)}
                aria-pressed={active}
                aria-label={`وضعیت کالا: ${c}`}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-ls-purple text-white"
                    : "bg-ls-card-2 text-white/60 hover:text-white"
                )}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* ═══ v1.4 — قیمت ثابت + موجودی (حالت قیمت ثابت) ═══ */}
        {!AUCTION_ENABLED && (
          <div className="space-y-4 rounded-2xl border border-white/5 bg-ls-card p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fixed-price" className="text-xs text-white/70">
                  قیمت ثابت (تومان)
                </Label>
                <Input
                  id="fixed-price"
                  dir="ltr"
                  inputMode="numeric"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="مثلاً ۶٬۵۰۰٬۰۰۰"
                  className="h-10 rounded-xl border-white/10 bg-ls-card-2 text-left text-sm tabular-nums"
                  aria-label="قیمت ثابت به تومان"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="listing-stock" className="text-xs text-white/70">
                  {variants.length > 0 ? "موجودی کل (خودکار)" : "موجودی (عدد)"}
                </Label>
                <Input
                  id="listing-stock"
                  dir="ltr"
                  inputMode="numeric"
                  value={variants.length > 0 ? String(variantTotalStock) : stockInput}
                  onChange={(e) => setStockInput(e.target.value)}
                  disabled={variants.length > 0}
                  className="h-10 rounded-xl border-white/10 bg-ls-card-2 text-left text-sm tabular-nums disabled:opacity-60"
                  aria-label="موجودی کالا"
                />
              </div>
            </div>
            <p className="text-[10px] text-white/40">
              قیمت ثابت = همان مبلغی که خریدار در لایو می‌پردازد (بدون مزایده).
            </p>

            {/* ── سایزها/رنگ‌ها با موجودی جدا ── */}
            <div className="space-y-2 border-t border-white/5 pt-3">
              <Label className="text-xs font-bold">
                سایزها / رنگ‌ها — هر گزینه موجودی جدا دارد
              </Label>
              {variants.length > 0 && (
                <ul className="space-y-1.5" aria-label="گزینه‌های سایز/رنگ">
                  {variants.map((v) => (
                    <li
                      key={v.label}
                      className="flex items-center gap-2 rounded-xl bg-ls-card-2 border border-white/10 p-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-xs font-bold">
                        {v.label}
                      </span>
                      <Input
                        dir="ltr"
                        inputMode="numeric"
                        value={v.stock}
                        onChange={(e) =>
                          setVariants((vs) =>
                            vs.map((x) =>
                              x.label === v.label
                                ? { ...x, stock: e.target.value }
                                : x
                            )
                          )
                        }
                        className="h-8 w-20 rounded-lg border-white/10 bg-ls-card text-center text-xs tabular-nums"
                        aria-label={`موجودی گزینهٔ ${v.label}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeVariant(v.label)}
                        aria-label={`حذف گزینهٔ ${v.label}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ls-pink/40 text-ls-pink hover:bg-ls-pink/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-2">
                <Input
                  value={newVariantLabel}
                  onChange={(e) => setNewVariantLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addVariant();
                    }
                  }}
                  placeholder="مثلاً ۴۲ یا مشکی"
                  className="h-9 flex-1 rounded-xl border-white/10 bg-ls-card-2 text-sm"
                  aria-label="برچسب سایز یا رنگ جدید"
                />
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex h-9 shrink-0 items-center gap-1 rounded-xl border border-ls-purple/50 px-3 text-xs font-bold text-ls-purple-soft hover:bg-ls-purple/10 transition-colors"
                  aria-label="افزودن گزینهٔ سایز/رنگ"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  افزودن
                </button>
              </div>
              {variants.length > 0 && (
                <p className="text-[10px] text-white/40">
                  جمع موجودی گزینه‌ها: {faNum(variantTotalStock)} عدد
                </p>
              )}
            </div>
          </div>
        )}

        {/* ═══ قیمت‌گذاری حراج (پشت AUCTION_ENABLED — حفظ‌شده) ═══ */}
        {AUCTION_ENABLED && (
          <div className="space-y-3.5 rounded-2xl border border-white/5 bg-ls-card p-4">
            <div className="space-y-1.5">
              <Label htmlFor="start-price" className="text-xs text-white/70">
                شروع مزایده (تومان)
              </Label>
              <Input
                id="start-price"
                dir="ltr"
                inputMode="numeric"
                value={startPriceInput}
                onChange={(e) => setStartPriceInput(e.target.value)}
                placeholder="مثلاً ۴٬۰۰۰٬۰۰۰"
                className="h-10 rounded-xl border-white/10 bg-ls-card-2 text-left text-sm tabular-nums"
                aria-label="شروع مزایده به تومان"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="bin-switch" className="text-xs font-bold">
                خرید فوری
              </Label>
              <span className="flex items-center gap-2">
                <span
                  className="inline-flex cursor-help"
                  title="در حین مزایده هم، خریدار می‌تواند با این قیمت فوری بخرد"
                  aria-label="راهنمای خرید فوری"
                >
                  <Info className="h-3.5 w-3.5 text-white/35" aria-hidden />
                </span>
                <Switch
                  id="bin-switch"
                  checked={binOn}
                  onCheckedChange={setBinOn}
                  aria-label="فعال‌سازی خرید فوری"
                  className="data-[state=checked]:bg-ls-purple"
                />
              </span>
            </div>

            {binOn && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="bin-price" className="text-xs text-white/70">
                    قیمت خرید فوری (تومان)
                  </Label>
                  <Input
                    id="bin-price"
                    dir="ltr"
                    inputMode="numeric"
                    value={binPriceInput}
                    onChange={(e) => setBinPriceInput(e.target.value)}
                    placeholder="مثلاً ۵٬۲۰۰٬۰۰۰"
                    className="h-10 rounded-xl border-white/10 bg-ls-card-2 text-left text-sm tabular-nums"
                    aria-label="قیمت خرید فوری به تومان"
                  />
                </div>
                <p className="text-[10px] text-white/40">
                  قیمت فوری معمولاً بالاتر از شروع مزایده تعیین می‌شود.
                </p>
              </>
            )}
          </div>
        )}

        {/* ── وزن و ابعاد بسته ── */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pkg-weight" className="text-xs text-white/70">
                وزن (گرم)
              </Label>
              <Input
                id="pkg-weight"
                dir="ltr"
                inputMode="numeric"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="h-10 rounded-xl border-white/10 bg-ls-card-2 text-left text-sm tabular-nums"
                aria-label="وزن بسته به گرم"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pkg-dims" className="text-xs text-white/70">
                ابعاد بسته
              </Label>
              <Input
                id="pkg-dims"
                dir="ltr"
                value={dimsInput}
                onChange={(e) => setDimsInput(e.target.value)}
                placeholder="۳۰×۲۰×۱۲"
                className="h-10 rounded-xl border-white/10 bg-ls-card-2 text-left text-sm tabular-nums"
                aria-label="ابعاد بسته"
              />
            </div>
          </div>
          <p className="text-[10px] text-white/40">
            وزن برای محاسبهٔ خودکار هزینهٔ تیپاکس/پست استفاده می‌شود.
          </p>
        </div>

        {/* ── قوانین دسته ── */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-ls-pink/30 bg-ls-pink/10 p-3.5 text-xs leading-5 text-white/80">
          <ShieldAlert
            className="mt-0.5 h-4 w-4 shrink-0 text-ls-pink"
            aria-hidden
          />
          <p>
            قوانین دسته: عکس سایز‌تگ و لیبل جعبه الزامی است؛ فروش ریپلیکا
            ممنوع — عدم رعایت، حذف آگهی را در پی دارد.
          </p>
        </div>
      </div>

      {/* ── نوار انتشار چسبان ── */}
      <div className="sticky bottom-0 z-20 mt-auto bg-gradient-to-t from-ls-bg via-ls-bg/95 to-transparent px-4 pb-4 pt-3">
        <button
          type="button"
          onClick={publish}
          className="h-12 w-full rounded-xl bg-ls-purple text-sm font-black text-white shadow-[0_8px_24px_rgba(108,92,255,.35)] transition-transform active:scale-[.98]"
          aria-label="انتشار لیستینگ"
        >
          انتشار لیستینگ
        </button>
      </div>
    </div>
  );
}
