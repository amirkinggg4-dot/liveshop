"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   v1.8.0 — اجزای مشترک نمایش وضعیت سفارش (فهرست + جزئیات)
   ─ برچسب فارسی روشن هر وضعیت با آیکون lucide (بدون ایموجی)
   ─ زمان‌های شمسی از ms واقعی (با suppressHydrationWarning — seedها
     نسبت به لحظهٔ لود ماژول ساخته می‌شوند)
   ═══════════════════════════════════════════════════════════════════════════ */

import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";
import { formatJalaliDateTime, formatJalaliDate } from "@/lib/jalali";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/order-state";
import {
  CircleX,
  Clock,
  LockOpen,
  PackageCheck,
  RotateCcw,
  Scale,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ORDER_STATUS_ICON: Record<OrderStatus, LucideIcon> = {
  PAID_HELD: Clock,
  READY_TO_SHIP: Clock,
  SHIPPED: Truck,
  DELIVERED: PackageCheck,
  RELEASED: LockOpen,
  DISPUTED: Scale,
  CANCELED: CircleX,
  REFUNDED: RotateCcw,
};

/** رنگ برچسب هر وضعیت — سبز/بنفش/صورتی/خنثی هم‌خط با زبان بصری اپ */
export function orderStatusClass(status: OrderStatus): string {
  switch (status) {
    case "PAID_HELD":
    case "READY_TO_SHIP":
      return "border border-ls-pink/50 bg-ls-pink/10 text-ls-pink";
    case "SHIPPED":
      return "border border-ls-purple/50 bg-ls-purple/10 text-ls-purple-soft";
    case "DELIVERED":
      return "border border-ls-green/40 bg-ls-green/10 text-ls-green";
    case "RELEASED":
      return "bg-ls-green text-[#04281e] font-extrabold";
    case "DISPUTED":
      return "border border-amber-300/50 bg-amber-300/10 text-amber-300";
    case "CANCELED":
    case "REFUNDED":
      return "border border-white/15 bg-white/5 text-white/60";
    default:
      return "border border-white/15 bg-white/5 text-white/60";
  }
}

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const Icon = ORDER_STATUS_ICON[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap",
        orderStatusClass(status),
        className
      )}
      aria-label={`وضعیت سفارش: ${ORDER_STATUS_LABEL[status]}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

/** زمان شمسی کامل — «شنبه ۱۴ مهر · ۱۶:۳۰» */
export function StepTime({ ms, className }: { ms?: number; className?: string }) {
  if (ms == null) return null;
  return (
    <span className={cn("tabular-nums", className)} suppressHydrationWarning>
      {formatJalaliDateTime(new Date(ms))}
    </span>
  );
}

/** تاریخ شمسی کوتاه — «۱۴ مهر ۱۴۰۴» */
export function DayLabel({ ms, className }: { ms: number; className?: string }) {
  return (
    <span className={cn("tabular-nums", className)} suppressHydrationWarning>
      {formatJalaliDate(new Date(ms))}
    </span>
  );
}

/** مدت باقی‌مانده به فارسی — «۲ روز و ۵ ساعت» (برای شمارش معکوس مهلت‌ها) */
export function faDurationLeft(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(totalMin / (24 * 60));
  const hours = Math.floor((totalMin % (24 * 60)) / 60);
  const minutes = totalMin % 60;
  if (days > 0) {
    return hours > 0
      ? `${toFa(days)} روز و ${toFa(hours)} ساعت`
      : `${toFa(days)} روز`;
  }
  if (hours > 0) {
    return minutes > 0
      ? `${toFa(hours)} ساعت و ${toFa(minutes)} دقیقه`
      : `${toFa(hours)} ساعت`;
  }
  return `${toFa(minutes)} دقیقه`;
}
