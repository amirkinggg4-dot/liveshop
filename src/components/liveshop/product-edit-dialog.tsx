"use client";

/* ─────────────────────────────────────────────────────────────
   v1.7.1 — دیالوگ کامل ویرایش کالا (انبار فروشنده)
   همهٔ فیلدهای لیستینگ: عنوان، عکس‌ها (افزودن/حذف/تغییر عکس اصلی —
   mock با گرادیان‌های پیش‌فرض)، برند، وضعیت، قیمت، وزن، ابعاد،
   توضیح و سایز/رنگ‌ها با موجودی.
   همان اعتبارسنجی و فرمت‌کنندهٔ لیستینگ (FaNumberInput + parseFaNum).
   کالای در شو فعال قفل می‌ماند (همان رفتار انبار).
   ───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { toast } from "sonner";
import { Lock, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useSellerInventoryStore, isItemLocked } from "@/store/seller-inventory-store";
import { GradientCover } from "@/components/liveshop/shared";
import { FaNumberInput } from "@/components/liveshop/fa-number-input";
import { formatFaThousands } from "@/lib/fa-number";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ITEM_PHOTO } from "@/lib/data/media";
import type { Cover, ItemCondition, ShopItem, VariantOption } from "@/lib/data/types";

/* گرادیان‌های پیش‌فرض کاور — همان لیستینگ (با کلیک می‌چرخند) */
const PRESET_COVERS: Cover[] = [
  { from: "#FF3B8B", to: "#6C5CFF", emoji: "👟" },
  { from: "#6C5CFF", to: "#1b1729", emoji: "👟" },
  { from: "#00C896", to: "#0b5f4a", emoji: "👟" },
  { from: "#FFB454", to: "#7c2d12", emoji: "👟" },
];

const CONDITIONS: ItemCondition[] = ["نو با جعبه", "نو بدون جعبه", "کارکرده"];

