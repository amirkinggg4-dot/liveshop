"use client";

/* ─────────────────────────────────────────────────────────────
   v1.6.2 — جستجوهای اخیر کاوش (localStorage با try/catch)
   چیپ‌های قابل‌حذف + «پاک‌کردن همه» — الگوی useSyncExternalStore
   (بدون setState داخل effect) + رویداد سفارشی برای همگام‌سازی.
   ───────────────────────────────────────────────────────────── */

import { useSyncExternalStore } from "react";
import { History, Trash2, X } from "lucide-react";
import { faEquals } from "@/lib/persian";

const RECENT_KEY = "liveshop.explore.recent-searches.v1";
const MAX_RECENT = 8;
const EVENT = "liveshop:recent-searches";
const EMPTY_RECENT: string[] = [];

/* ── خواندن/نوشتن localStorage — همیشه try/catch ── */

function load(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function save(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    /* ذخیره ممکن نشد — فقط برای همین نشست می‌ماند */
  }
}

/* ── استور بیرونی — اسنپ‌شات کش می‌شود (useSyncExternalStore باید
   اسنپ‌شات پایدار برگرداند وگرنه حلقهٔ بی‌نهایت رندر می‌افتد) ── */

const recentStore = {
  listeners: new Set<() => void>(),
  cache: null as string[] | null,
  notify() {
    this.cache = null;
    this.listeners.forEach((l) => l());
  },
  subscribe(cb: () => void) {
    const on = () => cb();
    recentStore.listeners.add(cb);
    window.addEventListener(EVENT, on);
    window.addEventListener("storage", on);
    return () => {
      recentStore.listeners.delete(cb);
      window.removeEventListener(EVENT, on);
      window.removeEventListener("storage", on);
    };
  },
  getSnapshot(): string[] {
    if (recentStore.cache === null) recentStore.cache = load();
    return recentStore.cache;
  },
  getServerSnapshot(): string[] {
    return EMPTY_RECENT;
  },
  add(query: string) {
    const q = query.trim();
    if (!q) return;
    const list = load().filter((v) => !faEquals(v, q));
    save([q, ...list]);
    recentStore.notify();
  },
  remove(query: string) {
    save(load().filter((v) => !faEquals(v, query)));
    recentStore.notify();
  },
  clear() {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* noop */
    }
    recentStore.notify();
  },
};

export function useRecentSearches() {
  const recent = useSyncExternalStore(
    recentStore.subscribe,
    recentStore.getSnapshot,
    recentStore.getServerSnapshot
  );
  return {
    recent,
    add: (q: string) => recentStore.add(q),
    remove: (q: string) => recentStore.remove(q),
    clear: () => recentStore.clear(),
  };
}

/* ── سکشن UI «جستجوهای اخیر» ── */

export function RecentSearchesSection({
  onPick,
}: {
  onPick: (q: string) => void;
}) {
  const { recent, remove, clear } = useRecentSearches();
  if (recent.length === 0) return null;
  return (
    <section aria-label="جستجوهای اخیر">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-extrabold">
          <History className="h-[18px] w-[18px] text-ls-pink" aria-hidden />
          جستجوهای اخیر
        </h2>
        <button
          onClick={clear}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold text-white/50 transition-colors hover:text-ls-pink"
          aria-label="پاک‌کردن همهٔ جستجوهای اخیر"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          پاک‌کردن همه
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {recent.map((q) => (
          <span
            key={q}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-ls-card py-1 pl-1.5 pr-3 text-xs transition-colors hover:border-ls-purple/40"
          >
            <button
              onClick={() => onPick(q)}
              className="max-w-[180px] cursor-pointer break-words text-right font-bold text-white/85"
              aria-label={`جستجوی ${q}`}
            >
              {q}
            </button>
            <button
              onClick={() => remove(q)}
              className="rounded-full p-0.5 text-white/35 transition-colors hover:text-ls-pink"
              aria-label={`حذف ${q} از جستجوهای اخیر`}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}
