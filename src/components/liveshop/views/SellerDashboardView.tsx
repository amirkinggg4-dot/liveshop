"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Package,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { faNum, toman } from "@/lib/format";
import { getSeller, getShow } from "@/lib/data/shows";
import {
  PageHeader,
  Avatar,
  RatingStars,
  Chip,
  LiveBadge,
} from "@/components/liveshop/shared";

/* فاز ۲ — هاب فروشنده (اطلس تصویر ۲۳) */
import {
  CalendarDays,
  Megaphone,
  Settings,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useSellerStore } from "@/store/seller-store";
import { HUB_STATS, SELLER_REVENUE } from "@/lib/data/seller";
import {
  GradientCover,
  SectionTitle,
} from "@/components/liveshop/shared";

function ActionTile({
  icon: Icon,
  title,
  desc,
  onClick,
  ariaLabel,
}: {
  icon: LucideIcon;
  title: string;
  desc?: ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="bg-ls-card border border-white/5 rounded-2xl p-4 text-right hover:border-ls-purple/40 transition-all active:scale-[.98]"
    >
      <span className="w-10 h-10 rounded-xl bg-ls-purple/15 flex items-center justify-center text-ls-purple-soft">
        <Icon className="w-5 h-5" aria-hidden />
      </span>
      <p className="font-bold text-sm mt-2.5">{title}</p>
      {desc && (
        <p className="text-[11px] text-white/45 mt-0.5 leading-4">{desc}</p>
      )}
    </button>
  );
}

