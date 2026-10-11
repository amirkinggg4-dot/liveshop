"use client";

/* ─────────────────────────────────────────────────────────────
   v1.9.0 — اعتماد: بج «پیش‌نویس — نیاز به بازبینی حقوقی» برای
   متن‌های قانونی + جایگاه خالی «نماد اعتماد» در پایین صفحهٔ حساب
   (پس از دریافت نماد جایگزین می‌شود).
   ───────────────────────────────────────────────────────────── */

import { FileWarning, ShieldCheck } from "lucide-react";

export function DraftBadge() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300"
      role="note"
      aria-label="پیش‌نویس — نیاز به بازبینی حقوقی"
    >
      <FileWarning className="h-3 w-3" aria-hidden />
      پیش‌نویس — نیاز به بازبینی حقوقی
    </span>
  );
}

export function TrustBadgePlaceholder() {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center"
      role="note"
      aria-label="جایگاه نماد اعتماد الکترونیکی"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-ls-card-2 text-white/25">
        <ShieldCheck className="h-7 w-7" aria-hidden />
      </span>
      <p className="text-xs font-bold text-white/50">نماد اعتماد الکترونیکی</p>
      <p className="text-[11px] leading-5 text-white/35">
        پس از دریافت نماد جایگزین شود
      </p>
    </div>
  );
}
