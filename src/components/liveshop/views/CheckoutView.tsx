"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, MapPin, ShieldCheck, Wallet as WalletIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toman } from "@/lib/format";
import { getItem, getShowItems, stockLabelFa } from "@/lib/data/items";
import { calcOrderTotal } from "@/lib/config/fees";
import {
  DEFAULT_ADDRESS,
  SHIPPING_METHODS,
  getShippingMethod,
} from "@/lib/data/orders";
import { getSeller, getShow } from "@/lib/data/shows";
import type { ShippingMethodId } from "@/lib/data/types";
import { useAppStore } from "@/store/app-store";
import { useWalletStore } from "@/store/wallet-store";
import { useLiveStore } from "@/store/live-store";
import {
  GradientCover,
  Price,
  PageHeader,
  SectionTitle,
} from "@/components/liveshop/shared";

export default function CheckoutView() {
  /* param پشتهٔ ناوبری اولویت دارد (خرید فوری از لایو/کالا)، وگرنه currentItemId */
  const stackParam = useAppStore(
    (s) => s.stack[s.stack.length - 1].param
  );
  const storeItemId = useAppStore((s) => s.currentItemId);
  const currentItemId = stackParam ?? storeItemId;
  const currentShowId = useAppStore((s) => s.currentShowId);
  const back = useAppStore((s) => s.back);
  const push = useAppStore((s) => s.push);
  const setRoot = useAppStore((s) => s.setRoot);

  const balance = useWalletStore((s) => s.balance);
  /* v1.4 — خرید از مسیر واحدِ موتور (purchaseItem): چک موجودی اتمیک + کسر امانی + سفارش امانی */
  const purchaseItem = useLiveStore((s) => s.purchaseItem);
  const liveItems = useLiveStore((s) => s.items);

  /* ── آیتم هدف: currentItemId وگرنه اولین آیتم خرید فوریِ شو ── */
  const item =
    (currentItemId ? getItem(currentItemId) : undefined) ??
    (() => {
      const items = getShowItems(currentShowId ?? "sh1");
      return items.find((i) => i.status === "buy_now") ?? items[0];
    })();

  const seller = getSeller(getShow(item.showId).sellerId);

  const [methodId, setMethodId] = useState<ShippingMethodId>("tipax");
  const method = getShippingMethod(methodId);

  /* v1.4 — کالای زندهٔ اتاق (اگر باز باشد) برای موجودی لحظه‌ای */
  const liveItem = liveItems.find((i) => i.id === item.id);
  const view = liveItem ?? item;

  /* v1.8.0 — منطق مشترک قیمت+ارسال (تک منبع calcOrderTotal) */
  const totals = calcOrderTotal({
    unitPrice: view.price,
    qty: 1,
    shippingFee: method.price,
  });
  const itemPrice = view.price;
  const total = totals.total;
  const soldOut = view.stock <= 0;

  const handlePay = () => {
    if (soldOut) {
      toast.error("کالا تمام شد — موجودی این کالا به پایان رسید");
      return;
    }
    const res = purchaseItem({
      itemId: view.id,
      qty: 1,
      variantLabel: view.variants?.find((v) => v.stock > 0)?.label,
      shippingMethodId: methodId,
    });
    if (!res.ok) {
      toast.error(res.error ?? "پرداخت انجام نشد");
      if (res.error?.includes("کیف پول")) push("wallet");
      return;
    }
    toast.success("پرداخت امانی موفق! سفارش ثبت شد");
    setRoot("orders");
  };

  return (
    <div className="flex-1 flex flex-col" aria-label="تسویهٔ سفارش">
      <PageHeader title="تسویهٔ سفارش" onBack={back} />

      <div className="px-4 py-4 space-y-4">
        {/* ── خلاصهٔ کالا ── */}
        <div className="flex items-center gap-3 rounded-2xl bg-ls-card border border-white/5 p-3">
          <GradientCover
            cover={item.cover}
            className="w-14 h-14 rounded-xl shrink-0"
            emojiClassName="text-2xl"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{item.title}</p>
            <p className="text-xs text-white/50 truncate">
              {seller.name} ·{" "}
              <span
                className={cn(
                  soldOut
                    ? "text-white/45"
                    : view.stock < 3
                      ? "text-amber-300"
                      : "text-ls-green"
                )}
              >
                {stockLabelFa(view.stock)}
              </span>
            </p>
          </div>
          <Price amount={itemPrice} className="text-sm shrink-0" />
        </div>

        {/* ── v1.4 — بنر پرداخت امانی ── */}
        <div className="flex items-center gap-3 rounded-2xl border border-ls-green/30 bg-ls-green/10 p-3">
          <ShieldCheck className="w-5 h-5 shrink-0 text-ls-green" aria-hidden />
          <p className="text-[11px] leading-5 text-white/75">
            پول شما به‌صورت <span className="font-bold text-ls-green">امانی</span> نزد
            لحظه نگه داشته می‌شود و بعد از تحویل کالا به فروشنده آزاد می‌گردد.
          </p>
        </div>

        {/* ── آدرس ── */}
        <div className="rounded-2xl bg-ls-card border border-white/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-ls-purple-soft" aria-hidden />
              آدرس تحویل
            </p>
            <button
              onClick={() => toast("ویرایش آدرس (دمو)")}
              className="text-xs font-bold text-ls-purple-soft hover:underline"
              aria-label="ویرایش آدرس"
            >
              ویرایش
            </button>
          </div>
          <p className="whitespace-pre-line text-xs leading-6 text-white/70">
            {DEFAULT_ADDRESS}
          </p>
        </div>

        {/* ── روش ارسال ── */}
        <div>
          <SectionTitle title="روش ارسال" icon="🚚" />
          <div className="space-y-2" role="radiogroup" aria-label="انتخاب روش ارسال">
            {SHIPPING_METHODS.map((m) => {
              const selected = m.id === methodId;
              return (
                <button
                  key={m.id}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMethodId(m.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-2xl border p-3 text-right transition-colors",
                    selected
                      ? "border-ls-purple bg-ls-purple/10"
                      : "border-white/10 bg-ls-card hover:border-white/25"
                  )}
                >
                  <span
                    className={cn(
                      "w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors",
                      selected ? "border-ls-purple" : "border-white/25"
                    )}
                    aria-hidden
                  >
                    {selected && <Check className="w-3 h-3 text-ls-purple" strokeWidth={3.5} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold">{m.label}</span>
                    <span className="block text-[11px] text-white/50 mt-0.5">{m.eta}</span>
                  </span>
                  <Price amount={m.price} className="text-xs text-white/85 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── کارت پرداخت ── */}
        <div className="rounded-2xl bg-ls-card border border-white/5 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">قیمت کالا</span>
            <Price amount={itemPrice} className="text-sm text-white/85" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">هزینهٔ ارسال — {method.label}</span>
            <Price amount={method.price} className="text-sm text-white/85" />
          </div>
          <div className="border-t border-dashed border-white/10 my-1" role="separator" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold">قابل پرداخت</span>
            <Price amount={total} className="text-xl text-ls-purple" />
          </div>
          <p className="flex items-center gap-1.5 pt-1 text-[11px] text-white/55">
            <WalletIcon className="w-3.5 h-3.5 text-ls-green" aria-hidden />
            پرداخت از کیف پول — موجودی: {toman(balance)}
          </p>
        </div>
      </div>

      {/* ── دکمهٔ پرداخت ── */}
      <div className="sticky bottom-0 z-20 mt-auto bg-ls-bg/90 backdrop-blur border-t border-white/5 p-3">
        <button
          onClick={handlePay}
          disabled={soldOut}
          className={cn(
            "w-full h-12 rounded-xl text-sm font-black transition-transform active:scale-[.98]",
            soldOut
              ? "cursor-not-allowed bg-white/10 text-white/40"
              : "bg-ls-purple text-white shadow-[0_8px_24px_rgba(108,92,255,.35)]"
          )}
          aria-label={soldOut ? "کالا تمام شد" : `پرداخت امانی مبلغ ${toman(total)} از کیف پول`}
        >
          {soldOut ? "تمام شد" : <>پرداخت {toman(total)}</>}
        </button>
      </div>
    </div>
  );
}
