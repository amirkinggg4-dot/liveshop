"use client";

/* ─────────────────────────────────────────────────────────────
   v1.6.1 — شیت پیش‌نمایش شو به‌زودی (خانه)
   لمس کارت «به‌زودی» این شیت را باز می‌کند:
   کاور + فروشنده + فهرست کالاهای برنامه‌ریزی‌شده با قیمت + دکمهٔ یادآوری
   ───────────────────────────────────────────────────────────── */

import Image from "next/image";
import { Bell, BellRing, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toman } from "@/lib/format";
import type { Show } from "@/lib/data/types";
import { getSeller } from "@/lib/data/shows";
import { SHOW_PHOTO } from "@/lib/data/media";
import { SellerAvatar, RatingStars } from "@/components/liveshop/shared";
import {
  getPlannedItems,
  upcomingStartsAt,
  relativeStartFa,
} from "./upcoming";

export default function UpcomingPreviewSheet({
  show,
  open,
  onOpenChange,
  reminderOn,
  onToggleReminder,
}: {
  show: Show | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminderOn: boolean;
  onToggleReminder: (show: Show) => void;
}) {
  const seller = show ? getSeller(show.sellerId) : null;
  const photo = show ? SHOW_PHOTO[show.id] : undefined;
  const items = show ? getPlannedItems(show.id) : [];
  const startLabel = show ? relativeStartFa(upcomingStartsAt(show.id)) : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[86dvh] overflow-y-auto rounded-t-3xl border-white/10 bg-ls-bg px-0 pb-[max(env(safe-area-inset-bottom),12px)] pt-2"
        aria-describedby={undefined}
      >
        {/* دستگیرهٔ شیت */}
        <span
          className="mx-auto mb-1 block h-1 w-10 rounded-full bg-white/20"
          aria-hidden
        />
        {show && seller && (
          <>
            <SheetHeader className="px-4 text-right">
              <SheetTitle asChild>
                <p className="text-base font-extrabold leading-6 text-white">
                  {show.title}
                </p>
              </SheetTitle>
              <SheetDescription className="sr-only">
                پیش‌نمایش شو به‌زودی و کالاهای برنامه‌ریزی‌شده
              </SheetDescription>
            </SheetHeader>

            {/* کاور + برچسب شروع نسبی */}
            <div className="mx-4 mt-2 overflow-hidden rounded-2xl border border-white/10">
              <div className="relative h-36 w-full">
                {photo ? (
                  <Image
                    src={photo}
                    alt={`کاور شو ${show.title}`}
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                ) : (
                  <span
                    className="flex h-full w-full items-center justify-center text-5xl"
                    style={{
                      background: `linear-gradient(135deg, ${show.cover.from}, ${show.cover.to})`,
                    }}
                    aria-hidden
                  >
                    {show.cover.emoji}
                  </span>
                )}
                <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white/90 backdrop-blur-sm border border-white/15">
                  <Clock className="h-3 w-3 text-ls-pink" aria-hidden />
                  شروع: {startLabel}
                </span>
              </div>
            </div>

            {/* فروشنده */}
            <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-2xl bg-ls-card border border-white/5 p-3">
              <SellerAvatar sellerId={seller.id} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-sm font-bold text-white">
                  <span className="truncate">{seller.name}</span>
                  {seller.verified && (
                    <span
                      className="text-ls-purple-soft"
                      title="فروشندهٔ تأییدشده"
                    >
                      ✓
                    </span>
                  )}
                </p>
                <RatingStars rating={seller.rating} count={seller.ratingsCount} />
              </div>
            </div>

            {/* کالاهای برنامه‌ریزی‌شده با قیمت */}
            <div className="mx-4 mt-3">
              <p className="mb-2 text-sm font-extrabold text-white/90">
                کالاهای برنامه‌ریزی‌شده
              </p>
              {items.length > 0 ? (
                <ul className="max-h-56 space-y-1.5 overflow-y-auto rounded-2xl bg-ls-card border border-white/5 p-2 scrollbar-thin">
                  {items.map((it) => (
                    <li
                      key={it.title}
                      className="flex items-center gap-2 rounded-xl bg-ls-card-2 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-white/90">
                          {it.title}
                        </p>
                        <p className="text-[10px] text-white/45">{it.brand}</p>
                      </div>
                      <span className="shrink-0 text-[11px] font-black tabular-nums text-ls-green">
                        {toman(it.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl bg-ls-card border border-white/5 px-3 py-4 text-center text-xs text-white/50">
                  فهرست کالاها به‌زودی اعلام می‌شود
                </p>
              )}
            </div>

            {/* دکمهٔ یادآوری */}
            <div className="mx-4 mt-4">
              <button
                onClick={() => onToggleReminder(show)}
                aria-pressed={reminderOn}
                aria-label={`${reminderOn ? "حذف یادآوری" : "فعال‌سازی یادآوری"} برای شو ${show.title}`}
                className={cn(
                  "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors",
                  reminderOn
                    ? "bg-ls-green text-[#04281e]"
                    : "border border-ls-pink/50 text-ls-pink hover:bg-ls-pink/10"
                )}
              >
                {reminderOn ? (
                  <BellRing className="h-4 w-4" aria-hidden />
                ) : (
                  <Bell className="h-4 w-4" aria-hidden />
                )}
                {reminderOn ? "یادآوری فعال شد" : "یادآوری شو"}
              </button>
              <p className="mt-2 text-center text-[11px] leading-5 text-white/45">
                ۳۰ دقیقه قبل از شروع شو خبر می‌دهیم
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