/* ── کاشی ماژول هاب فروشنده — فاز ۲ ── */
function HubTile({
  icon: Icon,
  tone,
  name,
  status,
  needsAction = false,
  onClick,
  ariaLabel,
}: {
  icon: LucideIcon;
  tone: "purple" | "green" | "pink" | "white";
  name: string;
  status: string;
  needsAction?: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  const toneCls = {
    purple: "bg-ls-purple/15 text-ls-purple-soft",
    green: "bg-ls-green/15 text-ls-green",
    pink: "bg-ls-pink/15 text-ls-pink",
    white: "bg-white/10 text-white/70",
  } as const;
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="relative bg-ls-card border border-white/5 rounded-2xl p-3 text-center hover:border-ls-purple/40 transition-all active:scale-[.98]"
    >
      {needsAction && (
        <span
          className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-[#FF3B5C] animate-ls-pulse"
          aria-label="نیاز به اقدام"
        />
      )}
      <span
        className={`w-9 h-9 rounded-xl mx-auto flex items-center justify-center ${toneCls[tone]}`}
      >
        <Icon className="w-5 h-5" aria-hidden />
      </span>
      <p className="text-[11px] font-bold mt-2">{name}</p>
      <p className="text-[9px] text-white/45 truncate mt-0.5">{status}</p>
    </button>
  );
}

export default function SellerDashboardView() {
  const back = useAppStore((s) => s.back);
  const push = useAppStore((s) => s.push);
  const setRoot = useAppStore((s) => s.setRoot);
  const openShow = useAppStore((s) => s.openShow);

  const scheduledShows = useSellerStore((s) => s.scheduledShows);
  const sellerOrders = useSellerStore((s) => s.orders);

  const seller = getSeller("s1");
  const liveShow = getShow("sh1");

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title="پنل فروشنده" onBack={back} />

      <div className="px-4 pt-4 pb-8 space-y-4">
        {/* کارت هویت فروشنده */}
        <section
          aria-label="مشخصات فروشنده"
          className="bg-ls-card border border-white/5 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <Avatar emoji={seller.emoji} color={seller.color} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-extrabold text-sm truncate">
                  {seller.name}
                </p>
                {seller.verified && (
                  <span
                    className="w-4 h-4 rounded-full bg-ls-purple flex items-center justify-center text-[9px] text-white shrink-0"
                    title="فروشندهٔ تأییدشده"
                    aria-label="فروشندهٔ تأییدشده"
                  >
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-white/45 mt-0.5" dir="ltr">
                @{seller.handle}
              </p>
              <RatingStars
                rating={seller.rating}
                count={seller.ratingsCount}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-3">
            <Chip>🕒 {seller.scheduleLabel}</Chip>
          </div>
        </section>

        {/* آمار هفته */}
        <section className="grid grid-cols-3 gap-3" aria-label="آمار این هفته">
          <div className="bg-ls-card border border-white/5 rounded-2xl p-3">
            <p className="text-[11px] text-white/45">فروش هفته</p>
            <p className="text-sm font-extrabold mt-1 leading-5 tabular-nums">
              {toman(4_280_000)}
            </p>
            <p className="text-[11px] font-bold text-ls-green mt-1">
              ▲ {faNum(18)}٪
            </p>
          </div>
          <div className="bg-ls-card border border-white/5 rounded-2xl p-3">
            <p className="text-[11px] text-white/45">سفارش‌ها</p>
            <p className="text-lg font-extrabold mt-1 tabular-nums">
              {faNum(96)}
            </p>
            <p className="text-[11px] font-bold text-ls-green mt-1">
              ▲ {faNum(12)}٪
            </p>
          </div>
          <div className="bg-ls-card border border-white/5 rounded-2xl p-3">
            <p className="text-[11px] text-white/45">فالوور جدید</p>
            <p className="text-lg font-extrabold mt-1 text-ls-green tabular-nums">
              +{faNum(512)}
            </p>
            <p className="text-[11px] font-bold text-ls-green mt-1">
              ▲ {faNum(22)}٪
            </p>
          </div>
        </section>

        {/* هشدار نیاز به اقدام */}
        <section
          aria-label="نیاز به اقدام"
          className="rounded-2xl border border-ls-pink/40 bg-ls-pink/10 p-4"
        >
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-xl bg-ls-pink/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-ls-pink" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-sm text-ls-pink">
                نیاز به اقدام
              </p>
              <p className="text-xs text-white/75 mt-1 leading-5">
                {faNum(2)} سفارش در انتظار چاپ برچسب ارسال
              </p>
            </div>
          </div>
          <button
            onClick={() => setRoot("orders")}
            aria-label="مشاهدهٔ سفارش‌ها"
            className="mt-3 w-full bg-ls-pink text-white rounded-xl py-2.5 text-sm font-extrabold hover:bg-ls-pink/90 transition-colors active:scale-[.99]"
          >
            مشاهدهٔ سفارش‌ها
          </button>
        </section>

        {/* اکشن‌های سریع */}
        <section className="grid grid-cols-2 gap-3" aria-label="دسترسی‌های سریع">
          <ActionTile
            icon={Package}
            title="انبار کالا"
            desc="مدیریت کالاهای شو"
            onClick={() => push("sellerInventory")}
            ariaLabel="رفتن به انبار کالا"
          />
          <ActionTile
            icon={ClipboardList}
            title="سفارش‌ها"
            desc="پرداخت و ارسال"
            onClick={() => setRoot("orders")}
            ariaLabel="رفتن به سفارش‌ها"
          />
          <ActionTile
            icon={Wallet}
            title="کیف پول"
            desc="درآمد و تسویه"
            onClick={() => push("wallet")}
            ariaLabel="رفتن به کیف پول"
          />
          <ActionTile
            icon={CalendarClock}
            title="شو بعدی"
            desc="پنج‌شنبه ۲۱:۰۰ — شب کتونی ۲"
            onClick={() =>
              toast("یادآوری فعال شد: پنج‌شنبه ۲۱:۰۰ — شب کتونی ۲ 🕒")
            }
            ariaLabel="شو بعدی، یادآوری"
          />
        </section>

        {/* کارت لایو فعال */}
        <section
          aria-label="پخش زندهٔ فعال"
          className="rounded-2xl border border-ls-pink/30 bg-gradient-to-l from-ls-pink/10 to-ls-purple/10 p-4 flex items-center gap-3"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <LiveBadge viewers={liveShow.viewers} />
            <p className="font-extrabold text-sm">
              الان زنده‌ای! {faNum(liveShow.viewers)} بیننده
            </p>
          </div>
          <button
            onClick={() => openShow("sh1")}
            aria-label="مشاهدهٔ لایو"
            className="shrink-0 bg-ls-purple text-white rounded-xl px-4 py-2.5 text-sm font-extrabold shadow-lg shadow-ls-purple/30 hover:bg-ls-purple-deep transition-colors active:scale-[.98]"
          >
            مشاهدهٔ لایو
          </button>
        </section>

        {/* هاب فروشنده — فاز ۲ (اطلس تصویر ۲۳: هشت در به یک کسب‌وکار) */}
        <section aria-label="هاب فروشنده" className="space-y-3">
          <SectionTitle
            title="هاب فروشنده — هشت در به کسب‌وکار"
            icon="🎛️"
          />

          {/* هدر هاب */}
          <div className="rounded-2xl border border-ls-purple/30 bg-gradient-to-l from-ls-purple/15 to-ls-pink/15 p-4 flex items-center gap-3">
            <GradientCover
              cover={{ from: seller.color, to: "#6C5CFF", emoji: seller.emoji }}
              className="w-12 h-12 rounded-xl shrink-0"
              emojiClassName="text-xl"
            />
            <div className="min-w-0 flex-1">
              <p className="font-black text-sm leading-5">Seller Hub</p>
              <p className="text-xs text-white/50 mt-0.5" dir="ltr">
                @{seller.handle}
              </p>
              {seller.verified && (
                <span className="inline-flex items-center gap-1 mt-1.5 rounded-full bg-ls-green/15 border border-ls-green/30 px-2 py-0.5 text-[10px] font-bold text-ls-green">
                  ✓ فروشندهٔ تأییدشده
                </span>
              )}
            </div>
            <button
              onClick={() => push("sellerReadyRoom")}
              aria-label="شروع لایو — اتاق آماده‌به‌پخش"
              className="ms-auto shrink-0 bg-ls-purple text-white rounded-xl px-4 py-2.5 text-sm font-extrabold shadow-lg shadow-ls-purple/30 hover:bg-ls-purple-deep transition-colors active:scale-[.98]"
            >
              ● شروع لایو
            </button>
          </div>

          {/* گرید هشت‌ماژوله */}
          <div className="grid grid-cols-4 gap-2">
            <HubTile
              icon={CalendarDays}
              tone="purple"
              name="شوها"
              status={`${faNum(scheduledShows.length)} زمان‌بندی‌شده · ۱ لایو`}
              needsAction
              onClick={() => push("sellerSchedule")}
              ariaLabel="مدیریت شوهای زمان‌بندی‌شده"
            />
            <HubTile
              icon={Package}
              tone="green"
              name="انبار"
              status={`${faNum(HUB_STATS.activeListings)} لیستینگ فعال`}
              onClick={() => push("sellerInventory")}
              ariaLabel="مدیریت انبار کالا"
            />
            <HubTile
              icon={ClipboardList}
              tone="pink"
              name="سفارش‌ها"
              status={`${faNum(sellerOrders.filter((o) => o.status === "to_scan").length)} در انتظار اسکن`}
              needsAction
              onClick={() => push("sellerOrders")}
              ariaLabel="مدیریت سفارش‌های فروشنده"
            />
            <HubTile
              icon={Wallet}
              tone="green"
              name="درآمد"
              status={`${toman(SELLER_REVENUE.available, false)} موجودی`}
              onClick={() => push("sellerRevenue")}
              ariaLabel="مشاهدهٔ درآمد و تسویه"
            />
            <HubTile
              icon={Megaphone}
              tone="purple"
              name="بازاریابی"
              status={HUB_STATS.marketingLabel}
              onClick={() => push("sellerMarketing")}
              ariaLabel="بازاریابی و کدهای تخفیف"
            />
            <HubTile
              icon={TrendingUp}
              tone="pink"
              name="آنالیتیکس"
              status={HUB_STATS.analyticsLabel}
              onClick={() => push("sellerAnalytics")}
              ariaLabel="آنالیتیکس فروش"
            />
            <HubTile
              icon={ShieldCheck}
              tone="green"
              name="سلامت اکانت"
              status={HUB_STATS.healthLabel}
              onClick={() => push("sellerHealth")}
              ariaLabel="سلامت اکانت فروشنده"
            />
            <HubTile
              icon={Settings}
              tone="white"
              name="تنظیمات"
              status="پروفایل و ترجیحات"
              onClick={() => push("sellerSettings")}
              ariaLabel="تنظیمات فروشنده"
            />
          </div>

          {/* فاز ۳ (P1) — میان‌بر صفحهٔ فروشنده (تصویر ۰۷) — فقط اضافه‌شده */}
          <button
            onClick={() => push("sellerStorefront")}
            aria-label="مشاهدهٔ صفحهٔ عمومی فروشنده"
            className="flex w-full items-center gap-2.5 rounded-2xl border border-white/10 bg-ls-card p-3.5 text-right transition-colors hover:border-ls-purple/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ls-pink/15 text-ls-pink" aria-hidden>
              🏪
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">صفحهٔ فروشنده</span>
              <span className="block text-[11px] text-white/45 mt-0.5">
                نمای عمومی مشتریان — داستان، سیاست‌ها و نظرات
              </span>
            </span>
            <span className="shrink-0 text-xs font-bold text-ls-purple-soft" aria-hidden>
              مشاهده ←
            </span>
          </button>
        </section>
      </div>
    </div>
  );
}
