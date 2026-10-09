"use client";

import { cn } from "@/lib/utils";
import { toFa, toman, compactFa } from "@/lib/format";
import type { Cover, ItemStatus, Show } from "@/lib/data/types";
import { getSeller } from "@/lib/data/shows";
import { ChevronRight, Star } from "lucide-react";

/* ─────────────────────────── ابزارهای مشترک LiveShop ─────────────────────────── */

export function GradientCover({
  cover,
  className,
  emojiClassName,
  children,
}: {
  cover: Cover;
  className?: string;
  emojiClassName?: string;
  children?: React.ReactNode;
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
      <span
        className={cn("relative select-none drop-shadow-lg", emojiClassName)}
        aria-hidden
      >
        {cover.emoji}
      </span>
      {children}
    </div>
  );
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
      🕒 {label ?? "به‌زودی"}
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
    label: "آیتم بعدی",
    className: "bg-transparent text-ls-pink border border-ls-pink/50",
  },
  buy_now: {
    label: "خرید فوری",
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
  action,
  className,
}: {
  title: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      <h2 className="text-base font-extrabold flex items-center gap-2">
        {icon && <span aria-hidden>{icon}</span>}
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
        {subtitle && <p className="text-xs text-white/50 truncate">{subtitle}</p>}
      </div>
      {trailing}
    </header>
  );
}

export function EmptyState({
  emoji,
  title,
  desc,
  action,
}: {
  emoji: string;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 gap-2">
      <span className="text-5xl mb-2 animate-ls-float" aria-hidden>
        {emoji}
      </span>
      <p className="font-bold text-white/90">{title}</p>
      {desc && <p className="text-sm text-white/50 leading-6">{desc}</p>}
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
}: {
  show: Show;
  onClick?: () => void;
  /** محتوای اضافه پایین کارت (مثل نوار «بید فعلی + تایمر» در فاز ۱) */
  footer?: React.ReactNode;
  compact?: boolean;
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
        <div className="flex items-center gap-1.5 text-xs text-white/60">
          <Avatar emoji={seller.emoji} color={seller.color} size="sm" />
          <span className="truncate">{seller.name}</span>
          {seller.verified && <span className="text-ls-purple-soft" title="فروشندهٔ تأییدشده">✓</span>}
          <RatingStars rating={seller.rating} className="mr-auto" />
        </div>
        {footer}
      </div>
    </button>
  );
}

export function ViewerCount({ n }: { n: number }) {
  return <span>{compactFa(n)} بیننده</span>;
}
