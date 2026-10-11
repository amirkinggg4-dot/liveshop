"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toFa, toman, compactFa, faClock } from "@/lib/format";
import type { Cover, ItemStatus, Show } from "@/lib/data/types";
import { getSeller } from "@/lib/data/shows";
import { getAuctionItem, getShowItems, getPinnedItem, stockLabelFa } from "@/lib/data/items";
import { CATEGORY_PHOTO, SHOW_PHOTO, SELLER_PHOTO } from "@/lib/data/media";
import {
  BookOpen,
  ChevronRight,
  Clock,
  Flame,
  Footprints,
  Gem,
  Headphones,
  Home as HomeIcon,
  LayoutGrid,
  Layers,
  Palette,
  Puzzle,
  Shirt,
  Sprout,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AUCTION_ENABLED } from "@/lib/config";

/* ─────────────────────────── ابزارهای مشترک LiveShop ─────────────────────────── */

export function GradientCover({
  cover,
  className,
  emojiClassName,
  children,
  photo,
  sizes = "300px",
}: {
  cover: Cover;
  className?: string;
  emojiClassName?: string;
  children?: React.ReactNode;
  /** v1.3.2 — عکس واقعی به‌جای ایموجی (fallback = گرادیان + ایموجی) */
  photo?: string;
  sizes?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden flex items-center justify-center",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${cover.from} 0%, ${cover.to} 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 25% 20%, rgba(255,255,255,.35) 0%, transparent 45%), radial-gradient(circle at 80% 85%, rgba(0,0,0,.35) 0%, transparent 50%)",
        }}
      />
      {photo ? (
        <SmartImg
          src={photo}
          alt=""
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <span
          className={cn("relative select-none drop-shadow-lg", emojiClassName)}
          aria-hidden
        >
          {cover.emoji}
        </span>
      )}
      {children}
    </div>
  );
}

/* ── v1.3.2 — عکس با اسکلت: تا بارگذاری، اسکلت پالس‌دار نشان داده می‌شود ──
   (والد باید relative باشد چون Image با fill کار می‌کند) */
export function SmartImg({
  src,
  alt,
  sizes,
  className,
  priority,
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && (
        <span
          className="absolute inset-0 animate-pulse bg-white/10"
          aria-hidden
        />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </>
  );
}

/* ── v1.3.2 — آواتار عکس‌دار فروشنده با fallback ایموجی ── */
export function SellerAvatar({
  sellerId,
  className,
}: {
  sellerId: string;
  className?: string;
}) {
  const seller = getSeller(sellerId);
  const photo = SELLER_PHOTO[sellerId];
  if (photo) {
    return (
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full ring-2 ring-white/10",
          className ?? "h-9 w-9"
        )}
        aria-hidden
      >
        <SmartImg
          src={photo}
          alt=""
          sizes="48px"
          className="object-cover"
        />
      </span>
    );
  }
  return <Avatar emoji={seller.emoji} color={seller.color} className={className} />;
}

