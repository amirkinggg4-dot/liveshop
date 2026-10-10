"use client";

/* ─────────────────────────────────────────────────────────────
   v1.6.2 — شیت مرتب‌سازی کاوش: محبوب‌ترین، تازه‌ترین،
   ارزان‌ترین، گران‌ترین — گزینهٔ فعال با تیک
   ───────────────────────────────────────────────────────────── */

import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS, type SortId } from "./filters";

export default function SortSheet({
  open,
  onOpenChange,
  sort,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sort: SortId;
  onPick: (s: SortId) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-white/10 bg-ls-bg px-0 pb-[max(env(safe-area-inset-bottom),12px)] pt-2"
        aria-describedby={undefined}
      >
        <span
          className="mx-auto mb-1 block h-1 w-10 rounded-full bg-white/20"
          aria-hidden
        />
        <SheetHeader className="px-4 text-right">
          <SheetTitle className="text-base font-extrabold text-white">
            مرتب‌سازی
          </SheetTitle>
          <SheetDescription className="sr-only">
            انتخاب ترتیب نمایش نتایج
          </SheetDescription>
        </SheetHeader>
        <ul className="px-4 pb-2 pt-1" role="listbox" aria-label="ترتیب نمایش">
          {SORT_OPTIONS.map((opt) => {
            const active = opt.id === sort;
            return (
              <li key={opt.id}>
                <button
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onPick(opt.id);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-bold transition-colors",
                    active
                      ? "bg-ls-purple/15 text-ls-purple-soft"
                      : "text-white/80 hover:bg-ls-card"
                  )}
                >
                  <span className="min-w-0 flex-1 text-right">{opt.label}</span>
                  {active && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
