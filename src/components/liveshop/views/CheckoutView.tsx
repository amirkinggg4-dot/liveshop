"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, MapPin, Wallet as WalletIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toman } from "@/lib/format";
import { getItem, getShowItems } from "@/lib/data/items";
import {
  DEFAULT_ADDRESS,
  SHIPPING_METHODS,
  getShippingMethod,
} from "@/lib/data/orders";
import { getSeller, getShow } from "@/lib/data/shows";
import type { ShippingMethodId } from "@/lib/data/types";
import { useAppStore } from "@/store/app-store";
import { useWalletStore } from "@/store/wallet-store";
import { nextOrderId, useOrdersStore } from "@/store/orders-store";
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
  const canAfford = useWalletStore((s) => s.canAfford);
  const spend = useWalletStore((s) => s.spend);
  const addOrder = useOrdersStore((s) => s.addOrder);

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

  const itemPrice = item.buyNowPrice ?? item.startPrice;
  const total = itemPrice + method.price;

  const handlePay = () => {
    if (!canAfford(total)) {
      toast.error("موجودی کافی نیست — کیف پول را شارژ کنید");
      push("wallet");
      return;
    }
    spend(total, "خرید فوری — " + item.title, "purchase");
    addOrder({
      id: nextOrderId(),
      itemTitle: item.title,
      itemBrand: item.brand,
      itemEmoji: item.emoji,
      cover: item.cover,
      sellerName: seller.name,
      sellerEmoji: seller.emoji,
      sellerColor: seller.color,
      itemPrice,
      shippingPrice: method.price,
      shippingMethod: method.id,
      total,
      address: DEFAULT_ADDRESS,
      createdAtLabel: "همین حالا",
      timeline: [
        { label: "پرداخت شد", done: true, atLabel: "همین حالا" },
        { label: "در حال آماده‌سازی", done: false },
        { label: "ارسال شد", done: false },
      ],
    });
    toast.success("پرداخت موفق! سفارش ثبت شد 🎉");
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
            <p className="text-xs text-white/50 truncate">{seller.name}</p>
          </div>
          <Price amount={itemPrice} className="text-sm shrink-0" />
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
          className="w-full h-12 rounded-xl bg-ls-purple text-sm font-black text-white shadow-[0_8px_24px_rgba(108,92,255,.35)] transition-transform active:scale-[.98]"
          aria-label={`پرداخت مبلغ ${toman(total)} از کیف پول`}
        >
          پرداخت {toman(total)}
        </button>
      </div>
    </div>
  );
}
