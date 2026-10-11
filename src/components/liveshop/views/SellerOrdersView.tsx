"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Gauge, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { faNum, toFa, toman } from "@/lib/format";
import { SHIPPING_METHODS } from "@/lib/data/orders";
import type { SellerOrder } from "@/lib/data/seller";
import { HUB_STATS } from "@/lib/data/seller";
import { ITEM_PHOTO } from "@/lib/data/media";
import { useAppStore } from "@/store/app-store";
import { useSellerStore } from "@/store/seller-store";
import {
  Avatar,
  EmptyState,
  GradientCover,
  PageHeader,
} from "@/components/liveshop/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* ─────────────────────────────────────────────────────────────
   سفارش‌های فروشنده — فاز ۲ (Atlas تصویر ۲۸)
   انضباط لجستیکی با ضرب‌الاجل «SCAN BY»:
   تب‌های وضعیت + بنر نرخ اسکن به‌موقع، چاپ لیبل مرسوله در تیپاکس
   (پردازش شبیه‌سازی‌شده)، ثبت کد رهگیری، تکمیل سفارش و پاسخ به
   اختلاف خریدار — همه با دادهٔ زندهٔ seller-store.
   ───────────────────────────────────────────────────────────── */

type TabId = "to_scan" | "shipped" | "completed" | "issue";

const TABS: Array<{ id: TabId; label: string; emoji: string }> = [
  { id: "to_scan", label: "در انتظار اسکن", emoji: "📦" },
  { id: "shipped", label: "ارسال‌شده", emoji: "🚚" },
  { id: "completed", label: "تکمیل‌شده", emoji: "✅" },
  { id: "issue", label: "مشکلات", emoji: "⚖️" },
];

const EMPTY_STATE: Record<TabId, { title: string; desc: string }> = {
  to_scan: {
    title: "سفارشی در انتظار اسکن نیست",
    desc: "هر خریدی که ثبت شود، اینجا برای چیدن مرسوله می‌آید.",
  },
  shipped: {
    title: "مرسوله‌ای در راه نداری",
    desc: "بعد از چاپ لیبل، سفارش‌ها به این تب می‌آیند.",
  },
  completed: {
    title: "هنوز سفارشی تکمیل نشده",
    desc: "وقتی خریدار سفارش را تحویل بگیرد، اینجا با ستارهٔ رضایت ثبت می‌شود.",
  },
  issue: {
    title: "هیچ اختلافی باز نیست — عالیه!",
    desc: "اگر خریدار پرونده‌ای باز کند، اینجا با ضرب‌الاجل پاسخ می‌بینی.",
  },
};

/* رنگ بج مهلت اسکن بر اساس urgency (ok سبز / warn کهربایی / late قرمز) */
const URGENCY_CLS: Record<SellerOrder["urgency"], string> = {
  ok: "bg-ls-green/15 text-ls-green border border-ls-green/40",
  warn: "bg-amber-300/15 text-amber-300 border border-amber-300/40",
  late: "bg-[#FF3B5C]/15 text-[#FF3B5C] border border-[#FF3B5C]/40 animate-ls-pulse",
};

/* چیپ وضعیت برای سفارش‌های غیر to_scan */
const STATUS_CHIP: Record<
  Exclude<SellerOrder["status"], "to_scan">,
  { label: string; cls: string }
> = {
  shipped: {
    label: "ارسال شد",
    cls: "bg-ls-green/15 text-ls-green border border-ls-green/40",
  },
  completed: { label: "تکمیل شد", cls: "bg-white/10 text-white/55" },
  issue: {
    label: "اختلاف",
    cls: "bg-ls-pink/15 text-ls-pink border border-ls-pink/40",
  },
};

/* برچسب روش ارسال از SHIPPING_METHODS با نقشهٔ پشتیبان */
const METHOD_FALLBACK: Record<SellerOrder["shippingMethod"], string> = {
  tipax: "تیپاکس",
  post: "پست پیشتاز",
  peyk: "پیک شهری",
};

function methodLabel(id: SellerOrder["shippingMethod"]): string {
  return SHIPPING_METHODS.find((m) => m.id === id)?.label ?? METHOD_FALLBACK[id];
}