export function Avatar({
  emoji,
  color,
  size = "md",
  className,
}: {
  emoji: string;
  color: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "w-7 h-7 text-sm",
    md: "w-9 h-9 text-base",
    lg: "w-12 h-12 text-xl",
    xl: "w-16 h-16 text-3xl",
  } as const;
  return (
    <span
      className={cn(
        "shrink-0 rounded-full flex items-center justify-center ring-2 ring-white/10",
        sizes[size],
        className
      )}
      style={{ backgroundColor: `${color}33`, boxShadow: `inset 0 0 0 1.5px ${color}66` }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}

export function LiveBadge({
  viewers,
  className,
}: {
  viewers: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-ls-pink/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm",
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ls-pulse" aria-hidden />
      <span aria-label={`${toFa(viewers)} بینندهٔ زنده`}>{toFa(viewers)}</span>
      <span className="opacity-90">زنده</span>
    </span>
  );
}

export function SoonBadge({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white/90 backdrop-blur-sm border border-white/15">
      {/* v1.6.2 — ایموجی ساعت → آیکون lucide (مشترک خانه/کاوش) */}
      <Clock className="h-3 w-3 shrink-0" aria-hidden />
      {label ?? "به‌زودی"}
    </span>
  );
}

export function RatingStars({
  rating,
  count,
  className,
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-amber-300", className)}>
      <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" aria-hidden />
      <span className="font-bold">{toFa(rating)}</span>
      {count != null && <span className="text-white/50">({toFa(count)})</span>}
    </span>
  );
}

const STATUS_MAP: Record<
  ItemStatus,
  { label: string; className: string }
> = {
  auction: {
    label: "در مزایده",
    className: "bg-ls-purple text-white shadow-[0_0_14px_rgba(108,92,255,.45)]",
  },
  up_next: {
    /* v1.4 — در حالت قیمت ثابت «در صف شو» */
    label: AUCTION_ENABLED ? "آیتم بعدی" : "در صف شو",
    className: "bg-transparent text-ls-pink border border-ls-pink/50",
  },
  buy_now: {
    label: AUCTION_ENABLED ? "خرید فوری" : "قیمت ثابت",
    className: "bg-ls-green text-[#04281e] font-extrabold",
  },
  sold: {
    label: "فروخته شد",
    className: "bg-white/10 text-white/55",
  },
};

export function StatusChip({
  status,
  className,
}: {
  status: ItemStatus;
  className?: string;
}) {
  const s = STATUS_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap",
        s.className,
        className
      )}
    >
      {s.label}
    </span>
  );
}

export function Chip({
  children,
  className,
  onClick,
  active,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-ls-purple text-white"
          : "bg-ls-card-2 text-white/70 hover:text-white hover:bg-ls-line",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </Comp>
  );
}

export function SectionTitle({
  title,
  icon,
  lucide: Lucide,
  action,
  className,
}: {
  title: string;
  /** ایموجی (راه قدیمی — برای سازگاری نماهای دیگر حفظ شده) */
  icon?: string;
  /** v1.6.1 — آیکون lucide یکدست (اولویت دارد؛ جایگزین ایموجی) */
  lucide?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      <h2 className="text-base font-extrabold flex items-center gap-2">
        {Lucide ? (
          <Lucide className="h-[18px] w-[18px] text-ls-pink" aria-hidden />
        ) : (
          icon && <span aria-hidden>{icon}</span>
        )}
        {title}
      </h2>
      {action}
    </div>
  );
}

export function Price({
  amount,
  className,
  withUnit = true,
}: {
  amount: number;
  className?: string;
  withUnit?: boolean;
}) {
  return (
    <span className={cn("font-extrabold tabular-nums", className)}>
      {toman(amount, withUnit)}
    </span>
  );
}

export function PageHeader({
  title,
  onBack,
  trailing,
  subtitle,
}: {
  title: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-ls-bg/85 backdrop-blur-md border-b border-white/5">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="بازگشت"
          className="w-9 h-9 shrink-0 rounded-full bg-ls-card-2 flex items-center justify-center text-white/80 hover:bg-ls-line transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-extrabold truncate">{title}</h1>
        {subtitle && <p className="text-xs text-white/60 truncate">{subtitle}</p>}
      </div>
      {trailing}
    </header>
  );
}

