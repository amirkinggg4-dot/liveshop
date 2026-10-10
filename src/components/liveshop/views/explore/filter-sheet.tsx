"use client";

/* ─────────────────────────────────────────────────────────────
   v1.6.2 — شیت فیلتر کاوش (پایین): بازهٔ قیمت، سایز، برند،
   وضعیت کالا (نو/دست‌دوم)، فقط زنده — اعمال/حذف همه
   والد با key remount می‌کند تا draft هر بار از فیلتر فعلی بسازد.
   ───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { faNum } from "@/lib/format";
import { ALL_ITEMS } from "@/lib/data/items";
import {
  availableBrands,
  availableSizes,
  type ExploreFilters,
} from "./filters";

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
        active
          ? "bg-ls-purple text-white"
          : "bg-ls-card-2 text-white/70 hover:text-white"
      )}
    >
      {label}
    </button>
  );
}

export default function FilterSheet({
  open,
  onOpenChange,
  filters,
  liveOnly,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ExploreFilters;
  liveOnly: boolean;
  onApply: (f: ExploreFilters, liveOnly: boolean) => void;
}) {
  const [draft, setDraft] = useState<ExploreFilters>(filters);
  const [draftLiveOnly, setDraftLiveOnly] = useState(liveOnly);
  const [minText, setMinText] = useState(
    filters.minPrice != null ? String(filters.minPrice) : ""
  );
  const [maxText, setMaxText] = useState(
    filters.maxPrice != null ? String(filters.maxPrice) : ""
  );

  const sizes = availableSizes(ALL_ITEMS);
  const brands = availableBrands(ALL_ITEMS);

  const toggleIn = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const apply = () => {
    const min = minText.trim() === "" ? null : Number(minText.replace(/[^\d]/g, ""));
    const max = maxText.trim() === "" ? null : Number(maxText.replace(/[^\d]/g, ""));
    onApply(
      {
        ...draft,
        minPrice: min != null && !Number.isNaN(min) && min > 0 ? min : null,
        maxPrice: max != null && !Number.isNaN(max) && max > 0 ? max : null,
      },
      draftLiveOnly
    );
    onOpenChange(false);
  };

  const reset = () => {
    setDraft({
      minPrice: null,
      maxPrice: null,
      sizes: [],
      brands: [],
      condition: null,
    });
    setDraftLiveOnly(false);
    setMinText("");
    setMaxText("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[86dvh] overflow-y-auto rounded-t-3xl border-white/10 bg-ls-bg px-0 pb-[max(env(safe-area-inset-bottom),12px)] pt-2"
        aria-describedby={undefined}
      >
        <span
          className="mx-auto mb-1 block h-1 w-10 rounded-full bg-white/20"
          aria-hidden
        />
        <SheetHeader className="px-4 text-right">
          <SheetTitle className="text-base font-extrabold text-white">
            فیلترها
          </SheetTitle>
          <SheetDescription className="sr-only">
            فیلتر قیمت، سایز، برند، وضعیت کالا و فقط زنده
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-2 pt-1">
          {/* بازهٔ قیمت */}
          <section aria-label="بازهٔ قیمت">
            <p className="mb-2 text-sm font-extrabold text-white/90">
              قیمت (تومان)
            </p>
            <div className="flex items-center gap-2">
              <Input
                inputMode="numeric"
                value={minText}
                onChange={(e) => setMinText(e.target.value)}
                placeholder="از"
                aria-label="حداقل قیمت به تومان"
                className="h-10 bg-ls-card border-white/10 text-center text-sm tabular-nums"
              />
              <span className="text-white/35" aria-hidden>
                —
              </span>
              <Input
                inputMode="numeric"
                value={maxText}
                onChange={(e) => setMaxText(e.target.value)}
                placeholder="تا"
                aria-label="حداکثر قیمت به تومان"
                className="h-10 bg-ls-card border-white/10 text-center text-sm tabular-nums"
              />
            </div>
          </section>

          {/* سایز */}
          <section aria-label="سایز">
            <p className="mb-2 text-sm font-extrabold text-white/90">سایز</p>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={draft.sizes.includes(s)}
                  onClick={() =>
                    setDraft((d) => ({ ...d, sizes: toggleIn(d.sizes, s) }))
                  }
                />
              ))}
            </div>
          </section>

          {/* برند */}
          <section aria-label="برند">
            <p className="mb-2 text-sm font-extrabold text-white/90">برند</p>
            <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto scrollbar-thin">
              {brands.map((b) => (
                <Chip
                  key={b}
                  label={b}
                  active={draft.brands.includes(b)}
                  onClick={() =>
                    setDraft((d) => ({ ...d, brands: toggleIn(d.brands, b) }))
                  }
                />
              ))}
            </div>
          </section>

          {/* وضعیت کالا */}
          <section aria-label="وضعیت کالا">
            <p className="mb-2 text-sm font-extrabold text-white/90">
              وضعیت کالا
            </p>
            <div className="flex gap-1.5">
              <Chip
                label="نو"
                active={draft.condition === "new"}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    condition: d.condition === "new" ? null : "new",
                  }))
                }
              />
              <Chip
                label="دست‌دوم"
                active={draft.condition === "used"}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    condition: d.condition === "used" ? null : "used",
                  }))
                }
              />
            </div>
          </section>

          {/* فقط زنده */}
          <div className="flex items-center justify-between rounded-2xl bg-ls-card border border-white/5 px-3.5 py-3">
            <span className="text-sm font-bold text-white/85">فقط زنده</span>
            <Switch
              checked={draftLiveOnly}
              onCheckedChange={setDraftLiveOnly}
              aria-label="نمایش فقط شوهای زنده"
            />
          </div>
        </div>

        {/* اعمال / حذف */}
        <div className="flex gap-2 px-4 pt-2">
          <button
            onClick={apply}
            className="h-11 flex-1 rounded-xl bg-ls-purple text-sm font-bold text-white transition-colors hover:bg-ls-purple-deep"
          >
            اعمال فیلتر
          </button>
          <button
            onClick={reset}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-ls-card-2 px-4 text-sm font-bold text-white/75 transition-colors hover:text-white"
            aria-label="حذف همهٔ فیلترها"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            حذف همه
          </button>
        </div>
        <p className="px-4 pt-2 text-center text-[11px] text-white/40">
          قیمت‌ها به تومان — مثلا {faNum(5000000)}
        </p>
      </SheetContent>
    </Sheet>
  );
}