/* ── دیالوگ چاپ لیبل: تأیید → پردازش ۱.۲ ثانیه → کد رهگیری ── */
function PrintLabelDialog({
  order,
  onClose,
}: {
  order: SellerOrder;
  onClose: () => void;
}) {
  const printLabel = useSellerStore((s) => s.printLabel);
  const [processing, setProcessing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const close = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onClose();
  };

  const confirm = () => {
    if (processing) return;
    setProcessing(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const code = printLabel(order.id);
      setProcessing(false);
      if (code) {
        toast.success(`مرسوله ساخته شد — کد رهگیری ${toFa(code)}`);
      } else {
        toast.error("ساخت مرسوله ممکن نشد — سفارش در وضعیت اسکن نیست");
      }
      onClose();
    }, 1200);
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent
        className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm"
        aria-label="ایجاد مرسوله در تیپاکس"
      >
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle>ایجاد مرسوله در تیپاکس</DialogTitle>
          <DialogDescription className="text-xs leading-5">
            لیبل مرسولهٔ سفارش {toFa(order.id)} ساخته می‌شود و کد رهگیری
            به‌طور خودکار ثبت می‌شود.
          </DialogDescription>
        </DialogHeader>

        {processing ? (
          <div
            className="flex flex-col items-center gap-3 py-6 text-center"
            role="status"
            aria-live="polite"
          >
            <Loader2
              className="h-9 w-9 animate-spin text-ls-purple"
              aria-hidden
            />
            <p className="text-sm font-extrabold">در حال ساخت مرسوله…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-ls-card-2 p-2.5">
              <GradientCover
                cover={order.cover}
                className="h-10 w-10 shrink-0 rounded-lg"
                emojiClassName="text-base"
                photo={ITEM_PHOTO[order.itemId ?? ""]}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{order.itemTitle}</p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  {methodLabel(order.shippingMethod)} ·{" "}
                  {toman(order.shippingPrice)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={confirm}
              className="h-11 w-full rounded-xl bg-ls-purple text-sm font-extrabold text-white transition-transform active:scale-[.98]"
              aria-label={`تأیید ساخت مرسوله برای سفارش ${toFa(order.id)}`}
            >
              ساخت مرسوله و چاپ لیبل
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── دیالوگ ثبت دستی کد رهگیری ── */
function TrackDialog({
  order,
  onClose,
}: {
  order: SellerOrder;
  onClose: () => void;
}) {
  const addTracking = useSellerStore((s) => s.addTracking);
  const [code, setCode] = useState("");

  const submit = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("کد رهگیری را وارد کن");
      return;
    }
    addTracking(order.id, trimmed);
    toast.success(`کد رهگیری سفارش ${toFa(order.id)} ثبت شد`);
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm"
        aria-label="ثبت کد رهگیری سفارش"
      >
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle>ثبت کد رهگیری</DialogTitle>
          <DialogDescription className="text-xs leading-5">
            کد مرسولهٔ {methodLabel(order.shippingMethod)} برای سفارش{" "}
            {toFa(order.id)} را وارد کن.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            dir="ltr"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="TPX-123456"
            className="h-10 rounded-xl border-white/10 bg-ls-card-2 text-left font-mono text-sm"
            aria-label="کد رهگیری مرسوله"
          />
          <button
            type="button"
            onClick={submit}
            className="h-11 w-full rounded-xl bg-ls-purple text-sm font-extrabold text-white transition-transform active:scale-[.98]"
            aria-label={`ثبت کد رهگیری برای سفارش ${toFa(order.id)}`}
          >
            ثبت کد
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── دیالوگ پاسخ به اختلاف خریدار ── */
function IssueReplyDialog({
  order,
  onClose,
}: {
  order: SellerOrder;
  onClose: () => void;
}) {
  const resolveIssue = useSellerStore((s) => s.resolveIssue);
  const [reply, setReply] = useState("");

  const submit = () => {
    if (!reply.trim()) {
      toast.error("متن پاسخ را وارد کن");
      return;
    }
    resolveIssue(order.id, reply.trim());
    toast.success("پاسخ ثبت شد — پرونده برای داوری ذخیره شد");
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm"
        aria-label="پاسخ به اختلاف خریدار"
      >
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle>پاسخ به اختلاف</DialogTitle>
          <DialogDescription className="text-xs leading-5">
            پروندهٔ سفارش {toFa(order.id)} — پس از ارسال، پرونده برای داوری
            ذخیره می‌شود.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="rounded-xl border border-ls-pink/30 bg-ls-pink/10 p-3 text-xs leading-5 text-white/75">
            {order.issueText}
          </p>
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="پاسخ شما به خریدار…"
            rows={4}
            className="rounded-xl border-white/10 bg-ls-card-2 text-sm"
            aria-label="متن پاسخ به خریدار"
          />
          <button
            type="button"
            onClick={submit}
            className="h-11 w-full rounded-xl bg-ls-purple text-sm font-extrabold text-white transition-transform active:scale-[.98]"
            aria-label={`ارسال پاسخ برای سفارش ${toFa(order.id)}`}
          >
            ارسال پاسخ
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SellerOrdersView() {
  const back = useAppStore((s) => s.back);
  const orders = useSellerStore((s) => s.orders);
  const completeOrder = useSellerStore((s) => s.completeOrder);

  const [tab, setTab] = useState<TabId>("to_scan");
  const [labelOrder, setLabelOrder] = useState<SellerOrder | null>(null);
  const [trackOrder, setTrackOrder] = useState<SellerOrder | null>(null);
  const [issueOrder, setIssueOrder] = useState<SellerOrder | null>(null);

  const countOf = (t: TabId) => orders.filter((o) => o.status === t).length;
  const visible = orders.filter((o) => o.status === tab);

  return (
    <div className="flex-1 flex flex-col" aria-label="سفارش‌های فروشنده">
      <PageHeader
        title="سفارش‌های فروشنده"
        subtitle="چیدن و ارسال مرسوله‌ها"
        onBack={back}
      />

      <div className="px-4 py-4">
        {/* ── v1.4 — بنر امانی: پول بعد از تحویل آزاد می‌شود ── */}
        <div
          className="flex items-center gap-2.5 rounded-2xl border border-ls-green/40 bg-ls-green/10 p-3.5"
          aria-label="پرداخت امانی"
        >
          <ShieldCheck className="h-5 w-5 shrink-0 text-ls-green" aria-hidden />
          <p className="text-xs leading-5 text-white/80">
            پول خریدار نزد لحظه <span className="font-bold text-ls-green">امانی</span> است —
            بعد از <span className="font-bold">تحویل</span> سفارش به کیف پول تو آزاد می‌شود.
          </p>
        </div>

        {/* ── تب‌های وضعیت با شمارندهٔ زنده ── */}
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar"
          role="tablist"
          aria-label="تب‌های وضعیت سفارش"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`نمایش سفارش‌های ${t.label} — ${faNum(countOf(t.id))} سفارش`}
                onClick={() => setTab(t.id)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                  active
                    ? "bg-ls-purple text-white"
                    : "bg-ls-card-2 text-white/60 hover:text-white"
                )}
              >
                {t.label} ({faNum(countOf(t.id))})
              </button>
            );
          })}
        </div>

        {/* ── بنر هشدار نرخ اسکن به‌موقع (فقط تب اسکن) ── */}
        {tab === "to_scan" && (
          <div
            className="mt-3.5 flex items-start gap-2.5 rounded-2xl border border-amber-300/40 bg-amber-300/10 p-3.5"
            aria-label="هشدار نرخ اسکن به‌موقع"
          >
            <Gauge
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-300"
              aria-hidden
            />
            <p className="text-xs leading-5 text-amber-100/90">
              نرخ اسکن به‌موقع:{" "}
              <strong className="font-black">
                {faNum(HUB_STATS.onTimeScanPct)}٪
              </strong>{" "}
              — بالای {faNum(80)}٪ بمانید تا محدودیت فروش نداشته باشید.
            </p>
          </div>
        )}

        {/* ── لیست سفارش‌های تب فعال ── */}
        {visible.length === 0 ? (
          <EmptyState
            emoji={TABS.find((t) => t.id === tab)?.emoji ?? "📦"}
            title={EMPTY_STATE[tab].title}
            desc={EMPTY_STATE[tab].desc}
          />
        ) : (
          <ul
            className="mt-3.5 max-h-96 space-y-2.5 overflow-y-auto scroll-thin pl-1"
            aria-label="فهرست سفارش‌ها"
          >
            {visible.map((o) => {
              const chip =
                o.status !== "to_scan" ? STATUS_CHIP[o.status] : null;
              return (
                <li
                  key={o.id}
                  className={cn(
                    "rounded-2xl border p-3.5",
                    o.status === "completed"
                      ? "border-ls-green/25 bg-ls-green/5"
                      : o.status === "issue"
                        ? "border-ls-pink/40 bg-ls-pink/5"
                        : "border-white/5 bg-ls-card"
                  )}
                  aria-label={`سفارش ${toFa(o.id)} — ${o.itemTitle}`}
                >
                  {/* ردیف بالا: شماره سفارش + بج مهلت/وضعیت */}
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black">
                      سفارش #{toFa(o.id)}
                    </p>
                    {chip ? (
                      <span
                        className={cn(
                          "ms-auto rounded-full px-2.5 py-1 text-[10px] font-black",
                          chip.cls
                        )}
                      >
                        {chip.label}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "ms-auto rounded-full px-2.5 py-1 text-[10px] font-black",
                          URGENCY_CLS[o.urgency]
                        )}
                      >
                        مهلت اسکن · {o.scanByLabel}
                      </span>
                    )}
                  </div>

                  {/* کالا و خریدار — v1.7.0: عکس اصلی کالا (fallback = گرادیان) */}
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <GradientCover
                      cover={o.cover}
                      className="h-11 w-11 shrink-0 rounded-xl"
                      emojiClassName="text-lg"
                      photo={ITEM_PHOTO[o.itemId ?? ""]}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">
                        {o.itemTitle}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Avatar
                          emoji={o.buyerEmoji}
                          color={o.buyerColor}
                          size="sm"
                        />
                        <span
                          dir="ltr"
                          className="text-[11px] text-white/70"
                        >
                          {o.buyerName}
                        </span>
                        {o.buyerVip && (
                          <span className="rounded-full bg-amber-300/15 px-1.5 py-px text-[9px] font-black text-amber-300">
                            VIP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* قیمت‌ها */}
                  <p className="mt-2 text-[11px] leading-5 text-white/60">
                    ✓ پرداخت‌شده — {toman(o.itemPrice)} + ارسال{" "}
                    {toman(o.shippingPrice)} · {methodLabel(o.shippingMethod)}
                  </p>

                  {/* تکمیل‌شده: ستارهٔ رضایت خریدار */}
                  {o.status === "completed" && o.reviewLabel && (
                    <p className="mt-1.5 text-[11px] font-bold text-ls-green">
                      ★ {o.reviewLabel}
                    </p>
                  )}

                  {/* ارسال‌شده: کد رهگیری + تکمیل */}
                  {o.status === "shipped" && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <span
                        dir="ltr"
                        className="inline-flex rounded-lg bg-ls-card-2 px-2 py-1 font-mono text-[11px] text-white/70"
                      >
                        {o.trackingCode ?? "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          completeOrder(o.id);
                          toast.success(`سفارش ${toFa(o.id)} تکمیل شد ✅`);
                        }}
                        className="ms-auto rounded-lg border border-ls-green/50 px-2.5 py-1.5 text-[11px] font-extrabold text-ls-green transition-colors hover:bg-ls-green/10"
                        aria-label={`تکمیل سفارش ${toFa(o.id)}`}
                      >
                        تکمیل سفارش
                      </button>
                    </div>
                  )}

                  {/* اختلاف: متن پرونده + پاسخ */}
                  {o.status === "issue" && (
                    <div className="mt-2.5 space-y-2">
                      <p className="text-xs leading-5 text-white/75">
                        {o.issueText}
                      </p>
                      {o.issueResolved ? (
                        <p className="text-[11px] font-bold text-ls-green">
                          ✓ پاسخ داده شد — در انتظار داوری
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIssueOrder(o)}
                          className="rounded-lg border border-ls-pink/50 bg-ls-pink/10 px-2.5 py-1.5 text-[11px] font-extrabold text-ls-pink transition-colors hover:bg-ls-pink/20"
                          aria-label={`پاسخ به اختلاف سفارش ${toFa(o.id)}`}
                        >
                          پاسخ به اختلاف
                        </button>
                      )}
                    </div>
                  )}

                  {/* اکشن‌های سفارش در انتظار اسکن */}
                  {o.status === "to_scan" && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLabelOrder(o)}
                        className="rounded-xl bg-ls-purple py-2 text-xs font-extrabold text-white transition-transform active:scale-[.98]"
                        aria-label={`چاپ لیبل مرسوله برای سفارش ${toFa(o.id)}`}
                      >
                        چاپ لیبل مرسوله
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrackOrder(o)}
                        className="rounded-xl border border-white/15 py-2 text-xs font-extrabold text-white/80 transition-colors hover:bg-white/5"
                        aria-label={`ثبت کد رهگیری برای سفارش ${toFa(o.id)}`}
                      >
                        ثبت کد رهگیری
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── دیالوگ‌ها (با key برای ریست state بین باز شدن‌ها) ── */}
      {labelOrder && (
        <PrintLabelDialog
          key={labelOrder.id}
          order={labelOrder}
          onClose={() => setLabelOrder(null)}
        />
      )}
      {trackOrder && (
        <TrackDialog
          key={trackOrder.id}
          order={trackOrder}
          onClose={() => setTrackOrder(null)}
        />
      )}
      {issueOrder && (
        <IssueReplyDialog
          key={issueOrder.id}
          order={issueOrder}
          onClose={() => setIssueOrder(null)}
        />
      )}
    </div>
  );
}
