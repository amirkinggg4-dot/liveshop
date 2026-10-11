"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   v1.8.0 — «دریافت رسید» — صفحهٔ چاپی سادهٔ سفارش
   شمارهٔ سفارش، اقلام، مبالغ، تاریخ — با دکمهٔ چاپ (window.print)
   کاغذ سفید روی قاب تیرهٔ اپ؛ در چاپ فقط کاغذ می‌آید (no-print پنهان).
   ═══════════════════════════════════════════════════════════════════════════ */

import { Printer, ChevronRight } from "lucide-react";
import { toFa, toman } from "@/lib/format";
import { getShippingMethod } from "@/lib/data/orders";
import { ORDER_STATUS_LABEL } from "@/lib/order-state";
import { useAppStore } from "@/store/app-store";
import { useOrdersStore } from "@/store/orders-store";
import { DayLabel } from "@/components/liveshop/order-ui";
import { EmptyState } from "@/components/liveshop/shared";

export default function OrderReceiptView() {
  const back = useAppStore((s) => s.back);
  const stackParam = useAppStore((s) => s.stack[s.stack.length - 1].param);
  const currentOrderId = useAppStore((s) => s.currentOrderId);
  const order = useOrdersStore((s) =>
    s.orders.find((o) => o.id === (stackParam ?? currentOrderId))
  );

  if (!order) {
    return (
      <div className="flex-1 flex flex-col bg-ls-bg" aria-label="رسید سفارش">
        <EmptyState emoji="🧾" title="سفارشی پیدا نشد" desc="این رسید دیگر در دسترس نیست." />
      </div>
    );
  }

  const method = getShippingMethod(order.shippingMethod);

  return (
    <div
      className="flex-1 flex flex-col bg-ls-bg print:bg-white"
      aria-label={`رسید سفارش ${order.id}`}
    >
      {/* نوار بالا (چاپ نمی‌شود) */}
      <div className="no-print flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-ls-bg/85 backdrop-blur">
        <button
          onClick={back}
          aria-label="بازگشت"
          className="w-9 h-9 shrink-0 rounded-full bg-ls-card-2 flex items-center justify-center text-white/80 hover:bg-ls-line transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <h1 className="text-base font-extrabold">رسید سفارش</h1>
      </div>

      {/* کاغذ رسید */}
      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-5">
        <div
          dir="rtl"
          className="mx-auto w-full max-w-sm rounded-2xl bg-white text-black shadow-2xl p-6 print:rounded-none print:shadow-none"
        >
          {/* سربرگ */}
          <div className="flex items-start justify-between border-b-2 border-dashed border-black/15 pb-4">
            <div>
              <p className="text-lg font-black">LiveShop</p>
              <p className="mt-0.5 text-[11px] text-black/55">
                رسید خرید — پرداخت امانی
              </p>
            </div>
            <div className="text-left">
              <p className="text-[11px] text-black/55">شمارهٔ سفارش</p>
              <p className="text-base font-black tabular-nums" dir="rtl">
                {toFa(order.id)}
              </p>
            </div>
          </div>

          {/* تاریخ و وضعیت */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
            <div>
              <p className="text-black/50">تاریخ ثبت</p>
              <p className="mt-0.5 font-bold">
                <DayLabel ms={order.createdAtMs} />
              </p>
            </div>
            <div>
              <p className="text-black/50">وضعیت</p>
              <p className="mt-0.5 font-bold">
                {ORDER_STATUS_LABEL[order.status]}
              </p>
            </div>
            <div>
              <p className="text-black/50">فروشنده</p>
              <p className="mt-0.5 font-bold break-words">{order.sellerName}</p>
            </div>
            <div>
              <p className="text-black/50">روش ارسال</p>
              <p className="mt-0.5 font-bold">{method.label}</p>
            </div>
          </div>

          {/* اقلام */}
          <div className="mt-5 border-t border-black/10 pt-4">
            <p className="mb-2 text-[12px] font-black">اقلام سفارش</p>
            <div className="flex items-start justify-between gap-3 text-[12px]">
              <div className="min-w-0">
                <p className="font-bold break-words leading-5">{order.itemTitle}</p>
                <p className="mt-0.5 text-black/55">
                  {[
                    order.itemBrand,
                    order.qty != null ? `${toFa(order.qty)} عدد` : null,
                    order.variantLabel,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <p className="shrink-0 font-bold tabular-nums">
                {toman(order.itemPrice * (order.qty ?? 1), false)}
              </p>
            </div>
          </div>

          {/* مبالغ */}
          <div className="mt-4 space-y-2 border-t border-black/10 pt-4 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-black/55">جمع کالا</span>
              <span className="font-bold tabular-nums">
                {toman(order.itemPrice * (order.qty ?? 1))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-black/55">
                هزینهٔ ارسال — {method.label}
              </span>
              <span className="font-bold tabular-nums">
                {toman(order.shippingPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t-2 border-dashed border-black/15 pt-3 text-[14px]">
              <span className="font-black">مجموع پرداخت</span>
              <span className="font-black tabular-nums">{toman(order.total)}</span>
            </div>
            <p className="pt-1 text-[10px] leading-4 text-black/45">
              پرداخت از کیف پول به‌صورت امانی — مبلغ تا لحظهٔ تحویل نزد LiveShop
              نگه داشته می‌شود.
            </p>
          </div>

          {/* آدرس */}
          <div className="mt-4 border-t border-black/10 pt-4 text-[12px]">
            <p className="mb-1 text-black/50">آدرس تحویل</p>
            <p className="whitespace-pre-line leading-6">{order.address}</p>
          </div>

          {/* پانویس کاغذ */}
          <p className="mt-6 border-t border-black/10 pt-3 text-center text-[10px] text-black/40 tabular-nums">
            رسید دیجیتال LiveShop — سفارش {toFa(order.id)}
          </p>
        </div>

        {/* دکمهٔ چاپ (چاپ نمی‌شود) */}
        <button
          onClick={() => window.print()}
          className="no-print mx-auto mt-4 flex h-11 w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-ls-purple text-sm font-extrabold text-white transition-transform active:scale-[.98]"
          aria-label="چاپ رسید"
        >
          <Printer className="h-4 w-4" aria-hidden />
          چاپ رسید
        </button>
      </div>
    </div>
  );
}