/* ارقام فارسی به لاتین — همان parseFaNum لیستینگ */
function parseFaNum(s: string): number {
  const latin = s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  const digits = latin.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function ProductEditDialog({
  item,
  onClose,
}: {
  item: ShopItem;
  onClose: () => void;
}) {
  const updateItem = useSellerInventoryStore((s) => s.updateItem);
  const locked = isItemLocked(item);

  /* ── فیلدها — مقدار اولیه از کالا ── */
  const [title, setTitle] = useState(item.title);
  const [brand, setBrand] = useState(item.brand);
  const [condition, setCondition] = useState<ItemCondition>(item.condition);
  const [price, setPrice] = useState(item.price);
  const [weight, setWeight] = useState(item.weightGrams ?? 0);
  const [dims, setDims] = useState(item.dims ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  const [stock, setStock] = useState(item.stock);

  /* سایز/رنگ‌ها با موجودی — همان الگوی لیستینگ (رشتهٔ قابل ویرایش) */
  const [variants, setVariants] = useState<VariantOption[]>(
    item.variants?.map((v) => ({ ...v })) ?? []
  );
  const [newVariantLabel, setNewVariantLabel] = useState("");

  /* ── عکس‌ها (mock) ──
     جایگاه اصلی = کاور کالا؛ دو جایگاه اضافه فقط نمایشی (گرادیان mock) */
  const [coverIdx, setCoverIdx] = useState(0);
  const [coverChanged, setCoverChanged] = useState(false);
  const [extraSlots, setExtraSlots] = useState<number[]>([]); // ایندکس گرادیان هر جایگاه اضافه
  const currentCover = PRESET_COVERS[coverIdx] ?? PRESET_COVERS[0];
  const itemPhoto = ITEM_PHOTO[item.id];

  const changeMainCover = () => {
    setCoverIdx((i) => (i + 1) % PRESET_COVERS.length);
    setCoverChanged(true);
  };

  const addExtraSlot = () => {
    if (extraSlots.length >= 2) {
      toast("حداکثر ۳ عکس در این دمو");
      return;
    }
    setExtraSlots((xs) => [...xs, (xs.length + 1) % PRESET_COVERS.length]);
  };

  const removeExtraSlot = (i: number) =>
    setExtraSlots((xs) => xs.filter((_, idx) => idx !== i));

  /* افزودن گزینهٔ سایز/رنگ — همان قواعد لیستینگ */
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
    setVariants((vs) => [...vs, { label, stock: 1 }]);
    setNewVariantLabel("");
  };

  const variantTotalStock = variants.reduce((s, v) => s + v.stock, 0);

  const save = () => {
    /* اعتبارسنجی — همان قواعد لیستینگ */
    if (!title.trim()) {
      toast.error("عنوان کالا را وارد کن");
      return;
    }
    if (!brand.trim()) {
      toast.error("برند کالا را وارد کن");
      return;
    }
    if (price <= 0) {
      toast.error("قیمت باید بیشتر از صفر باشد");
      return;
    }
    if (variants.length === 0 && stock <= 0) {
      toast.error("موجودی باید حداقل ۱ عدد باشد");
      return;
    }

    updateItem(item.id, {
      title: title.trim(),
      brand: brand.trim(),
      condition,
      price,
      weightGrams: weight,
      dims: dims.trim() || undefined,
      description: description.trim(),
      ...(coverChanged ? { cover: { ...currentCover } } : {}),
      ...(variants.length > 0
        ? { variants, stock: variantTotalStock }
        : { variants: undefined, stock }),
    });
    toast.success("تغییرات کالا ذخیره شد");
    onClose();
  };

  return (
    <AlertDialog open onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent
        className="max-h-[85vh] overflow-y-auto scroll-thin rounded-2xl border-white/10 bg-ls-card sm:max-w-md"
        aria-label={`ویرایش کامل کالا ${item.title}`}
      >
        <AlertDialogHeader className="text-right sm:text-right">
          <AlertDialogTitle>ویرایش کالا</AlertDialogTitle>
          <AlertDialogDescription className="text-xs leading-5">
            {locked
              ? "این کالا در شو فعال است — ویرایش قفل است."
              : "همهٔ فیلدهای لیستینگ — تغییرات بلافاصله در انبار اعمال می‌شود."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {locked ? (
          <p
            className="flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-300/10 p-3 text-xs font-bold text-amber-300"
            role="alert"
          >
            <Lock className="h-4 w-4" aria-hidden />
            کالای «در شو فعال» قفل است — بعد از پایان شو ویرایش آزاد می‌شود.
          </p>
        ) : (
          <div className="space-y-4">
            {/* ── گرید عکس‌ها (mock): اصلی + جایگاه‌های اضافه ── */}
            <div className="space-y-2">
              <Label className="text-xs text-white/70">عکس‌های کالا (دمو)</Label>
              <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="عکس‌های کالا">
                <button
                  type="button"
                  onClick={changeMainCover}
                  aria-label="تغییر عکس اصلی"
                  className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 transition-transform active:scale-[.98]"
                >
                  <GradientCover
                    cover={coverChanged ? currentCover : item.cover}
                    className="h-full w-full"
                    emojiClassName="text-3xl"
                    /* عکس واقعی کالا تا وقتی عکس اصلی عوض نشده اولویت دارد */
                    photo={!coverChanged ? itemPhoto : undefined}
                  />
                  <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-black text-white">
                    اصلی
                  </span>
                </button>
                {extraSlots.map((gi, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-2xl border border-white/10"
                  >
                    <GradientCover
                      cover={PRESET_COVERS[gi] ?? PRESET_COVERS[0]}
                      className="h-full w-full"
                      emojiClassName="text-3xl"
                    />
                    <button
                      type="button"
                      onClick={() => removeExtraSlot(i)}
                      aria-label={`حذف عکس شمارهٔ ${toFa(i + 2)}`}
                      className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-lg bg-black/60 text-white/80 hover:text-white transition-colors"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden />
                    </button>
                  </div>
                ))}
                {extraSlots.length < 2 && (
                  <button
                    type="button"
                    onClick={addExtraSlot}
                    aria-label="افزودن عکس"
                    className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-ls-card/60 transition-colors hover:border-ls-purple/50"
                  >
                    <Plus className="h-5 w-5 text-white/30" aria-hidden />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-white/40">
                تغییر عکس اصلی: طرح گرادیان می‌چرخد — عکس‌های اضافه نمایشی‌اند (دمو).
              </p>
            </div>

            {/* ── عنوان + برند ── */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-title" className="text-xs font-bold text-white/70">
                عنوان
              </Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-label="عنوان کالا"
                className="h-10 rounded-xl border-white/10 bg-ls-card-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-brand" className="text-xs font-bold text-white/70">
                برند
              </Label>
              <Input
                id="edit-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                aria-label="برند کالا"
                className="h-10 rounded-xl border-white/10 bg-ls-card-2 text-sm"
              />
            </div>

            {/* ── وضعیت کالا — همان چیپ‌های لیستینگ ── */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-white/70">وضعیت کالا</Label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="وضعیت کالا">
                {(CONDITIONS.includes(condition)
                  ? CONDITIONS
                  : [condition, ...CONDITIONS]
                ).map((c) => {
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
            </div>

            {/* ── قیمت + وزن — ورودی عددی فارسی مثل لیستینگ ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-price" className="text-xs font-bold text-white/70">
                  قیمت ثابت
                </Label>
                <FaNumberInput
                  id="edit-price"
                  value={price}
                  onValueChange={setPrice}
                  suffix="تومان"
                  ariaLabel="قیمت کالا به تومان"
                  placeholder="۶٬۵۰۰٬۰۰۰"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-weight" className="text-xs font-bold text-white/70">
                  وزن
                </Label>
                <FaNumberInput
                  id="edit-weight"
                  value={weight}
                  onValueChange={setWeight}
                  suffix="گرم"
                  ariaLabel="وزن بسته به گرم"
                />
              </div>
            </div>

            {/* ── ابعاد ── */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-dims" className="text-xs font-bold text-white/70">
                ابعاد بسته
              </Label>
              <Input
                id="edit-dims"
                dir="ltr"
                value={dims}
                onChange={(e) => setDims(e.target.value)}
                placeholder="۳۰×۲۰×۱۲"
                className="h-10 rounded-xl border-white/10 bg-ls-card-2 text-left text-sm tabular-nums"
                aria-label="ابعاد بسته"
              />
            </div>

            {/* ── توضیح ── */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc" className="text-xs font-bold text-white/70">
                توضیح
              </Label>
              <Textarea
                id="edit-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="توضیح کالا برای نمایش در شو و صفحهٔ محصول"
                aria-label="توضیح کالا"
                className="rounded-xl border-white/10 bg-ls-card-2 text-sm"
              />
            </div>

            {/* ── موجودی / سایز-رنگ‌ها ── */}
            {variants.length === 0 ? (
              <div className="space-y-1.5">
                <Label htmlFor="edit-stock" className="text-xs font-bold text-white/70">
                  موجودی (عدد)
                </Label>
                <FaNumberInput
                  id="edit-stock"
                  value={stock}
                  onValueChange={(n) => setStock(Math.max(0, n))}
                  suffix="عدد"
                  ariaLabel="موجودی کالا به عدد"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs font-bold">
                  سایزها / رنگ‌ها — هر گزینه موجودی جدا دارد
                </Label>
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
                        value={formatFaThousands(v.stock)}
                        onChange={(e) =>
                          setVariants((vs) =>
                            vs.map((x) =>
                              x.label === v.label
                                ? { ...x, stock: Math.max(0, parseFaNum(e.target.value)) }
                                : x
                            )
                          )
                        }
                        className="h-8 w-24 rounded-lg border-white/10 bg-ls-card text-center text-xs tabular-nums"
                        aria-label={`موجودی گزینهٔ ${v.label}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setVariants((vs) => vs.filter((x) => x.label !== v.label))
                        }
                        aria-label={`حذف گزینهٔ ${v.label}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ls-pink/40 text-ls-pink hover:bg-ls-pink/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-white/40 tabular-nums">
                  جمع موجودی گزینه‌ها: {formatFaThousands(variantTotalStock)} عدد
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={newVariantLabel}
                    onChange={(e) => setNewVariantLabel(e.target.value)}
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
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
          {!locked && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                save();
              }}
              className="bg-ls-purple text-white hover:bg-ls-purple-deep"
              aria-label="ذخیرهٔ تغییرات کالا"
            >
              ذخیره
            </AlertDialogAction>
          )}
          <AlertDialogCancel className="border-white/15 bg-transparent text-white/70">
            بستن
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
