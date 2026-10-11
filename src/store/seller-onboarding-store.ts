"use client";

import { create } from "zustand";
import { useSyncExternalStore } from "react";

/* ─────────────────────────────────────────────────────────────
   v1.7.0 — درخواست فروشندگی (onboarding) — بخش ۶ قرارداد API
   POST /seller/apply → status PENDING؛ وضعیت‌ها:
   none → درخواستی نیست (فرم خالی)
   pending → در انتظار تأیید (شروع لایو و لیستینگ غیرفعال)
   approved → فروشندهٔ فعال (وضعیت پیش‌فرض دمو — اپ امروز فروشندهٔ
     تأییدشدهٔ s1 است تا بقیهٔ صفحه‌ها همان رفتار قبلی را داشته باشند)
   rejected → رد شده با دلیل (امکان ویرایش و ارسال مجدد)
   suspended → تعلیق (با نمایش علت و مسیر پشتیبانی)
   ماسک: کد ملی و شبا فقط ماسک‌شده ذخیره/نمایش می‌شوند؛ هرگز کامل در
   toast یا لاگ نمی‌روند (invariant تست‌شده در تست‌های واحد).
   ───────────────────────────────────────────────────────────── */

export type SellerOnboardingStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export interface SellerApplication {
  storeName: string;
  slug: string;
  mainCategoryLabel: string;
  nationalId: string;
  sheba: string;
  /** عکس مدرک — فقط placeholder (دمو) */
  idPhotoAccepted: boolean;
  termsAccepted: boolean;
  submittedAtLabel?: string;
  rejectionReason?: string;
  suspendedReason?: string;
}

export const SELLER_STATUS_LABEL: Record<SellerOnboardingStatus, string> = {
  none: "بدون درخواست",
  pending: "در انتظار تأیید",
  approved: "تأیید شده",
  rejected: "رد شده",
  suspended: "تعلیق‌شده",
};

interface OnboardingState {
  status: SellerOnboardingStatus;
  application: SellerApplication | null;

  submit: (app: SellerApplication) => void;
  /** ادمین (دموی دستی) — تأیید درخواست */
  approve: () => void;
  reject: (reason: string) => void;
  suspend: (reason: string) => void;
  /** ویرایش مجدد پس از رد — وضعیت به فرم برمی‌گردد */
  reopenForm: () => void;
  reset: () => void;
}

const SEED_APPLICATION: SellerApplication = {
  storeName: "کفش‌خانهٔ سینا",
  slug: "sina-kicks",
  mainCategoryLabel: "کتونی و کفش",
  nationalId: "0010515526",
  sheba: "IR580540105180021273113007",
  idPhotoAccepted: true,
  termsAccepted: true,
};

/** دمو: کاربر فعلی فروشندهٔ تأییدشده است تا بقیهٔ اپ بدون تغییر کار کند */
export const useSellerOnboardingStore = create<OnboardingState>((set) => ({
  status: "approved",
  application: { ...SEED_APPLICATION },

  submit: (app) =>
    set((s) => ({
      status: "pending",
      application: { ...s.application, ...app, rejectionReason: undefined },
    })),

  approve: () => set({ status: "approved" }),

  reject: (reason) =>
    set((s) => ({
      status: "rejected",
      application: s.application ? { ...s.application, rejectionReason: reason } : s.application,
    })),

  suspend: (reason) =>
    set((s) => ({
      status: "suspended",
      application: s.application ? { ...s.application, suspendedReason: reason } : s.application,
    })),

  reopenForm: () => set({ status: "none" }),

  reset: () =>
    set({ status: "none", application: { ...SEED_APPLICATION, termsAccepted: false, idPhotoAccepted: false } }),
}));

/* ── گیت صفحات فروشنده — تا تأیید نشدن، شروع لایو/لیستینگ غیرفعال ──
   v1.7.0 — کلید دموی ?seller= هم در گیت لحاظ می‌شود تا وضعیت‌های
   فرم/در انتظار/رد/تعلیق بدون دست‌کاری استور قابل نمایش باشند. */

export interface SellerGate {
  approved: boolean;
  /** علت غیرفعال‌بودن برای نمایش زیر دکمهٔ قفل‌شده */
  reason: string | null;
  status: SellerOnboardingStatus;
}

export function useSellerGate(): SellerGate {
  const storeStatus = useSellerOnboardingStore((s) => s.status);
  const forced = useForcedSellerStatus();
  const status: SellerOnboardingStatus = forced ?? storeStatus;
  const reason = (() => {
    switch (status) {
      case "none":
        return "اول درخواست فروشندگی را ثبت کن";
      case "pending":
        return "درخواست فروشندگی‌ات در انتظار تأیید است";
      case "rejected":
        return "درخواست فروشندگی رد شده — پس از اصلاح دوباره بفرست";
      case "suspended":
        return "اکانت فروشنده‌ات موقتاً تعلیق شده";
      default:
        return null;
    }
  })();
  return { approved: status === "approved", reason, status };
}

/* ── کلید دموی وضعیت (?seller=none|pending|rejected|suspended) ──
   الگوی ?state= نماهای دیگر — برای اسکرین‌شات و تست دستی وضعیت‌ها.
   وقتی کلید هست، وضعیت فرم هم از همان الگو پیروی می‌کند (نمای onboarding
   کارت همان وضعیت را نشان می‌دهد). */

export type ForcedSellerStatus = "none" | "pending" | "rejected" | "suspended";

const forcedSellerStore = {
  listeners: new Set<() => void>(),
  subscribe(cb: () => void) {
    forcedSellerStore.listeners.add(cb);
    return () => forcedSellerStore.listeners.delete(cb);
  },
  getSnapshot(): ForcedSellerStatus | null {
    try {
      const v = new URLSearchParams(window.location.search).get("seller");
      return v === "none" || v === "pending" || v === "rejected" || v === "suspended"
        ? v
        : null;
    } catch {
      return null;
    }
  },
  getServerSnapshot(): ForcedSellerStatus | null {
    return null;
  },
};

export function useForcedSellerStatus(): ForcedSellerStatus | null {
  return useSyncExternalStore(
    forcedSellerStore.subscribe,
    forcedSellerStore.getSnapshot,
    forcedSellerStore.getServerSnapshot
  );
}
