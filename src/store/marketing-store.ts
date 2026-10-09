"use client";

import { create } from "zustand";
import type { ActiveBoost, BoostPackage, PromoCode } from "@/lib/data/seller-marketing";
import { ACTIVE_BOOST, BOOST_PACKAGES, PROMO_CODES } from "@/lib/data/seller-marketing";

/* ─────────────────────────────────────────────────────────────
   استور بازاریابی فروشنده — فاز ۳
   کدهای تخفیف (فعال/غیرفعال، ساخت کد جدید) و تقویت شو
   (شروع/توقف بستهٔ تقویت روی شو بعدی).
   ───────────────────────────────────────────────────────────── */

export interface MarketingState {
  promoCodes: PromoCode[];
  /** تقویت فعال فعلی — null یعنی هیچ تقویتی روشن نیست */
  boostActive: ActiveBoost | null;

  /** فعال/غیرفعال کردن کد تخفیف */
  toggleCode: (id: string) => void;
  /** ساخت کد خودکار LS-XXXX با درصد انتخابی — کد ساخته‌شده برمی‌گرداند */
  addCode: (opts: { percent: number }) => PromoCode;
  /** روشن‌کردن بستهٔ تقویت روی شو بعدی — بسته برای toast برمی‌گردد */
  startBoost: (pkgId: string, showTitle: string) => BoostPackage | null;
  /** توقف تقویت فعال */
  stopBoost: () => void;
}

/* شمارندهٔ شناسهٔ کد — ادامه از روی seedها */
let promoCounter = 3;

/** کد ۴حرفی لاتین برای LS-XXXX (متن کد LTR است — قانون ارقام اِکسَمپت) */
function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `LS-${out}`;
}

const SEED_PROMOS: PromoCode[] = PROMO_CODES.map((c) => ({ ...c }));

export const useMarketingStore = create<MarketingState>((set) => ({
  promoCodes: SEED_PROMOS,
  boostActive: ACTIVE_BOOST,

  toggleCode: (id) =>
    set((s) => ({
      promoCodes: s.promoCodes.map((c) =>
        c.id === id ? { ...c, active: !c.active } : c
      ),
    })),

  addCode: ({ percent }) => {
    const code: PromoCode = {
      id: `pm${++promoCounter}`,
      code: randomCode(),
      percent,
      usedCount: 0,
      maxCount: 100,
      active: true,
      expiresLabel: "۳۰ روز",
    };
    set((s) => ({ promoCodes: [code, ...s.promoCodes] }));
    return code;
  },

  startBoost: (pkgId, showTitle) => {
    const pkg = BOOST_PACKAGES.find((p) => p.id === pkgId);
    if (!pkg) return null;
    set({ boostActive: { showTitle, endsLabel: "۷ روز" } });
    return pkg;
  },

  stopBoost: () => set({ boostActive: null }),
}));
