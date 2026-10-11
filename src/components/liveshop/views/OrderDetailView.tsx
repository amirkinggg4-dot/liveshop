"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Lock, MapPin, Truck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toFa, toman } from "@/lib/format";
import { getShippingMethod } from "@/lib/data/orders";
import { useAppStore } from "@/store/app-store";
import { useOrdersStore } from "@/store/orders-store";
import DisputeSheet from "@/components/liveshop/dispute-sheet";
import {
  GradientCover,
  Price,
  PageHeader,
  EmptyState,
} from "@/components/liveshop/shared";

export default function OrderDetailView() {
  const currentOrderId = useAppStore((s) => s.currentOrderId);
  const back = useAppStore((s) => s.back);
  const orders = useOrdersStore((s) => s.orders);
  const setRated = useOrdersStore((s) => s.setRated);
  /* فاز ۳ (P1) — شیت اختلاف/ضمانت خریدار */
  const [disputeOpen, setDisputeOpen] = useState(false);

  const order =
    orders.find((o) => o.id === currentOrderId) ?? orders[0];

  if (!order) {
    return (
      <div className="flex-1 flex flex-col" aria-label="جزئیات سفارش">
        <PageHeader title="جزئیات سفارش" onBack={back} />
        <EmptyState emoji="📦" title="سفارشی پیدا نشد" desc="این سفارش دیگر در فهرست شما نیست." />
      </div>
    );
  }

  const method = getShippingMethod(order.shippingMethod);
  const delivered = order.timeline.every((st) => st.done);

  return (
    <div className="flex-1 flex flex-col" aria-label={`جزئیات سفارش ${order.id}`}>
      <PageHeader title={`سفارش #${order.id}`} onBack={back} />

      <div className="px-4 py-4 space-y-4">
        {/* ── کارت کالا ── */}
        <div className="flex items-center gap-3 rounded-2xl bg-ls-card border border-white/5 p-3">
          <GradientCover
            cover={order.cover}
            className="w-14 h-14 rounded-xl shrink-0"
            emojiClassName="text-2xl"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{order.itemTitle}</p>
            <p className="text-xs text-white/50 truncate">
              {order.sellerName} · {order.createdAtLabel}
            </p>
            {/* v1.4 — تعداد و سایز/رنگ انتخاب‌شده */}
            {(order.qty != null || order.variantLabel) && (
              <p className="mt-0.5 text-[11px] font-bold text-white/65 truncate">
                {[order.qty != null ? `${toFa(order.qty)} عدد` : null, order.variantLabel]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
          <Price amount={order.total} className="text-sm shrink-0" />
        </div>

        {/* ── فاز ۳ (P1) — بنر ضمانت خریدار (تصویر ۰۵) — فقط اضافه‌شده ── */}
        <div
          className="flex items-center gap-3 rounded-2xl border border-ls-green/30 bg-ls-green/10 p-3.5"
          aria-label="ضمانت خریدار LiveShop"
        >
          <span className="w-9 h-9 shrink-0 rounded-xl bg-ls-green/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-ls-green" aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">ضمانت خریدار LiveShop</p>
            <p className="text-[11px] text-white/55 mt-0.5 leading-5">
              اگر کالا نرسید یا مطابقت نداشت، مبلغ این سفارش محفوظ است
            </p>
          </div>
        </div>

        {/* ── v1.4 — بنر پرداخت امانی (escrow) ── */}
        {order.escrow !== false && (
          <div
            className="flex items-center gap-3 rounded-2xl border border-ls-purple/30 bg-ls-purple/10 p-3.5"
            aria-label="پرداخت امانی"
          >
            <span className="w-9 h-9 shrink-0 rounded-xl bg-ls-purple/20 flex items-center justify-center">
              <Lock className="h-4 w-4 text-ls-purple-soft" aria-hidden />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ls-purple-soft">
                پول شما نزد لحظه امانت است
              </p>
              <p className="text-[11px] text-white/55 mt-0.5 leading-5">
                مبلغ پرداختی تا لحظهٔ «تحویل» دست فروشنده نمی‌رسد و بعد از تحویل
                آزاد می‌شود.
              </p>
            </div>
          </div>
        )}

        {/* ── تفکیک قیمت ── */}
        <div className="rounded-2xl bg-ls-card border border-white/5 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">قیمت کالا</span>
            <Price amount={order.itemPrice} className="text-sm text-white/85" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">
              هزینهٔ ارسال — {method.label}
            </span>
            <Price amount={order.shippingPrice} className="text-sm text-white/85" />
          </div>
          <div className="border-t border-dashed border-white/10 my-1" role="separator" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold">مجموع پرداخت</span>
            <Price amount={order.total} className="text-xl text-ls-purple" />
          </div>
        </div>

        {/* ── آدرس ── */}
        <div className="rounded-2xl bg-ls-card border border-white/5 p-4 space-y-2">
          <p className="text-sm font-extrabold flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-ls-purple-soft" aria-hidden />
            آدرس تحویل
          </p>
          <p className="whitespace-pre-line text-xs leading-6 text-white/70">
            {order.address}
          </p>
        </div>

        {/* ── ارسال ── */}
        <div className="flex items-center gap-3 rounded-2xl bg-ls-card border border-white/5 p-3.5">
          <span className="w-9 h-9 shrink-0 rounded-xl bg-ls-purple/15 flex items-center justify-center">
            <Truck className="w-4 h-4 text-ls-purple-soft" aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">ارسال با {method.label}</p>
            {order.trackingCode ? (
              <button
                onClick={() => toast("کد کپی شد (دمو)")}
                className="mt-1 rounded-lg bg-ls-card-2 border border-white/10 px-2 py-0.5 font-mono text-[11px] text-white/70 hover:border-ls-purple/50 transition-colors"
                aria-label={`کد رهگیری ${order.trackingCode} — کپی`}
                dir="ltr"
              >
                {toFa(order.trackingCode)}
              </button>
            ) : (
              <p className="text-[11px] text-white/45 mt-0.5">
                کد رهگیری پس از ارسال صادر می‌شود
              </p>
            )}
          </div>
        </div>

        {/* ── تایم‌لاین ── */}
        <div className="rounded-2xl bg-ls-card border border-white/5 p-4">
          <h2 className="mb-4 text-sm font-extrabold">وضعیت سفارش</h2>
          <ol>
            {order.timeline.map((step, i) => (
              <li key={i} className="flex gap-3">
                {/* ستون دایره + خط اتصال عمودی */}
                <div className="flex flex-col items-center">
                  {step.done ? (
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ls-green shadow-[0_0_12px_rgba(0,200,150,.4)]"
                      aria-hidden
                    >
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      className="h-6 w-6 shrink-0 rounded-full border-2 border-dashed border-white/25"
                      aria-hidden
                    />
                  )}
                  {i < order.timeline.length - 1 && (
                    <span
                      className="min-h-6 flex-1 border-r border-white/10"
                      aria-hidden
                    />
                  )}
                </div>
                <div className={cn("pb-5", i === order.timeline.length - 1 && "pb-1")}>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      !step.done && "text-white/50"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.atLabel && (
                    <p className="mt-0.5 text-[11px] text-white/45">{step.atLabel}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ── دکمه‌ها ── */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              order.trackingCode
                ? toast(`کد رهگیری: ${toFa(order.trackingCode)} (دمو)`)
                : toast("به‌زودی کد رهگیری فعال می‌شود (دمو)")
            }
            className="h-11 flex-1 rounded-xl bg-ls-purple text-sm font-extrabold text-white transition-transform active:scale-[.98]"
            aria-label="پیگیری سفارش"
          >
            پیگیری سفارش
          </button>
          <button
            onClick={() => toast("تماس با فروشنده (دمو)")}
            className="h-11 rounded-xl border border-white/15 px-4 text-sm font-bold text-white/80 hover:bg-white/5 transition-colors"
            aria-label={`تماس با فروشنده ${order.sellerName}`}
          >
            تماس با فروشنده
          </button>
        </div>

        {/* ── فاز ۳ (P1) — باز کردن اختلاف — فقط اضافه‌شده ── */}
        <button
          onClick={() => setDisputeOpen(true)}
          className="w-full h-11 rounded-xl border border-ls-pink/40 bg-ls-pink/10 text-sm font-bold text-ls-pink hover:bg-ls-pink/20 transition-colors"
          aria-label="باز کردن اختلاف و ضمانت خریدار"
        >
          باز کردن اختلاف — ضمانت خریدار
        </button>

        {delivered && !order.rated && (
          <button
            onClick={() => {
              setRated(order.id);
              toast.success("امتیاز ۵ ستاره ثبت شد");
            }}
            className="w-full h-12 rounded-xl bg-ls-green text-sm font-black text-[#04281e] shadow-[0_8px_24px_rgba(0,200,150,.3)] transition-transform active:scale-[.98]"
            aria-label="ثبت امتیاز به فروشنده"
          >
            امتیاز به فروشنده
          </button>
        )}

        {/* متن راهنما برای حفظ ریتم فاصله‌ها */}
        <p className="text-center text-[11px] text-white/35 pb-1">
          مبلغ سفارش: {toman(order.total)} — پرداخت‌شده از کیف پول
        </p>
      </div>

      {/* فاز ۳ (P1) — شیت ثبت اختلاف (تصویر ۰۵) — فقط اضافه‌شده */}
      <DisputeSheet
        key={order.id}
        orderId={order.id}
        itemTitle={order.itemTitle}
        amount={order.total}
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
      />
    </div>
  );
}
