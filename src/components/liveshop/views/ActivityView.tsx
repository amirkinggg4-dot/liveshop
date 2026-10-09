"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { faClock, faNum, toman } from "@/lib/format";
import type { BidStatus, MyBidEntry, MyOfferEntry, OfferStatus } from "@/lib/data/buyer-p1";
import { useAppStore } from "@/store/app-store";
import { useActivityStore } from "@/store/activity-store";
import { Avatar, EmptyState, GradientCover, PageHeader } from "@/components/liveshop/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AUCTION_ENABLED } from "@/lib/config";

/* ─────────────────────────────────────────────────────────────
   فعالیت‌های من — فاز ۳ (Atlas تصویر ۱۹)
   بیدهای من با شمارش معکوس زنده و «+ یک پله» (اعتبارسنجی کیف پول)،
   پیشنهادهای خصوصی فروشنده با پذیرش/رد و تاریخچهٔ بردها/باخت‌ها.
   ───────────────────────────────────────────────────────────── */

type TabId = "bids" | "offers" | "history";

/* چیپ وضعیت بید — پیشتاز سبز درخشان / باخت خاکستری */
const BID_CHIP: Record<BidStatus, { label: string; cls: string }> = {
  leading: {
    label: "پیشتاز",
    cls: "bg-ls-green/15 text-ls-green border border-ls-green/40 shadow-[0_0_12px_rgba(0,200,150,.35)]",
  },
  outbid: {
    label: "بید بالاتر رفته",
    cls: "bg-ls-pink/15 text-ls-pink border border-ls-pink/40",
  },
  won: {
    label: "برنده شدی",
    cls: "bg-ls-purple text-white shadow-[0_0_12px_rgba(108,92,255,.4)]",
  },
  lost: {
    label: "باخت",
    cls: "bg-white/10 text-white/55",
  },
};

const OFFER_CHIP: Record<OfferStatus, { label: string; cls: string }> = {
  pending: {
    label: "در انتظار پاسخ",
    cls: "bg-ls-purple/15 text-ls-purple-soft border border-ls-purple/40",
  },
  accepted: {
    label: "پذیرفته شد",
    cls: "bg-ls-green/15 text-ls-green border border-ls-green/40",
  },
  declined: {
    label: "رد شد",
    cls: "bg-ls-pink/15 text-ls-pink border border-ls-pink/40",
  },
  expired: {
    label: "منقضی",
    cls: "bg-white/10 text-white/55",
  },
};

const EMPTY_STATE: Record<TabId, { emoji: string; title: string; desc: string }> = {
  bids: {
    emoji: "🔨",
    title: "بید فعالی نداری",
    desc: "از کاوش یا لایوهای زنده وارد مزایده شو تا بیدهایت اینجا دیده شوند.",
  },
  offers: {
    emoji: "🤝",
    title: "پیشنهاد بازی نیست",
    desc: "وقتی فروشنده‌ای پیشنهاد خصوصی بدهد، اینجا با مهلت پاسخ می‌بینی.",
  },
  history: {
    emoji: "🗂️",
    title: "تاریخچه خالی است",
    desc: "بردها، باخت‌ها و پیشنهادهای بسته‌شده اینجا آرشیو می‌شوند.",
  },
};

/* ── کارت بید فعال (پیشتاز / بید بالاتر رفته) ── */
function ActiveBidCard({ bid }: { bid: MyBidEntry }) {
  const bumpBid = useActivityStore((s) => s.bumpBid);
  const withdrawBid = useActivityStore((s) => s.withdrawBid);
  const chip = BID_CHIP[bid.status];

  const onBump = () => {
    const res = bumpBid(bid.id);
    if (res.ok) {
      toast.success("بید جدید ثبت شد ✅");
    } else {
      toast.error(res.error ?? "ثبت بید ممکن نشد");
    }
  };

  const onWithdraw = () => {
    withdrawBid(bid.id);
    toast("بید حذف شد");
  };

  return (
    <li
      className={cn(
        "rounded-2xl border p-4",
        bid.status === "outbid"
          ? "border-ls-pink/40 bg-ls-pink/5"
          : "border-white/5 bg-ls-card"
      )}
      aria-label={`بید ${bid.itemTitle}`}
    >
      {/* کالا + وضعیت */}
      <div className="flex items-center gap-3">
        <GradientCover
          cover={bid.cover}
          className="h-14 w-14 shrink-0 rounded-2xl"
          emojiClassName="text-2xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{bid.itemTitle}</p>
          <p className="mt-1 truncate text-[11px] text-white/50">
            {bid.showTitle} · {bid.sellerName}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black",
            chip.cls
          )}
        >
          {chip.label}
        </span>
      </div>

      {/* بید فعلی / بید من / تایمر */}
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-ls-card-2 p-2.5 text-center">
        <div>
          <p className="text-[10px] text-white/45">بید فعلی</p>
          <p className="mt-0.5 text-xs font-bold tabular-nums">
            {toman(bid.currentBid, false)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-white/45">بید من</p>
          <p className="mt-0.5 text-xs font-black tabular-nums">
            {toman(bid.myBid, false)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-white/45">پایان در</p>
          <p
            className={cn(
              "mt-0.5 text-xs font-black tabular-nums",
              bid.endsInSec <= 30 && "text-ls-pink animate-ls-timer-alert"
            )}
          >
            {faClock(bid.endsInSec)}
          </p>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-white/40">
        ارسال {toman(bid.shippingPrice)} · پلهٔ مزایده{" "}
        {toman(bid.step, false)} · ثبت {bid.placedAtLabel}
      </p>

      {/* اکشن‌ها */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onBump}
          className="rounded-xl bg-ls-purple py-2 text-xs font-extrabold text-white transition-transform active:scale-[.98]"
          aria-label={`یک پله بالا بردن بید ${bid.itemTitle}`}
        >
          + یک پله
        </button>
        <button
          type="button"
          onClick={onWithdraw}
          className="rounded-xl border border-white/15 py-2 text-xs font-extrabold text-white/70 transition-colors hover:bg-white/5"
          aria-label={`حذف بید ${bid.itemTitle}`}
        >
          حذف بید
        </button>
      </div>
    </li>
  );
}

