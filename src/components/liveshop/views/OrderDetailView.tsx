"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  Check,
  Lock,
  LockOpen,
  MapPin,
  MessageCircle,
  Printer,
  ReceiptText,
  RotateCcw,
  Scale,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toFa, toman } from "@/lib/format";
import { getShippingMethod } from "@/lib/data/orders";
import {
  availableActions,
  autoReleaseLeftMs,
  disputeWindowLeftMs,
} from "@/lib/order-state";
import { ESCROW_AUTO_RELEASE_DAYS, DISPUTE_WINDOW_HOURS } from "@/lib/config/fees";
import { useAppStore } from "@/store/app-store";
import { useOrdersStore } from "@/store/orders-store";
import OrderDisputeSheet from "@/components/liveshop/dispute-sheet";
import OrderContactSheet from "@/components/liveshop/order-contact-sheet";
import OrderRatingDialog from "@/components/liveshop/order-rating-dialog";
import {
  faDurationLeft,
  StepTime,
  OrderStatusBadge,
  DayLabel,
} from "@/components/liveshop/order-ui";
import {
  GradientCover,
  Price,
  PageHeader,
  EmptyState,
} from "@/components/liveshop/shared";
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

/* ═══════════════════════════════════════════════════════════════════════════
   v1.8.0 — جزئیات سفارش (نمای خریدار)
   دکمه‌های اصلی فقط بر اساس وضعیت (availableActions):
   لغو سفارش | تحویل گرفتم | آزادسازی مبلغ | گزارش مشکل |
   امتیاز به فروشنده + سفارش دوباره (بعد از آزادسازی)
   + دریافت رسید (صفحهٔ چاپی) + تماس با فروشنده (پیام mock)
   پیشروی فقط با همین دکمه‌های واقعی است — هیچ advance خودکاری نیست.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function OrderDetailView() {
  const currentOrderId = useAppStore((s) => s.currentOrderId);
  const back = useAppStore((s) => s.back);
  const push = useAppStore((s) => s.push);
  const orders = useOrdersStore((s) => s.orders);
  const cancelOrder = useOrdersStore((s) => s.cancelOrder);
  const confirmDelivery = useOrdersStore((s) => s.confirmDelivery);
  const releaseEscrow = useOrdersStore((s) => s.releaseEscrow);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);

  /* آزادسازی خودکار سررسیدشده‌ها — هنگام ورود به جزئیات */
  useEffect(() => {
    useOrdersStore.getState().autoReleaseTick();
  }, []);

  const order = orders.find((o) => o.id === currentOrderId) ?? orders[0];

  if (!order) {
    return (
      <div className="flex-1 flex flex-col" aria-label="جزئیات سفارش">
        <PageHeader title="جزئیات سفارش" onBack={back} />
        <EmptyState emoji="📦" title="سفارشی پیدا نشد" desc="این سفارش دیگر در فهرست شما نیست." />
      </div>
    );
  }

  const now = Date.now();
  const actions = availableActions(
    {
      status: order.status,
      total: order.total,
      deliveredAtMs: order.deliveredAtMs,
      rated: order.rated,
    },
    now
  );
  const method = getShippingMethod(order.shippingMethod);
  const disputeLeft = disputeWindowLeftMs(order.deliveredAtMs, now);
  const autoLeft = autoReleaseLeftMs(order.deliveredAtMs, now);
  const disputeResolved = order.dispute && order.dispute.status !== "OPEN";

  /* ── اکشن‌ها ── */
  const doCancel = () => {
    const res = cancelOrder(order.id);
    setCancelOpen(false);
    if (res.ok) {
      toast.success(`سفارش لغو شد — ${toman(order.total)} به کیف پول برگشت`);
    } else {
      toast.error(res.error ?? "لغو انجام نشد");
    }
  };

  const doDeliver = () => {
    const res = confirmDelivery(order.id);
    setDeliverOpen(false);
    if (res.ok) {
      toast.success("تحویل ثبت شد — مبلغ طبق روال به فروشنده آزاد می‌شود");
    } else {
      toast.error(res.error ?? "ثبت تحویل انجام نشد");
    }
  };

  const doRelease = () => {
    const res = releaseEscrow(order.id);
    if (res.ok) {
      toast.success("مبلغ به فروشنده آزاد شد — ممنون از اعتمادت");
    } else {
      toast.error(res.error ?? "آزادسازی انجام نشد");
    }
  };

  return (
    <div className="flex-1 flex flex-col" aria-label={`جزئیات سفارش ${order.id}`}>
      <PageHeader title={`سفارش #${order.id}`} onBack={back} />

      <div className="px-4 py-4 space-y-4">
        {/* ── وضعیت فعلی + تاریخ ثبت — همیشه دیده می‌شود ── */}
        <div className="flex items-center gap-2.5 pt-1">
          <OrderStatusBadge status={order.status} className="px-3 py-1.5 text-[11px]" />
          <span className="text-[11px] text-white/45">
            ثبت: <DayLabel ms={order.createdAtMs} />
          </span>
        </div>

        {/* ── کارت کالا ── */}
        <div className="flex items-start gap-3 rounded-2xl bg-ls-card border border-white/5 p-3">
          <GradientCover
            cover={order.cover}
            photo={order.photo}
            className="h-16 w-16 shrink-0 rounded-xl"
            emojiClassName="text-2xl"
            sizes="128px"
          />
          <div className="min-w-0 flex-1">
            {/* عنوان تا ۲ خط بدون «…» */}
            <p className="max-h-10 overflow-hidden break-words text-sm font-bold leading-5">
              {order.itemTitle}
            </p>
            <p className="mt-0.5 break-words text-xs text-white/50">
              {order.sellerName}
            </p>
            {(order.qty != null || order.variantLabel) && (
              <p className="mt-0.5 text-[11px] font-bold text-white/65 break-words">
                {[order.qty != null ? `${toFa(order.qty)} عدد` : null, order.variantLabel]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <p className="mt-1 text-[10px] text-white/35 tabular-nums">
              سفارش #{order.id}
            </p>
          </div>
          <Price amount={order.total} className="shrink-0 text-sm" />
        </div>

        {/* ── بنر وضعیت امانی — بسته به مرحله ── */}
        {order.status === "PAID_HELD" || order.status === "READY_TO_SHIP" ? (
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
                تا وقتی مرسوله را تحویل نگیری، پول دست فروشنده نمی‌رسد. تا قبل از
                ارسال می‌توانی سفارش را لغو کنی.
              </p>
            </div>
          </div>
        ) : order.escrow !== false ? (
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
                {order.status === "SHIPPED"
                  ? `اگر کالا نرسید یا مطابقت نداشت، تا ${toFa(DISPUTE_WINDOW_HOURS)} ساعت بعد از تحویل می‌توانی گزارش مشکل بدهی.`
                  : order.status === "DELIVERED"
                    ? "پول امانی است — بعد از آزادسازی به فروشنده، برگشت‌پذیر نیست."
                    : "مبلغ این سفارش طبق روال امانی مدیریت شده است."}
              </p>
            </div>
          </div>
        ) : null}

        {/* ── آزادسازی خودکار (فقط DELIVERED) ── */}
        {order.status === "DELIVERED" && autoLeft != null && (
          <div
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ls-card p-3.5"
            aria-label="زمان‌بندی آزادسازی خودکار"
          >
            <span className="w-9 h-9 shrink-0 rounded-xl bg-white/10 flex items-center justify-center">
              <LockOpen className="w-4 h-4 text-ls-green" aria-hidden />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">
                آزادسازی خودکار تا {faDurationLeft(autoLeft)} دیگر
              </p>
              <p className="text-[11px] text-white/55 mt-0.5 leading-5">
                {toFa(ESCROW_AUTO_RELEASE_DAYS)} روز بعد از تحویل، مبلغ خودکار به
                فروشنده آزاد می‌شود — یا همین حالا خودت آزادسازی کن.
              </p>
            </div>
          </div>
        )}

        {/* ── تفکیک قیمت ── */}
        <div className="rounded-2xl bg-ls-card border border-white/5 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">
              قیمت کالا{order.qty != null && order.qty > 1 ? ` × ${toFa(order.qty)}` : ""}
            </span>
            <Price
              amount={order.itemPrice * (order.qty ?? 1)}
              className="text-sm text-white/85"
            />
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
              (() => {
                const tracking = order.trackingCode;
                return (
                  <button
                    onClick={() => toast(`کد رهگیری: ${toFa(tracking)} (دمو)`)}
                    className="mt-1 rounded-lg bg-ls-card-2 border border-white/10 px-2 py-0.5 font-mono text-[11px] text-white/70 hover:border-ls-purple/50 transition-colors"
                    aria-label={`کد رهگیری ${tracking} — کپی`}
                    dir="ltr"
                  >
                    {toFa(tracking)}
                  </button>
                );
              })()
            ) : (
              <p className="text-[11px] text-white/45 mt-0.5">
                کد رهگیری پس از ارسال صادر می‌شود
              </p>
            )}
          </div>
        </div>

        {/* ── تایم‌لاین با زمان واقعی ── */}
        <div className="rounded-2xl bg-ls-card border border-white/5 p-4">
          <h2 className="mb-4 text-sm font-extrabold">وضعیت سفارش</h2>
          <ol aria-label="تایم‌لاین سفارش">
            {order.timeline.map((step, i) => (
              <li key={`${step.label}-${i}`} className="flex gap-3">
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
                  {step.atMs != null && (
                    <p className="mt-0.5 text-[11px] text-white/45">
                      <StepTime ms={step.atMs} />
                    </p>
                  )}
                  {step.note && (
                    <p className="mt-0.5 text-[11px] leading-5 text-white/55">
                      {step.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ── پیگیری اختلاف (وقتی پرونده باز یا حل‌شده است) ── */}
        {order.dispute && (
          <div
            className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 space-y-2.5"
            aria-label="پیگیری اختلاف"
          >
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
              <p className="text-sm font-extrabold">پیگیری اختلاف</p>
              <span
                className={cn(
                  "ms-auto inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                  disputeResolved
                    ? "bg-ls-green/15 text-ls-green border border-ls-green/40"
                    : "bg-amber-300/15 text-amber-300 border border-amber-300/40"
                )}
              >
                {disputeResolved
                  ? order.dispute.status === "RESOLVED_REFUND"
                    ? "حل شد — بازگشت وجه"
                    : "حل شد — آزادسازی به فروشنده"
                  : "در بررسی کارشناس"}
              </span>
            </div>
            <p className="text-[11px] leading-5 text-white/65">
              <span className="font-bold text-white/80">دلیل:</span>{" "}
              {order.dispute.reason}
            </p>
            {order.dispute.desc && (
              <p className="text-[11px] leading-5 text-white/55 break-words">
                {order.dispute.desc}
              </p>
            )}
            <p className="text-[11px] text-white/45">
              ثبت: <StepTime ms={order.dispute.filedAtMs} />
              {disputeResolved && (
                <>
                  {" — "}
                  نتیجه:{" "}
                  <StepTime ms={order.refundedAtMs ?? order.releasedAtMs ?? undefined} />
                </>
              )}
            </p>
            {!disputeResolved && (
              <p className="text-[11px] leading-5 text-white/55">
                کارشناس تا ۲۴ ساعت بررسی می‌کند؛ نتیجه (بازگشت وجه یا آزادسازی به
                فروشنده) در همین تایم‌لاین ثبت می‌شود.
              </p>
            )}
          </div>
        )}

        {/* ── امتیاز ثبت‌شده ── */}
        {order.rating && (
          <div
            className="rounded-2xl bg-ls-card border border-white/5 p-4 space-y-2"
            aria-label="امتیاز ثبت‌شدهٔ شما"
          >
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i <= order.rating!.stars
                      ? "fill-amber-300 text-amber-300"
                      : "text-white/20"
                  )}
                  aria-hidden
                />
              ))}
              <span className="ms-auto text-[11px] text-white/45">
                امتیاز تو ثبت شد
              </span>
            </div>
            {order.rating.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {order.rating.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-ls-green/10 border border-ls-green/30 px-2.5 py-0.5 text-[10px] font-bold text-ls-green"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {order.rating.text && (
              <p className="text-[11px] leading-5 text-white/65 break-words">
                «{order.rating.text}»
              </p>
            )}
          </div>
        )}

        {/* ── دکمه‌های اصلی بر اساس وضعیت ── */}
        <div className="space-y-2.5">
          {actions.confirmDelivery && (
            <button
              onClick={() => setDeliverOpen(true)}
              className="h-12 w-full rounded-xl bg-ls-green text-sm font-black text-[#04281e] shadow-[0_8px_24px_rgba(0,200,150,.3)] transition-transform active:scale-[.98]"
              aria-label="تحویل گرفتم — ثبت تحویل مرسوله"
            >
              تحویل گرفتم
            </button>
          )}

          {actions.release && (
            <button
              onClick={doRelease}
              className="h-12 w-full rounded-xl bg-ls-green text-sm font-black text-[#04281e] shadow-[0_8px_24px_rgba(0,200,150,.3)] transition-transform active:scale-[.98]"
              aria-label={`آزادسازی ${toman(order.total)} به فروشنده`}
            >
              آزادسازی مبلغ به فروشنده
            </button>
          )}

          {actions.cancel && (
            <button
              onClick={() => setCancelOpen(true)}
              className="h-11 w-full rounded-xl border border-ls-pink/40 bg-ls-pink/10 text-sm font-bold text-ls-pink hover:bg-ls-pink/20 transition-colors"
              aria-label="لغو سفارش — بازگشت مبلغ به کیف پول"
            >
              لغو سفارش
            </button>
          )}

          {actions.dispute && (
            <button
              onClick={() => setDisputeOpen(true)}
              className="h-11 w-full rounded-xl border border-amber-300/40 bg-amber-300/10 text-sm font-bold text-amber-300 hover:bg-amber-300/20 transition-colors"
              aria-label="گزارش مشکل — ثبت اختلاف و ضمانت خریدار"
            >
              گزارش مشکل
              {order.status === "DELIVERED" && disputeLeft != null && (
                <span className="ms-1.5 text-[10px] font-normal opacity-80">
                  (تا {faDurationLeft(disputeLeft)} دیگر)
                </span>
              )}
            </button>
          )}

          {actions.rate && (
            <button
              onClick={() => setRateOpen(true)}
              className="h-12 w-full rounded-xl bg-ls-purple text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(108,92,255,.35)] transition-transform active:scale-[.98]"
              aria-label="امتیاز به فروشنده"
            >
              امتیاز به فروشنده
            </button>
          )}

          {actions.reorder && (
            <button
              onClick={() => push("sellerStorefront")}
              className="h-11 w-full rounded-xl border border-ls-purple/50 bg-ls-purple/10 text-sm font-bold text-ls-purple-soft hover:bg-ls-purple/20 transition-colors"
              aria-label={`سفارش دوباره از فروشگاه ${order.sellerName}`}
            >
              <RotateCcw className="ms-0 me-1.5 inline h-4 w-4" aria-hidden />
              سفارش دوباره (به فروشگاه فروشنده)
            </button>
          )}

          {/* ── ردیف دوم: رسید + تماس ── */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => push("orderReceipt", order.id)}
              className="h-11 flex-1 rounded-xl border border-white/15 text-sm font-bold text-white/80 hover:bg-white/5 transition-colors"
              aria-label="دریافت رسید سفارش"
            >
              <ReceiptText className="me-1.5 inline h-4 w-4" aria-hidden />
              دریافت رسید
            </button>
            <button
              onClick={() => setContactOpen(true)}
              className="h-11 flex-1 rounded-xl border border-white/15 text-sm font-bold text-white/80 hover:bg-white/5 transition-colors"
              aria-label={`تماس با فروشنده ${order.sellerName}`}
            >
              <MessageCircle className="me-1.5 inline h-4 w-4" aria-hidden />
              تماس با فروشنده
            </button>
          </div>

          {/* راهنمای وضعیت‌های خاص */}
          {(order.status === "PAID_HELD" || order.status === "READY_TO_SHIP") && (
            <p className="flex items-start gap-1.5 pt-1 text-[11px] leading-5 text-white/45">
              <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              تا قبل از ارسال، به‌جای «گزارش مشکل» می‌توانی سفارش را لغو کنی و
              پولت فوراً برمی‌گردد.
            </p>
          )}
          {order.status === "SHIPPED" && (
            <p className="flex items-start gap-1.5 pt-1 text-[11px] leading-5 text-white/45">
              <Printer className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              مرسوله در راه است. بعد از تحویل، مبلغ از حالت امانی آزاد می‌شود.
            </p>
          )}
        </div>

        <p className="text-center text-[11px] text-white/35 pb-1">
          مبلغ سفارش: {toman(order.total)} — پرداخت‌شده از کیف پول
        </p>
      </div>

      {/* ── دیالوگ لغو سفارش ── */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent
          className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm"
          aria-label="تأیید لغو سفارش"
        >
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle>سفارش لغو شود؟</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-6">
              سفارش قبل از ارسال لغو می‌شود و مبلغ{" "}
              <span className="font-bold text-white">{toman(order.total)}</span>{" "}
              فوراً به کیف پول تو برمی‌گردد. این کار برگشت‌پذیر نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:flex-row">
            <AlertDialogCancel className="mt-0 h-10 flex-1 rounded-xl border-white/15 bg-transparent text-sm font-bold text-white/80 hover:bg-white/5">
              منصرف شدم
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={doCancel}
              className="h-10 flex-1 rounded-xl bg-ls-pink text-sm font-extrabold text-white hover:bg-ls-pink/90"
              aria-label="تأیید لغو سفارش"
            >
              بله، لغو کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── دیالوگ تأیید تحویل ── */}
      <AlertDialog open={deliverOpen} onOpenChange={setDeliverOpen}>
        <AlertDialogContent
          className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm"
          aria-label="تأیید تحویل مرسوله"
        >
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle>مرسوله را تحویل گرفتی؟</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-6">
              با تأیید، مبلغ امانی به‌سمت فروشنده می‌رود: همین حالا می‌توانی
              «آزادسازی» کنی یا تا {toFa(ESCROW_AUTO_RELEASE_DAYS)} روز بعد از تحویل
              خودکار آزاد می‌شود. بعد از آزادسازی، پول برگشت‌پذیر نیست — اگر
              مشکلی داری به‌جای تأیید، «گزارش مشکل» را بزن.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:flex-row">
            <AlertDialogCancel className="mt-0 h-10 flex-1 rounded-xl border-white/15 bg-transparent text-sm font-bold text-white/80 hover:bg-white/5">
              هنوز نه
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={doDeliver}
              className="h-10 flex-1 rounded-xl bg-ls-green text-sm font-black text-[#04281e] hover:bg-ls-green/90"
              aria-label="تأیید — تحویل گرفتم"
            >
              بله، تحویل گرفتم
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── شیت ثبت اختلاف (فقط وقتی پنجره باز است رندر می‌شود) ── */}
      {actions.dispute && (
        <OrderDisputeSheet
          key={order.id}
          orderId={order.id}
          itemTitle={order.itemTitle}
          amount={order.total}
          open={disputeOpen}
          onOpenChange={setDisputeOpen}
        />
      )}

      {/* ── شیت تماس با فروشنده ── */}
      <OrderContactSheet
        orderId={order.id}
        sellerName={order.sellerName}
        sellerEmoji={order.sellerEmoji}
        sellerColor={order.sellerColor}
        open={contactOpen}
        onOpenChange={setContactOpen}
      />

      {/* ── دیالوگ امتیاز (بعد از آزادسازی) ── */}
      {actions.rate && (
        <OrderRatingDialog
          orderId={order.id}
          sellerName={order.sellerName}
          open={rateOpen}
          onOpenChange={setRateOpen}
        />
      )}
    </div>
  );
}
