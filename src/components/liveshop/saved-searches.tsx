"use client";

import { toast } from "sonner";
import { Bell, BellRing, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { faNum } from "@/lib/format";
import { useActivityStore } from "@/store/activity-store";

/* ─────────────────────────────────────────────────────────────
   جستجوهای ذخیره‌شده — فاز ۳ (Atlas تصویر ۱۴)
   ردیف چیپ‌های افقی خوداتکا (self-contained): اعمال جستجو،
   روشن/خاموش کردن هشدار زنگوله و حذف — و «ذخیرهٔ این جستجو»
   برای کوئری فعلی. خودش از activity-store می‌خواند و در هر صفحهٔ
   کاوش/لایو قابل رندر است.
   ───────────────────────────────────────────────────────────── */

export function SavedSearchesRow({
  currentQuery,
  onPick,
}: {
  currentQuery?: string;
  onPick?: (q: string) => void;
}) {
  const savedSearches = useActivityStore((s) => s.savedSearches);
  const toggleSearchAlert = useActivityStore((s) => s.toggleSearchAlert);
  const removeSearch = useActivityStore((s) => s.removeSearch);
  const saveSearch = useActivityStore((s) => s.saveSearch);

  /* چیزی برای نشان دادن نیست (نه جستجوی ذخیره‌شده، نه کوئری فعلی) */
  if (savedSearches.length === 0 && !currentQuery?.trim()) return null;

  const pick = (q: string) => {
    onPick?.(q);
    toast("جستجو اعمال شد");
  };

  const onToggleAlert = (id: string, query: string, alertOn: boolean) => {
    toggleSearchAlert(id);
    toast(
      alertOn
        ? `هشدار «${query}» خاموش شد`
        : `هشدار «${query}» روشن شد 🔔`
    );
  };

  const onRemove = (id: string, query: string) => {
    removeSearch(id);
    toast(`«${query}» از جستجوهای ذخیره‌شده حذف شد`);
  };

  const onSave = () => {
    const q = currentQuery?.trim();
    if (!q) return;
    const res = saveSearch(q);
    if (res.ok) {
      toast.success("جستجو ذخیره شد 🔔");
    } else {
      toast.error(res.error ?? "ذخیرهٔ جستجو ممکن نشد");
    }
  };

  return (
    <section className="mb-4" aria-label="جستجوهای ذخیره‌شده">
      {/* برچسب ریز سکشن */}
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-white/50">
        <Search className="h-3.5 w-3.5" aria-hidden />
        <span>جستجوهای ذخیره‌شده</span>
        <span className="rounded-full bg-ls-card-2 px-1.5 py-px text-[10px] text-white/60">
          {faNum(savedSearches.length)}
        </span>
      </div>

      {/* چیپ‌های افقی */}
      <div className="flex gap-2 overflow-x-auto scroll-thin pb-1">
        {savedSearches.map((s) => (
          <div
            key={s.id}
            role="button"
            tabIndex={0}
            onClick={() => pick(s.query)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pick(s.query);
              }
            }}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-ls-card px-3 py-1.5 text-xs transition-colors hover:border-ls-purple/40"
            aria-label={`اعمال جستجوی ${s.query} — ${faNum(s.matchCount)} نتیجه`}
          >
            <span aria-hidden>🔎</span>
            <span className="max-w-[140px] truncate font-medium">{s.query}</span>
            <span
              className="rounded-full bg-ls-green/15 px-1.5 py-px text-[10px] font-black text-ls-green"
              aria-label={`${faNum(s.matchCount)} نتیجه`}
            >
              {faNum(s.matchCount)}
            </span>

            {/* زنگولهٔ هشدار */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleAlert(s.id, s.query, s.alertOn);
              }}
              className="rounded-full p-0.5 transition-colors"
              aria-label={
                s.alertOn
                  ? `خاموش کردن هشدار جستجوی ${s.query}`
                  : `روشن کردن هشدار جستجوی ${s.query}`
              }
            >
              <span
                className={cn("flex", s.alertOn ? "text-ls-green" : "text-white/40")}
                title={s.alertOn ? "هشدار روشن" : "هشدار خاموش"}
              >
                {s.alertOn ? (
                  <BellRing className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Bell className="h-3.5 w-3.5" aria-hidden />
                )}
              </span>
            </button>

            {/* حذف */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(s.id, s.query);
              }}
              className="rounded-full p-0.5 text-white/35 transition-colors hover:text-ls-pink"
              aria-label={`حذف جستجوی ${s.query}`}
            >
              <span className="flex" title="حذف جستجو">
                <X className="h-3.5 w-3.5" aria-hidden />
              </span>
            </button>
          </div>
        ))}

        {/* ذخیرهٔ کوئری فعلی */}
        {currentQuery?.trim() && (
          <button
            type="button"
            onClick={onSave}
            className="shrink-0 rounded-full border border-dashed border-ls-purple/50 bg-ls-purple/10 px-3 py-1.5 text-xs font-bold text-ls-purple-soft transition-colors hover:bg-ls-purple/20"
            aria-label={`ذخیرهٔ جستجوی ${currentQuery.trim()}`}
          >
            + ذخیرهٔ این جستجو
          </button>
        )}
      </div>
    </section>
  );
}