/* ── کارت پیشنهاد فروشنده ── */
function OfferCard({ offer }: { offer: MyOfferEntry }) {
  const acceptOffer = useActivityStore((s) => s.acceptOffer);
  const declineOffer = useActivityStore((s) => s.declineOffer);

  const onAccept = () => {
    acceptOffer(offer.id);
    toast.success("پیشنهاد پذیرفته شد — فروشنده تماس می‌گیرد");
  };

  const onDecline = () => {
    declineOffer(offer.id);
    toast("پیشنهاد رد شد");
  };

  return (
    <li
      className="rounded-2xl border border-white/5 bg-ls-card p-4"
      aria-label={`پیشنهاد ${offer.sellerName} برای ${offer.itemTitle}`}
    >
      <div className="flex items-center gap-3">
        <Avatar
          emoji={offer.sellerEmoji}
          color={offer.sellerColor}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">{offer.sellerName}</p>
          <p className="mt-0.5 truncate text-[11px] text-white/50">
            {offer.itemEmoji} {offer.itemTitle}
          </p>
        </div>
        <div className="shrink-0 text-left">
          <p className="text-base font-black tabular-nums text-ls-pink">
            {toman(offer.amount)}
          </p>
          <p className="mt-0.5 text-[10px] text-white/40">
            {offer.expiresLabel}
          </p>
        </div>
      </div>

      <p className="mt-2.5 text-xs italic leading-5 text-white/60">
        «{offer.message}»
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onAccept}
          className="rounded-xl bg-ls-green py-2 text-xs font-extrabold text-[#04281e] transition-transform active:scale-[.98]"
          aria-label={`پذیرش پیشنهاد ${offer.sellerName}`}
        >
          پذیرش
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="rounded-xl border border-white/15 py-2 text-xs font-extrabold text-white/70 transition-colors hover:bg-white/5"
          aria-label={`رد پیشنهاد ${offer.sellerName}`}
        >
          رد
        </button>
      </div>
    </li>
  );
}

