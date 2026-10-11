"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   QuickCheckoutSheet — خرید سریع با قیمت ثابت (v1.4 / v1.4.1 ظاهر)
   با زدن «خرید» از پایین باز می‌شود:
   ─ انتخاب سایز/رنگ (دکمه‌های ≥۴۸px، موجودی هر سایز زیر دکمه با فونت خوانا)
   ─ تعداد (تا سقف موجودی زندهٔ همین لحظه)
   ─ آدرس ذخیره‌شدهٔ پیش‌فرض
   ─ روش ارسال (تیپاکس/پست پیشتاز/پیک شهری) با هزینه
   ─ جمع کل شامل ارسال + موجودی کیف پول با لینک شارژ
   ─ «پرداخت» در فوتر چسبان پایین شیت — محتوا بالایش اسکرول می‌شود
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
import { faNum, toman, toFa } from "@/lib/format";
import { calcOrderTotal } from "@/lib/config/fees";
import { stockLabelFa } from "@/lib/data/items";
import { SHIPPING_METHODS } from "@/lib/data/orders";
import type { ShopItem, ShippingMethodId } from "@/lib/data/types";
import { useLiveStore } from "@/store/live-store";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/store/auth-store";
import { useAddressesStore, selectDefaultAddress } from "@/store/addresses-store";
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
  /* v1.8.0 — منطق مشترک قیمت+ارسال (تک منبع calcOrderTotal با تسویه) */
  const totals = calcOrderTotal({
    unitPrice: current.price,
    qty,
    shippingFee: method.price,
  });
  const itemTotal = totals.itemsTotal;
  const total = totals.total;
  const short = balance < total;

  const changeQty = (next: number) => {
    setQty(Math.min(Math.max(1, next), Math.max(1, Math.min(maxQty, 5))));
  };

  /* v1.9.0 — گیت مهمان: پرداخت فقط با ورود؛ بعد از ورود همان پرداخت ادامه می‌یابد */
  const { requireAuth } = useAuth();
  const defaultAddress = useAddressesStore(selectDefaultAddress);
  /* تغییر آدرس: بستن شیت و رفتن به صفحهٔ آدرس‌ها */
  const openAddresses = () => {
    onOpenChange(false);
    push("addresses");
  };
  const pay = () =>
    requireAuth(() => {
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
    toast.success("خرید شما ثبت شد — پول تا لحظهٔ تحویل امانت است");
    onOpenChange(false);
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {/* v1.4.1 — ارتفاع ثابت: محتوا در وسط اسکرول می‌شود، «پرداخت» در فوتر چسبان همیشه دیده می‌شود */}
      <DrawerContent className="h-[85vh] bg-ls-card border-t border-ls-green/30 rounded-t-3xl">
        {celebrate > 0 && <Confetti key={celebrate} />}
        <DrawerHeader className="shrink-0 pb-2 text-right">
          <DrawerTitle className="flex items-center gap-2 text-base font-black">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ls-green/15 text-sm" aria-hidden>
              🛒
            </span>
            خرید سریع
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            انتخاب سایز، تعداد، آدرس و روش ارسال و پرداخت امانی از کیف پول
          </DrawerDescription>
        </DrawerHeader>

        {/* ── ناحیهٔ اسکرول‌شونده ── */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-1 pb-4 scroll-thin">
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

          {/* ── سایز/رنگ — v1.4.1: دکمه‌های ≥۴۸px، موجودی هر گزینه زیر دکمه با فونت خوانا ── */}
          {current.variants && current.variants.length > 0 && (
            <div role="radiogroup" aria-label="انتخاب سایز یا رنگ">
              <p className="mb-2 text-xs font-extrabold text-white/80">سایز / رنگ</p>
              <div className="flex flex-wrap gap-x-2 gap-y-2.5">
                {current.variants.map((v) => {
                  const active = variant === v.label;
                  const out = v.stock <= 0;
                  const low = !out && v.stock < 3;
                  return (
                    <div key={v.label} className="flex min-w-[64px] flex-col items-center gap-1">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={out}
                        onClick={() => {
                          setVariantRaw(v.label);
                          changeQty(1);
                        }}
                        aria-label={`انتخاب ${v.label}`}
                        className={cn(
                          "flex min-h-12 min-w-12 items-center justify-center rounded-xl border px-3.5 text-sm font-bold transition-all active:scale-[.97]",
                          out
                            ? "cursor-not-allowed border-white/10 bg-white/5 text-white/30 line-through"
                            : active
                              ? "border-ls-purple bg-ls-purple/20 text-white shadow-[0_0_12px_rgba(108,92,255,.35)]"
                              : "border-white/15 bg-ls-card-2 text-white/75 hover:border-ls-purple/50"
                        )}
                      >
                        {v.label}
                      </button>
                      {/* موجودی همین سایز — زیر دکمه، فونت خوانا */}
                      <span
                        className={cn(
                          "text-[11px] font-bold leading-4",
                          out ? "text-white/35" : low ? "text-amber-300" : "text-ls-green"
                        )}
                        aria-live="polite"
                      >
                        {out ? "تمام شد" : `${faNum(v.stock)} عدد`}
                      </span>
                    </div>
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
                onClick={() => openAddresses()}
                className="text-[11px] font-bold text-ls-purple-soft hover:underline"
                aria-label="تغییر آدرس تحویل"
              >
                تغییر
              </button>
            </div>
            {defaultAddress ? (
              <div className="text-[11px] leading-5 text-white/60">
                <p className="font-bold text-white/85">{defaultAddress.recipient} · <span dir="ltr">{toFa(defaultAddress.phone)}</span></p>
                <p className="mt-0.5">{defaultAddress.province}، {defaultAddress.city} — {defaultAddress.line}</p>
              </div>
            ) : (
              <p className="text-[11px] leading-5 text-white/50">آدرسی نداری — از صفحهٔ حساب ← آدرس‌ها اضافه کن.</p>
            )}
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
        </div>

        {/* ── v1.4.1 — فوتر چسبان: دکمهٔ «پرداخت» همیشه پایین شیت دیده می‌شود ── */}
        <div className="shrink-0 border-t border-white/10 bg-ls-card px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <button
            type="button"
            onClick={pay}
            disabled={soldOut}
            aria-label={soldOut ? "کالا تمام شد" : `پرداخت ${toman(total)} از کیف پول`}
            className={cn(
              "flex h-13 w-full items-center justify-center rounded-xl py-3.5 text-sm font-black transition-all active:scale-[.98]",
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
