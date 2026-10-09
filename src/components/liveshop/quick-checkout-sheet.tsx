"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   QuickCheckoutSheet — خرید سریع با قیمت ثابت (v1.4)
   با زدن «خرید» از پایین باز می‌شود:
   ─ انتخاب سایز/رنگ (در صورت وجود — بدون انتخاب، پرداخت خطا می‌دهد)
   ─ تعداد (تا سقف موجودی زندهٔ همین لحظه)
   ─ آدرس ذخیره‌شدهٔ پیش‌فرض
   ─ روش ارسال (تیپاکس/پست پیشتاز/پیک شهری) با هزینه
   ─ جمع کل شامل ارسال + موجودی کیف پول با لینک شارژ
   ─ «پرداخت» → کسر امانی از کیف پول + سفارش با تایم‌لاین امانی +
     کانفتی کوتاه + پیام «خرید شما ثبت شد» + خط چت «علی ✅ خرید کرد»
   خطاها: موجودی کیف پول کم / کالا تمام شد / سایز انتخاب نشده
   ═══════════════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Minus,
  MapPin,
  Plus,
  ShieldCheck,
  Wallet as WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { faNum, toman } from "@/lib/format";
import { stockLabelFa } from "@/lib/data/items";
import { DEFAULT_ADDRESS, SHIPPING_METHODS } from "@/lib/data/orders";
import type { ShopItem, ShippingMethodId } from "@/lib/data/types";
import { useLiveStore } from "@/store/live-store";
import { useAppStore } from "@/store/app-store";
import { useWalletStore } from "@/store/wallet-store";
import { GradientCover, Price } from "@/components/liveshop/shared";
import Confetti from "@/components/liveshop/confetti";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export default function QuickCheckoutSheet({
  item,
  open,
  onOpenChange,
}: {
  item: ShopItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const push = useAppStore((s) => s.push);

  /* کالای زندهٔ اتاق (موجودی لحظه‌ای) — اگر در اتاق نبود، همان دادهٔ استاتیک */
  const liveItem = useLiveStore((s) => s.items.find((i) => i.id === item.id));
  const purchaseItem = useLiveStore((s) => s.purchaseItem);
  const current: ShopItem = liveItem ?? item;

  const balance = useWalletStore((s) => s.balance);

  /* سایز/رنگ انتخابی — null = خودکار (اولین موجود)
     اگر گزینهٔ انتخابی تمام شود (مثلاً ربات‌ها بخرند)، خودکار به اولین گزینهٔ موجود می‌رود */
  const [variantRaw, setVariantRaw] = useState<string | null>(null);
  const variant = useMemo(() => {
    if (!current.variants || current.variants.length === 0) return null;
    const picked = current.variants.find((v) => v.label === variantRaw);
    if (picked && picked.stock > 0) return picked.label;
    return current.variants.find((v) => v.stock > 0)?.label ?? null;
  }, [current.variants, variantRaw]);
  const [qty, setQty] = useState(1);
  const [methodId, setMethodId] = useState<ShippingMethodId>("tipax");
  const [celebrate, setCelebrate] = useState(0);

  const method = useMemo(
    () => SHIPPING_METHODS.find((m) => m.id === methodId) ?? SHIPPING_METHODS[0],
    [methodId]
  );

  const soldOut = current.stock <= 0;
  const selectedVariant =
    current.variants?.find((v) => v.label === variant) ?? null;
  const maxQty = selectedVariant ? selectedVariant.stock : current.stock;
  const itemTotal = current.price * qty;
  const total = itemTotal + method.price;
  const short = balance < total;

  const changeQty = (next: number) => {
    setQty(Math.min(Math.max(1, next), Math.max(1, Math.min(maxQty, 5))));
  };

  const pay = () => {
    if (soldOut) {
      toast.error("کالا تمام شد — موجودی این کالا به پایان رسید");
      return;
    }
    if (current.variants && current.variants.length > 0) {
      const valid =
        variant != null &&
        current.variants.some((v) => v.label === variant && v.stock >= qty);
      if (!valid) {
        toast.error(
          current.variants.some((v) => v.stock > 0)
            ? "اول سایز/رنگ را انتخاب کن"
            : "کالا تمام شد — همهٔ سایزها به پایان رسید"
        );
        return;
      }
    }
    const res = purchaseItem({
      itemId: current.id,
      /* اگر گزینه عوض شده باشد، تعداد به سقف موجودی همان گزینه محدود می‌شود */
      qty: Math.min(qty, Math.max(1, maxQty)),
      variantLabel: variant ?? undefined,
      shippingMethodId: methodId,
    });
    if (!res.ok) {
      toast.error(res.error ?? "خرید انجام نشد");
      return;
    }
    /* موفقیت — کانفتی کوتاه + پیام «خرید شما ثبت شد» */
    setCelebrate((k) => k + 1);
    toast.success("خرید شما ثبت شد 🎉 — پول تا لحظهٔ تحویل امانت است");
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-ls-card border-t border-ls-green/30 rounded-t-3xl">
        {celebrate > 0 && <Confetti key={celebrate} />}
        <DrawerHeader className="text-right pb-2">
          <DrawerTitle className="flex items-center gap-2 text-base font-black">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ls-green/15 text-sm" aria-hidden>
              🛒
            </span>
            خرید سریع
            <span className="text-[11px] font-medium text-white/45">قیمت ثابت</span>
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            انتخاب سایز، تعداد، آدرس و روش ارسال و پرداخت امانی از کیف پول
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-1 max-h-[80vh] overflow-y-auto scroll-thin">
          {/* ── خلاصهٔ کالا ── */}
          <div className="flex items-center gap-3 rounded-2xl bg-ls-card-2 border border-white/5 p-3">
            <GradientCover
              cover={current.cover}
              className="h-14 w-14 shrink-0 rounded-xl"
              emojiClassName="text-2xl"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{current.title}</p>
              <p className="mt-0.5 text-[11px] text-white/50">
                {current.brand}
                {current.size ? ` · سایز ${current.size}` : ""} ·{" "}
                <span className={cn(soldOut ? "text-white/45" : current.stock < 3 ? "text-amber-300" : "text-ls-green")}>
                  {stockLabelFa(current.stock)}
                </span>
              </p>
            </div>
            <Price amount={current.price} className="shrink-0 text-sm text-ls-green" />
          </div>

          {/* ── سایز/رنگ ── */}
          {current.variants && current.variants.length > 0 && (
            <div role="radiogroup" aria-label="انتخاب سایز یا رنگ">
              <p className="mb-2 text-xs font-extrabold text-white/80">سایز / رنگ</p>
              <div className="flex flex-wrap gap-2">
                {current.variants.map((v) => {
                  const active = variant === v.label;
                  const out = v.stock <= 0;
                  return (
                    <button
                      key={v.label}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={out}
                      onClick={() => {
                        setVariantRaw(v.label);
                        changeQty(1);
                      }}
                      aria-label={`انتخاب ${v.label} — ${stockLabelFa(v.stock)}`}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-[.97]",
                        out
                          ? "cursor-not-allowed border-white/10 bg-white/5 text-white/30 line-through"
                          : active
                            ? "border-ls-purple bg-ls-purple/20 text-white shadow-[0_0_12px_rgba(108,92,255,.35)]"
                            : "border-white/15 bg-ls-card-2 text-white/75 hover:border-ls-purple/50"
                      )}
                    >
                      {v.label}
                      <span
                        className={cn(
                          "mr-1.5 text-[9px] font-medium",
                          out ? "text-white/25" : active ? "text-ls-green" : "text-white/40"
                        )}
                      >
                        {out ? "تمام" : faNum(v.stock)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── تعداد ── */}
          <div className="flex items-center justify-between rounded-2xl bg-ls-card-2 border border-white/5 p-3">
            <p className="text-xs font-extrabold text-white/80">تعداد</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => changeQty(qty - 1)}
                disabled={qty <= 1 || soldOut}
                aria-label="کاهش تعداد"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-ls-card text-white/85 disabled:opacity-35 active:scale-95 transition-all"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span
                className="min-w-8 text-center text-base font-black tabular-nums"
                aria-live="polite"
                aria-label={`تعداد: ${faNum(qty)}`}
              >
                {faNum(qty)}
              </span>
              <button
                type="button"
                onClick={() => changeQty(qty + 1)}
                disabled={qty >= Math.min(maxQty, 5) || soldOut}
                aria-label="افزایش تعداد"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-ls-card text-white/85 disabled:opacity-35 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          {/* ── آدرس ذخیره‌شده ── */}
          <div className="rounded-2xl bg-ls-card-2 border border-white/5 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-extrabold text-white/85">
                <MapPin className="h-3.5 w-3.5 text-ls-purple-soft" aria-hidden />
                آدرس تحویل
              </p>
              <button
                type="button"
                onClick={() => toast("ویرایش آدرس (دمو)")}
                className="text-[11px] font-bold text-ls-purple-soft hover:underline"
                aria-label="ویرایش آدرس"
              >
                ویرایش
              </button>
            </div>
            <p className="whitespace-pre-line text-[11px] leading-5 text-white/60">
              {DEFAULT_ADDRESS}
            </p>
          </div>

          {/* ── روش ارسال ── */}
          <div role="radiogroup" aria-label="انتخاب روش ارسال" className="space-y-2">
            <p className="text-xs font-extrabold text-white/80">روش ارسال</p>
            {SHIPPING_METHODS.map((m) => {
              const selected = m.id === methodId;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMethodId(m.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-2.5 text-right transition-colors",
                    selected
                      ? "border-ls-purple bg-ls-purple/10"
                      : "border-white/10 bg-ls-card-2 hover:border-white/25"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      selected ? "border-ls-purple" : "border-white/25"
                    )}
                    aria-hidden
                  >
                    {selected && <Check className="h-3 w-3 text-ls-purple" strokeWidth={3.5} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold">{m.label}</span>
                    <span className="mt-0.5 block text-[10px] text-white/45">{m.eta}</span>
                  </span>
                  <Price amount={m.price} className="shrink-0 text-[11px] text-white/80" />
                </button>
              );
            })}
          </div>

          {/* ── جمع کل ── */}
          <div className="rounded-2xl bg-ls-card-2 border border-white/5 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">
                کالا{qty > 1 ? ` × ${faNum(qty)}` : ""}
              </span>
              <Price amount={itemTotal} className="text-xs text-white/85" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">ارسال — {method.label}</span>
              <Price amount={method.price} className="text-xs text-white/85" />
            </div>
            <div className="my-0.5 border-t border-dashed border-white/10" role="separator" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold">قابل پرداخت</span>
              <Price amount={total} className="text-lg text-ls-purple-soft" />
            </div>
            {/* موجودی کیف پول + لینک شارژ */}
            <div
              className={cn(
                "flex items-center justify-between rounded-xl px-2.5 py-2 text-[11px]",
                short ? "bg-ls-pink/10 text-ls-pink" : "bg-ls-green/10 text-ls-green"
              )}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <WalletIcon className="h-3.5 w-3.5" aria-hidden />
                موجودی کیف پول: {toman(balance)}
              </span>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  push("wallet");
                }}
                className="font-bold underline underline-offset-2 hover:opacity-80"
                aria-label="شارژ کیف پول"
              >
                شارژ کیف پول
              </button>
            </div>
            <p className="flex items-center gap-1.5 text-[10px] leading-4 text-white/50">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-ls-green" aria-hidden />
              پول تو به‌صورت امانی نزد لحظه می‌ماند و بعد از تحویل به فروشنده آزاد می‌شود.
            </p>
          </div>

          {/* ── دکمهٔ پرداخت ── */}
          <button
            type="button"
            onClick={pay}
            disabled={soldOut}
            aria-label={soldOut ? "کالا تمام شد" : `پرداخت ${toman(total)} از کیف پول`}
            className={cn(
              "h-13 w-full rounded-xl py-3.5 text-sm font-black transition-all active:scale-[.98]",
              soldOut
                ? "cursor-not-allowed bg-white/10 text-white/40"
                : short
                  ? "bg-ls-pink text-white shadow-[0_8px_24px_rgba(255,59,139,.35)] hover:brightness-110"
                  : "bg-ls-green text-[#04281e] shadow-[0_8px_24px_rgba(0,200,150,.35)] hover:brightness-110"
            )}
          >
            {soldOut ? (
              "تمام شد"
            ) : short ? (
              "موجودی کافی نیست — شارژ کن"
            ) : (
              <>پرداخت {toman(total)}</>
            )}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