export default function ActivityView() {
  const back = useAppStore((s) => s.back);
  const myBids = useActivityStore((s) => s.myBids);
  const myOffers = useActivityStore((s) => s.myOffers);
  const tickCountdown = useActivityStore((s) => s.tickCountdown);

  /* v1.4 — در حالت قیمت ثابت، تب «بیدها» پشت AUCTION_ENABLED است و پیش‌فرض «پیشنهادها» */
  const [tab, setTab] = useState<TabId>(AUCTION_ENABLED ? "bids" : "offers");

  /* تیک ثانیه‌ای تایمر بیدهای فعال — با cleanup (فقط حالت مزایده) */
  useEffect(() => {
    if (!AUCTION_ENABLED) return;
    const id = setInterval(() => tickCountdown(), 1000);
    return () => clearInterval(id);
  }, [tickCountdown]);

  const activeBids = myBids.filter(
    (b) => b.status === "leading" || b.status === "outbid"
  );
  const pendingOffers = myOffers.filter((o) => o.status === "pending");
  const historyBids = myBids.filter(
    (b) => b.status === "won" || b.status === "lost"
  );
  const historyOffers = myOffers.filter(
    (o) =>
      o.status === "accepted" ||
      o.status === "declined" ||
      o.status === "expired"
  );

  return (
    <div className="flex flex-1 flex-col" aria-label="فعالیت‌های من">
      <PageHeader
        title="فعالیت‌های من"
        subtitle={AUCTION_ENABLED ? "بیدها، پیشنهادها و تاریخچه" : "پیشنهادها و تاریخچه"}
        onBack={back}
      />

      <div className="px-4 py-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
          <TabsList
            className={cn(
              "grid h-10 w-full rounded-xl bg-ls-card-2 p-1",
              AUCTION_ENABLED ? "grid-cols-3" : "grid-cols-2"
            )}
            aria-label="تب‌های فعالیت"
          >
            {AUCTION_ENABLED && (
              <TabsTrigger
                value="bids"
                className="rounded-lg text-xs font-bold text-white/60 data-[state=active]:bg-ls-purple data-[state=active]:text-white"
                aria-label={`بیدها — ${faNum(activeBids.length)} بید فعال`}
              >
                بیدها ({faNum(activeBids.length)})
              </TabsTrigger>
            )}
            <TabsTrigger
              value="offers"
              className="rounded-lg text-xs font-bold text-white/60 data-[state=active]:bg-ls-purple data-[state=active]:text-white"
              aria-label={`پیشنهادها — ${faNum(pendingOffers.length)} پیشنهاد در انتظار`}
            >
              پیشنهادها ({faNum(pendingOffers.length)})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg text-xs font-bold text-white/60 data-[state=active]:bg-ls-purple data-[state=active]:text-white"
              aria-label="تاریخچهٔ بردها و باخت‌ها"
            >
              تاریخچه
            </TabsTrigger>
          </TabsList>

          {/* ── بیدها — فقط در حالت مزایده (AUCTION_ENABLED) ── */}
          {AUCTION_ENABLED && (
          <TabsContent value="bids" className="mt-3">
            {activeBids.length === 0 ? (
              <EmptyState
                emoji={EMPTY_STATE.bids.emoji}
                title={EMPTY_STATE.bids.title}
                desc={EMPTY_STATE.bids.desc}
              />
            ) : (
              <ul
                className="max-h-96 space-y-2.5 overflow-y-auto scroll-thin pl-1"
                aria-label="فهرست بیدهای فعال"
              >
                {activeBids.map((b) => (
                  <ActiveBidCard key={b.id} bid={b} />
                ))}
              </ul>
            )}
          </TabsContent>
          )}

          {/* ── پیشنهادها ── */}
          <TabsContent value="offers" className="mt-3">
            {pendingOffers.length === 0 ? (
              <EmptyState
                emoji={EMPTY_STATE.offers.emoji}
                title={EMPTY_STATE.offers.title}
                desc={EMPTY_STATE.offers.desc}
              />
            ) : (
              <ul
                className="max-h-96 space-y-2.5 overflow-y-auto scroll-thin pl-1"
                aria-label="فهرست پیشنهادهای فروشنده"
              >
                {pendingOffers.map((o) => (
                  <OfferCard key={o.id} offer={o} />
                ))}
              </ul>
            )}
          </TabsContent>

          {/* ── تاریخچه ── */}
          <TabsContent value="history" className="mt-3">
            {historyBids.length + historyOffers.length === 0 ? (
              <EmptyState
                emoji={EMPTY_STATE.history.emoji}
                title={EMPTY_STATE.history.title}
                desc={EMPTY_STATE.history.desc}
              />
            ) : (
              <ul
                className="max-h-96 space-y-2 overflow-y-auto scroll-thin pl-1"
                aria-label="تاریخچهٔ بردها، باخت‌ها و پیشنهادهای بسته‌شده"
              >
                {historyBids.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-2.5 rounded-2xl border border-white/5 bg-ls-card p-3"
                    aria-label={`تاریخچه: ${b.itemTitle} — ${BID_CHIP[b.status].label}`}
                  >
                    <GradientCover
                      cover={b.cover}
                      className="h-9 w-9 shrink-0 rounded-lg"
                      emojiClassName="text-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">{b.itemTitle}</p>
                      <p className="mt-0.5 truncate text-[10px] text-white/40">
                        مزایده · {b.sellerName} · {toman(b.myBid, false)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black",
                        BID_CHIP[b.status].cls
                      )}
                    >
                      {BID_CHIP[b.status].label}
                    </span>
                  </li>
                ))}
                {historyOffers.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center gap-2.5 rounded-2xl border border-white/5 bg-ls-card p-3"
                    aria-label={`تاریخچه پیشنهاد: ${o.itemTitle} — ${OFFER_CHIP[o.status].label}`}
                  >
                    <GradientCover
                      cover={o.cover}
                      className="h-9 w-9 shrink-0 rounded-lg"
                      emojiClassName="text-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">{o.itemTitle}</p>
                      <p className="mt-0.5 truncate text-[10px] text-white/40">
                        پیشنهاد · {o.sellerName} · {toman(o.amount, false)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black",
                        OFFER_CHIP[o.status].cls
                      )}
                    >
                      {OFFER_CHIP[o.status].label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