export function EmptyState({
  emoji,
  lucide: Lucide,
  title,
  desc,
  action,
}: {
  /** ایموجی (راه قدیمی — برای سازگاری نماهای دیگر حفظ شده) */
  emoji?: string;
  /** v1.6.1 — آیکون lucide یکدست (اولویت دارد؛ جایگزین ایموجی) */
  lucide?: LucideIcon;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 gap-2">
      {Lucide ? (
        <span
          className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-ls-card-2 ring-1 ring-white/10 animate-ls-float"
          aria-hidden
        >
          <Lucide className="h-8 w-8 text-ls-purple-soft" />
        </span>
      ) : (
        <span className="text-5xl mb-2 animate-ls-float" aria-hidden>
          {emoji}
        </span>
      )}
      <p className="font-bold text-white/90">{title}</p>
      {desc && <p className="text-sm text-white/60 leading-6">{desc}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ── کارت شو — در فید، کاوش و پروفایل استفاده می‌شود ── */
export function ShowCard({
  show,
  onClick,
  footer,
  compact = false,
  photo,
}: {
  show: Show;
  onClick?: () => void;
  /** محتوای اضافه پایین کارت (مثل نوار «بید فعلی + تایمر» در فاز ۱) */
  footer?: React.ReactNode;
  compact?: boolean;
  /** v1.3.2 — عکس واقعی کاور (fallback = گرادیان + ایموجی) */
  photo?: string;
}) {
  const seller = getSeller(show.sellerId);
  return (
    <button
      onClick={onClick}
      className={cn(
        "group text-right rounded-2xl bg-ls-card border border-white/5 overflow-hidden transition-transform active:scale-[.98] hover:border-ls-purple/40 w-full",
        compact && "min-w-[170px]"
      )}
      aria-label={`ورود به شو: ${show.title}`}
    >
      <GradientCover
        cover={show.cover}
        photo={photo}
        sizes="220px"
        className={cn("w-full", compact ? "h-28" : "h-40")}
        emojiClassName={cn(compact ? "text-4xl" : "text-6xl", "group-hover:scale-110 transition-transform duration-300")}
      >
        <div className="absolute top-2.5 right-2.5">
          {show.status === "live" ? (
            <LiveBadge viewers={show.viewers} />
          ) : (
            <SoonBadge label={show.startsAtLabel} />
          )}
        </div>
        <div className="absolute bottom-2 left-2.5 flex gap-1.5">
          {show.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white/85 backdrop-blur-sm"
            >
              {t}
            </span>
          ))}
        </div>
      </GradientCover>
      <div className="p-3 space-y-1.5">
        <p className="font-bold text-sm leading-5 line-clamp-1">{show.title}</p>
        <div className="flex items-center gap-1.5 text-xs text-white/70">
          <SellerAvatar sellerId={seller.id} className="h-7 w-7" />
          {/* v1.6.2 — اسم فروشنده بریده نمی‌شود (می‌شکند، فونت کوچک‌تر) */}
          <span className="min-w-0 break-words text-[11px] font-bold leading-4">
            {seller.name}
          </span>
          {seller.verified && <span className="text-ls-purple-soft" title="فروشندهٔ تأییدشده">✓</span>}
          <RatingStars rating={seller.rating} className="mr-auto" />
        </div>
        {footer}
      </div>
    </button>
  );
}

/* ── v1.3.2 — کارت عمودی لایو برای فید دوسطحی خانه (نسبت ۴:۵، عکس تمام‌کارت) ──
   v1.4 — به‌جای «بید فعلی + تایمر»: قیمت ثابت کالای در حال نمایش (پین‌شده) +
   برچسب «۳ عدد مانده» (زیر ۳ عدد رنگ هشدار). در حالت مزایده همان نمایش قبلی.
   v1.6.1 — چیدمان متن کارت:
   ─ عنوان حداکثر ۲ خط (line-clamp) — تنها متن مجاز به «…»
   ─ قیمت در ردیف جدا و همیشه کامل (بدون truncate؛ «تومان» کامل، ارقام فارسی)
   ─ نشان موجودی در ردیف جدا زیر قیمت
   ─ هیچ متن دیگری با «…» بریده نمی‌شود (اسم فروشنده می‌شکند، نه بریده)
   ─ اگر Show فیلدهای API (sellerName/pinnedPrice/pinnedStock/photoUrl) داشته
     باشد اولویت دارند؛ وگرنه همان مسیر mock (getSeller/SHOW_PHOTO/getPinnedItem) */
export function LiveGridCard({
  show,
  onClick,
}: {
  show: Show;
  onClick?: () => void;
}) {
  const mockSeller = getSeller(show.sellerId);
  const sellerName = show.sellerName ?? mockSeller.name;
  const sellerVerified = show.sellerVerified ?? mockSeller.verified;
  const photo = show.photoUrl ?? SHOW_PHOTO[show.id];

  /* v1.4 — کالای در حال نمایش (پین‌شده) شو — اولویت با مقادیر API */
  const mockPinned = getPinnedItem(show.id);
  const mockStock = mockPinned
    ? mockPinned.variants?.length
      ? mockPinned.variants.reduce((s, v) => s + v.stock, 0)
      : mockPinned.stock
    : 0;
  const pinnedPrice =
    show.pinnedPrice !== undefined ? show.pinnedPrice : mockPinned ? mockPinned.price : null;
  const pinnedStock =
    show.pinnedStock !== undefined ? show.pinnedStock : mockStock;
  const hasPinned = pinnedPrice != null;
  const lowStock = (pinnedStock ?? 0) > 0 && (pinnedStock ?? 0) < 3;

  /* حالت مزایده (کد حفظ‌شده) */
  const auction = getAuctionItem(show.id);
  const timer = auction?.timerSec ?? 0;
  const urgent = timer <= 30;
  const buyNowMin = (() => {
    const prices = getShowItems(show.id)
      .map((i) => i.buyNowPrice)
      .filter((p): p is number => typeof p === "number");
    return prices.length > 0 ? Math.min(...prices) : null;
  })();

  return (
    <button
      onClick={onClick}
      aria-label={`ورود به شو: ${show.title}`}
      className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10 bg-ls-card text-right shadow-lg transition-transform active:scale-[.98] hover:border-ls-purple/40"
    >
      {photo ? (
        show.photoUrl ? (
          <img
            src={photo}
            alt={`تصویر شو ${show.title}`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <SmartImg
            src={photo}
            alt={`تصویر شو ${show.title}`}
            sizes="(max-width: 640px) 45vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )
      ) : (
        <GradientCover
          cover={show.cover}
          className="absolute inset-0"
          emojiClassName="text-4xl"
        />
      )}

      {/* نشان زنده + تعداد بیننده — بالا */}
      <div className="absolute inset-x-2 top-2 z-10 flex items-start">
        <LiveBadge viewers={show.viewers} className="px-2 py-0.5 text-[10px]" />
        {/* v1.6.3 — شو «داغ»: نشان lucide Flame (جایگزین ایموجی 🔥 داخل عنوان) */}
        {show.hot && (
          <span
            className="ms-auto inline-flex items-center gap-0.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[10px] font-bold text-orange-400 backdrop-blur-sm"
            aria-label="شوی داغ"
          >
            <Flame className="h-3 w-3" aria-hidden />
            داغ
          </span>
        )}
      </div>

      {/* گرادیان تیرهٔ پایین + اسم شو (≤۲ خط) + فروشنده + ردیف قیمت + ردیف موجودی */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2.5 pt-10">
        {/* v1.6.1 — عنوان: حداکثر ۲ خط — تنها «…» مجاز در کل کارت */}
        <p className="line-clamp-2 text-[12px] font-extrabold leading-5 text-white">
          {show.title}
        </p>
        <div className="mt-1 flex min-w-0 items-start gap-1.5">
          {show.sellerAvatar ? (
            <span
              className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-white/25"
              aria-hidden
            >
              <img
                src={show.sellerAvatar}
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
          ) : (
            <SellerAvatar sellerId={mockSeller.id} className="h-5 w-5 ring-1 ring-white/25" />
          )}
          {/* بدون truncate — اسم بلید می‌شکند ولی با «…» بریده نمی‌شود */}
          <span className="min-w-0 flex-1 break-words text-[10px] font-bold leading-4 text-white/80">
            {sellerName}
          </span>
          {sellerVerified && (
            <span className="shrink-0 text-[10px] text-ls-purple-soft" title="فروشندهٔ تأییدشده">✓</span>
          )}
        </div>
        {/* v1.6.1 — ردیف قیمت: همیشه کامل (بدون truncate) — «تومان» کامل، ارقام فارسی */}
        <div className="mt-1.5">
          {AUCTION_ENABLED ? (
            /* حالت مزایده — نمایش قبلی (کد حفظ‌شده)، بدون truncate */
            <div className="flex items-center justify-between gap-1">
              {auction ? (
                <>
                  <span className="text-[11px] font-black tabular-nums text-ls-purple-soft">
                    بید فعلی {toman(auction.currentBid ?? auction.startPrice)}
                  </span>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-0.5 text-[10px] font-bold tabular-nums",
                      urgent ? "text-[#FF3B5C]" : "text-white/75"
                    )}
                  >
                    <Clock className="h-3 w-3" aria-hidden />
                    {faClock(timer)}
                  </span>
                </>
              ) : buyNowMin != null ? (
                <span className="text-[11px] font-black tabular-nums text-ls-green">
                  خرید فوری از {toman(buyNowMin)}
                </span>
              ) : null}
            </div>
          ) : (
            <span
              className="block whitespace-nowrap text-[11px] font-black tabular-nums text-ls-green"
              aria-label={`قیمت ثابت کالای در حال نمایش: ${hasPinned ? toman(pinnedPrice) : "—"}`}
            >
              {hasPinned ? toman(pinnedPrice) : "—"}
            </span>
          )}
        </div>
        {/* v1.6.1 — نشان موجودی: ردیف جدا زیر قیمت */}
        {!AUCTION_ENABLED && hasPinned && pinnedStock != null && (
          <div className="mt-1 flex">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap",
                pinnedStock <= 0
                  ? "border-white/15 bg-white/10 text-white/60"
                  : lowStock
                    ? "border-amber-300/40 bg-amber-300/10 text-amber-300"
                    : "border-ls-green/40 bg-ls-green/10 text-ls-green"
              )}
              aria-live="polite"
            >
              {stockLabelFa(pinnedStock)}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

export function ViewerCount({ n }: { n: number }) {
  return <span>{compactFa(n)} بیننده</span>;
}

/* ── v1.4.1 — دسته‌بندی‌ها یکدست: ایموجی حذف، آیکون خطی lucide + عکس واقعی ──
   CategoryIcon → آیکون خطی یکدست هر دسته (fallback همه‌جا)
   CategoryTile → کارت کوچک عکس‌دار برای ردیف افقی اسکرولی (خانه و کاوش) */

const CATEGORY_ICON: Record<string, LucideIcon> = {
  sneakers: Footprints,
  plants: Sprout,
  cards: Layers,
  tech: Headphones,
  fashion: Shirt,
  beauty: Gem,
  home: HomeIcon,
  toys: Puzzle,
  books: BookOpen,
  art: Palette,
};

export function CategoryIcon({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const Icon = CATEGORY_ICON[id];
  if (!Icon) return null;
  return <Icon className={cn("h-4 w-4", className)} aria-hidden />;
}

export function CategoryTile({
  id,
  label,
  onClick,
  active,
  subtitle,
  icon: IconProp,
}: {
  id: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
  /** مثلا «۱۲۸ شو زنده» — در خانه مخفی تا کارت کوچک‌تر بماند */
  subtitle?: string;
  /** v1.6.1 — آیکون دستی (مثل کاشی «همه») — اگر عکس نبود اولویت دارد */
  icon?: LucideIcon;
}) {
  const photo = CATEGORY_PHOTO[id];
  const FallbackIcon = IconProp ?? CATEGORY_ICON[id] ?? LayoutGrid;
  return (
    <button
      onClick={onClick}
      aria-label={`دستهٔ ${label}${subtitle ? ` — ${subtitle}` : ""}`}
      aria-pressed={active}
      className={cn(
        "flex w-[76px] shrink-0 snap-start flex-col items-center gap-1 rounded-2xl border p-1.5 pb-2 text-center transition-all active:scale-[.97]",
        active
          ? "border-ls-purple bg-ls-purple/15"
          : "border-transparent hover:bg-white/5"
      )}
    >
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10">
        {photo ? (
          <SmartImg
            src={photo}
            alt=""
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-ls-card-2">
            <FallbackIcon className="h-6 w-6 text-ls-purple-soft" aria-hidden />
          </span>
        )}
      </span>
      {/* v1.6.2 — عنوان تا ۲ خط بدون «…» (می‌شکند، اضافه بدون نقطه‌چین clip می‌شود) */}
      <span className="max-h-8 w-full overflow-hidden break-words text-[10px] font-bold leading-4 text-white/85">
        {label}
      </span>
      {subtitle && (
        <span className="text-[9px] font-bold leading-3 text-ls-pink tabular-nums">
          {subtitle}
        </span>
      )}
    </button>
  );
}
