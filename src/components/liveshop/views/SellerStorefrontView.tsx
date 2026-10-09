"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Clock, Share2 } from "lucide-react";
import { compactFa, faNum, toFa, toman } from "@/lib/format";
import { STOREFRONT } from "@/lib/data/seller-marketing";
import { SELLER_SCHEDULED_SHOWS } from "@/lib/data/seller";
import { getSeller } from "@/lib/data/shows";
import { useAppStore } from "@/store/app-store";
import {
  Avatar,
  GradientCover,
  PageHeader,
  RatingStars,
  SectionTitle,
} from "@/components/liveshop/shared";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   صفحهٔ فروشنده / لندینگ فروشنده — فاز ۳ (Atlas تصویر ۰۷)
   هیرو با کاور گرادیانی و آواتار، آمار، داستان فروشنده،
   سیاست‌های فروش، شوهای آینده، نظرات خریداران و دکمهٔ فالو.
   ───────────────────────────────────────────────────────────── */

export default function SellerStorefrontView() {
  const back = useAppStore((s) => s.back);
  const seller = getSeller(STOREFRONT.sellerId);
  const [following, setFollowing] = useState(false);

  const sellerCover = {
    from: seller.color,
    to: "#6C5CFF",
    emoji: seller.emoji,
  };

  const stats = [
    { label: "فروش‌ها", value: STOREFRONT.totalSalesLabel },
    { label: "فالوور", value: compactFa(seller.followers) },
    { label: "امتیاز", value: toFa(seller.rating) },
  ];

  const share = () => toast("لینک فروشنده کپی شد (دمو)");

  return (
    <div className="flex-1 flex flex-col" aria-label="صفحهٔ فروشنده">
      <PageHeader
        title="صفحهٔ فروشنده"
        onBack={back}
        trailing={
          <button
            type="button"
            onClick={share}
            aria-label="کپی لینک فروشنده"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ls-card-2 text-white/80 transition-colors hover:bg-ls-line"
          >
            <Share2 className="h-4 w-4" aria-hidden />
          </button>
        }
      />

      <div className="space-y-4 px-4 pb-4 pt-4">
        {/* ── هیرو ── */}
        <div>
          <GradientCover
            cover={sellerCover}
            className="h-32 w-full rounded-2xl"
            emojiClassName="text-6xl"
          >
            <span className="absolute bottom-2.5 right-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur-sm">
              {STOREFRONT.sinceLabel} · {seller.scheduleLabel}
            </span>
          </GradientCover>
          <div className="mx-4 -mt-9 flex items-end gap-3">
            <Avatar emoji={seller.emoji} color={seller.color} size="xl" />
            <div className="min-w-0 flex-1 pb-1">
              <p className="flex items-center gap-1.5 text-base font-black leading-6">
                <span className="truncate">{seller.name}</span>
                {seller.verified && (
                  <span className="shrink-0 text-ls-purple-soft" title="فروشندهٔ تأییدشده">
                    ✓
                  </span>
                )}
              </p>
              <p dir="ltr" className="text-right text-xs text-white/45">
                @{seller.handle}
              </p>
            </div>
            <div className="shrink-0 pb-1.5">
              <RatingStars rating={seller.rating} count={seller.ratingsCount} />
            </div>
          </div>
        </div>

        {/* ── آمار ── */}
        <div className="grid grid-cols-3 gap-2.5" aria-label="آمار فروشنده">
          {stats.map((st) => (
            <div
              key={st.label}
              className="rounded-2xl border border-white/5 bg-ls-card p-3 text-center"
            >
              <p className="text-sm font-black tabular-nums">{st.value}</p>
              <p className="mt-0.5 text-[10px] text-white/45">{st.label}</p>
            </div>
          ))}
        </div>

        {/* ── داستان فروشنده ── */}
        <div>
          <SectionTitle title="داستان فروشنده" icon="📖" />
          <div className="rounded-2xl border border-white/5 bg-ls-card p-4">
            <p className="whitespace-pre-line text-sm leading-7 text-white/75">
              {STOREFRONT.story}
            </p>
          </div>
        </div>

        {/* ── سیاست‌های فروش ── */}
        <div>
          <SectionTitle title="سیاست‌های فروش" icon="🛡️" />
          <div className="space-y-2">
            {STOREFRONT.policies.map((p) => (
              <div
                key={p.title}
                className="flex items-start gap-3 rounded-2xl border border-white/5 bg-ls-card p-3.5"
              >
                <span className="w-10 h-10 shrink-0 rounded-xl bg-ls-card-2 flex items-center justify-center text-lg" aria-hidden>
                  {p.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{p.title}</p>
                  <p className="mt-0.5 text-[11px] leading-5 text-white/50">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── شوهای آینده ── */}
        <div>
          <SectionTitle
            title="شوهای آینده"
            icon="📅"
            action={
              <span className="rounded-full bg-ls-card-2 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white/60">
                {faNum(SELLER_SCHEDULED_SHOWS.length)} شو
              </span>
            }
          />
          <div className="space-y-2">
            {SELLER_SCHEDULED_SHOWS.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-ls-card p-3"
              >
                <GradientCover
                  cover={s.cover}
                  className="h-12 w-12 shrink-0 rounded-xl"
                  emojiClassName="text-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{s.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] tabular-nums text-white/50">
                    <Clock className="h-3 w-3" aria-hidden />
                    {s.whenLabel} · {faNum(s.itemsCount)} آیتم
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast("یادآوری فعال شد 🔔")}
                  className="shrink-0 rounded-lg border border-ls-purple/40 bg-ls-purple/15 px-2.5 py-1.5 text-[11px] font-bold text-ls-purple-soft transition-transform active:scale-[.98]"
                  aria-label={`یادآوری شو ${s.title}`}
                >
                  یادآوری
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── نظرات خریداران ── */}
        <div>
          <SectionTitle title="نظرات خریداران" icon="💬" />
          <ul
            className="max-h-96 space-y-2.5 overflow-y-auto scroll-thin pl-1"
            aria-label="فهرست نظرات خریداران"
          >
            {STOREFRONT.reviews.map((r) => (
              <li
                key={r.name}
                className="rounded-2xl border border-white/5 bg-ls-card p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar emoji={r.emoji} color={r.color} size="sm" />
                  <span dir="ltr" className="truncate text-right text-sm font-bold">
                    {r.name}
                  </span>
                  <RatingStars rating={r.rating} className="ms-auto" />
                </div>
                <p className="mt-2 text-xs leading-6 text-white/70">{r.text}</p>
                <p className="mt-1 text-[11px] text-white/40">
                  خرید: {r.itemTitle} · {r.atLabel}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* ── دکمهٔ فالو ── */}
        <button
          type="button"
          onClick={() => setFollowing((f) => !f)}
          aria-label={following ? "لغو فالو فروشنده" : "فالو فروشنده"}
          className={cn(
            "h-12 w-full rounded-2xl text-sm font-extrabold transition-all active:scale-[.98]",
            following
              ? "border border-ls-green/40 bg-ls-green/15 text-ls-green"
              : "bg-ls-purple text-white shadow-[0_0_18px_rgba(108,92,255,.4)]"
          )}
        >
          {following ? (
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4" aria-hidden />
              فالو شد
            </span>
          ) : (
            <span>+ فالو</span>
          )}
        </button>

        {/* نکتهٔ هزینهٔ ارسال برای شفافیت لندینگ */}
        <p className="text-center text-[10px] text-white/35">
          هزینهٔ ارسال هر آیتم در شو جداگانه اعلام می‌شود — معمولاً{" "}
          {toman(45_000)} با تیپاکس
        </p>
      </div>
    </div>
  );
}
