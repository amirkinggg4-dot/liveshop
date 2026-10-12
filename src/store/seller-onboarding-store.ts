"use client";

import { create } from "zustand";
import { useSyncExternalStore } from "react";
import {
  canTransition,
  validateRejectReason,
  validateSuspendReason,
  type SellerStatus,
} from "@/lib/seller-status";

/* ─────────────────────────────────────────────────────────────
   درخواست فروشندگی (onboarding) — بخش ۶ قرارداد API
   POST /seller/apply → status PENDING؛ وضعیت‌ها:
   none → درخواستی نیست (فرم خالی)
   pending → در انتظار تأیید (شروع لایو و لیستینگ غیرفعال)
   approved → فروشندهٔ فعال
   rejected → رد شده با دلیل (امکان ویرایش و ارسال مجدد)
   suspended → تعلیق (با نمایش علت و مسیر پشتیبانی)

   v1.9.1 — تغییر قرارداد دسترسی:
   ─ وضعیت پیش‌فرض کاربر عادی «none» است (نه approved)؛ داده‌ی فروشندهٔ
     نمونهٔ «کفش‌خانهٔ سینا» فقط با کلید دموی صریح ‎?seller=approved‎
     دیده می‌شود.
   ─ وضعیت فروشنده به کاربر واردشده متصل است (useAuth): با خروج/حذف
     حساب و با ورود کاربر تازه، hardReset می‌شود (actionهایی که
     auth-store صدا می‌زند).
   ─ همهٔ گذارها از canTransition در src/lib/seller-status.ts رد
     می‌شوند (ماشین وضعیت خالص با تست جامع) — مثلاً از none نمی‌شود
     مستقیم approved شد.
   ماسک: کد ملی و شبا فقط ماسک‌شده ذخیره/نمایش می‌شوند؛ هرگز کامل در
   toast یا لاگ نمی‌روند (invariant تست‌شده در تست‌های واحد).
   ───────────────────────────────────────────────────────────── */

export type SellerOnboardingStatus = SellerStatus;

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

/** دادهٔ فروشندهٔ نمونه — فقط با کلید دموی ‎?seller=approved‎ مصرف می‌شود
    (فرم با اطلاعات قبلی پیش‌پر می‌شود). */
export const SAMPLE_SEED_APPLICATION: SellerApplication = {
  storeName: "کفش‌خانهٔ سینا",
  slug: "sina-kicks",
  mainCategoryLabel: "کتونی و کفش",
  nationalId: "0010515526",
  sheba: "IR580540105180021273113007",
  idPhotoAccepted: true,
  termsAccepted: true,
};

export type ActionGuardResult = { ok: true } | { ok: false; message: string };

/* ── v1.9.1 — پایداری نشست (sessionStorage) ──
   وضعیت فروشنده بین مسیر / و /admin مشترک است (mock مشترک ادمین/فروشنده).
   sessionStorage (نه localStorage): با بستن تب پاک می‌شود — هم‌فلسفهٔ
   mock حافظه‌ای بقیهٔ اپ. hydrate فقط روی mount صدا زده می‌شود تا
   SSR/هیدریشن mismatch رخ ندهد. خروج/حذف حساب کلید را هم پاک می‌کند. */
const SESSION_KEY = "ls-seller-onboarding-v1";

type PersistedSeller = {
  status: SellerOnboardingStatus;
  application: SellerApplication | null;
};

function readSellerSession(): PersistedSeller | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PersistedSeller;
    if (
      p &&
      typeof p.status === "string" &&
      ["none", "pending", "approved", "rejected", "suspended"].includes(p.status)
    ) {
      return { status: p.status, application: p.application ?? null };
    }
    return null;
  } catch {
    return null;
  }
}

function writeSellerSession(p: PersistedSeller): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(p));
  } catch {
    /* حافظهٔ در دسترس نیست — بی‌صدا */
  }
}

function clearSellerSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

interface OnboardingState {
  status: SellerOnboardingStatus;
  application: SellerApplication | null;

  /** ثبت/ارسال دوبارهٔ درخواست — فقط از none یا rejected */
  submit: (app: SellerApplication) => ActionGuardResult;
  /** تأیید ادمین — فقط از pending (و رفع تعلیق از suspended با unsuspend) */
  approve: () => ActionGuardResult;
  /** رد ادمین — فقط از pending؛ دلیل اجباری و به فروشنده نمایش داده می‌شود */
  reject: (reason: string) => ActionGuardResult;
  /** تعلیق ادمین — فقط از approved؛ علت اجباری */
  suspend: (reason: string) => ActionGuardResult;
  /** رفع تعلیق ادمین — فقط از suspended */
  unsuspend: () => ActionGuardResult;
  /** ویرایش مجدد پس از رد — وضعیت به فرم برمی‌گردد (rejected → none) */
  reopenForm: () => ActionGuardResult;
  /** v1.9.1 — اتصال به useAuth: با خروج/حذف حساب/ورود کاربر تازه وضعیت پاک می‌شود */
  hardReset: () => void;
  reset: () => void;
  /** v1.9.1 — بازیابی وضعیت نشست از sessionStorage (روی mount؛ برای mock مشترک / و /admin) */
  hydrateFromSession: () => boolean;
}

export const useSellerOnboardingStore = create<OnboardingState>((set, get) => ({
  /* v1.9.1 — پیش‌فرض: کاربر عادی فروشنده نیست؛ hydrate از sessionStorage
     فقط با hydrateFromSession روی mount انجام می‌شود (نه در سازنده) */
  status: "none",
  application: null,

  submit: (app) => {
    const cur = get().status;
    if (!canTransition(cur, "pending")) {
      return {
        ok: false,
        message: `از وضعیت «${cur}» نمی‌شود درخواست ثبت کرد`,
      };
    }
    set((s) => {
      const next = {
        status: "pending" as const,
        application: { ...s.application, ...app, rejectionReason: undefined },
      };
      writeSellerSession(next);
      return next;
    });
    return { ok: true };
  },

  approve: () => {
    if (!canTransition(get().status, "approved")) {
      return { ok: false, message: "تأیید فقط برای درخواستِ در انتظار ممکن است" };
    }
    set((s) => {
      const next = { ...s, status: "approved" as const };
      writeSellerSession(next);
      return next;
    });
    return { ok: true };
  },

  reject: (reason) => {
    if (!canTransition(get().status, "rejected")) {
      return { ok: false, message: "رد فقط برای درخواستِ در انتظار ممکن است" };
    }
    const v = validateRejectReason(reason);
    if (!v.ok) return { ok: false, message: v.message };
    set((s) => {
      const next = {
        ...s,
        status: "rejected" as const,
        application: s.application
          ? { ...s.application, rejectionReason: v.value }
          : s.application,
      };
      writeSellerSession(next);
      return next;
    });
    return { ok: true };
  },

  suspend: (reason) => {
    if (!canTransition(get().status, "suspended")) {
      return { ok: false, message: "تعلیق فقط برای فروشندهٔ فعال ممکن است" };
    }
    const v = validateSuspendReason(reason);
    if (!v.ok) return { ok: false, message: v.message };
    set((s) => {
      const next = {
        ...s,
        status: "suspended" as const,
        application: s.application
          ? { ...s.application, suspendedReason: v.value }
          : s.application,
      };
      writeSellerSession(next);
      return next;
    });
    return { ok: true };
  },

  unsuspend: () => {
    if (!canTransition(get().status, "approved")) {
      return { ok: false, message: "رفع تعلیق فقط برای اکانتِ تعلیق‌شده ممکن است" };
    }
    set((s) => {
      const next = { ...s, status: "approved" as const };
      writeSellerSession(next);
      return next;
    });
    return { ok: true };
  },

  reopenForm: () => {
    if (!canTransition(get().status, "none")) {
      return { ok: false, message: "باز کردن فرم فقط بعد از رد شدن ممکن است" };
    }
    set((s) => {
      const next = { ...s, status: "none" as const };
      writeSellerSession(next);
      return next;
    });
    return { ok: true };
  },

  hardReset: () => {
    clearSellerSession();
    set({ status: "none", application: null });
  },

  hydrateFromSession: () => {
    const p = readSellerSession();
    if (!p) return false;
    set({ status: p.status, application: p.application });
    return true;
  },

  reset: () =>
    set({
      status: "none",
      application: {
        ...SAMPLE_SEED_APPLICATION,
        termsAccepted: false,
        idPhotoAccepted: false,
      },
    }),
}));

/* ── گیت صفحات فروشنده — تا تأیید نشدن، شروع لایو/لیستینگ غیرفعال ──
   v1.7.0 — کلید دموی ?seller= هم در گیت لحاظ می‌شود تا وضعیت‌های
   فرم/در انتظار/تأیید/رد/تعلیق بدون دست‌کاری استور قابل نمایش باشند. */

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

/* ── کلید دموی وضعیت (?seller=none|pending|approved|rejected|suspended) ──
   الگوی ?state= نماهای دیگر — برای اسکرین‌شات و تست دستی وضعیت‌ها.
   v1.9.1 — کلید «approved» اضافه شد: دادهٔ فروشندهٔ نمونه (کفش‌خانهٔ
   سینا) فقط با همین کلید صریح نمایش داده می‌شود؛ بدون کلید، کاربر
   عادی none است. وقتی کلید هست، وضعیت فرم هم از همان الگو پیروی می‌کند
   (نمای onboarding کارت همان وضعیت را نشان می‌دهد). */

export type ForcedSellerStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

const FORCED_SELLER_KEYS: readonly ForcedSellerStatus[] = [
  "none",
  "pending",
  "approved",
  "rejected",
  "suspended",
];

const forcedSellerStore = {
  listeners: new Set<() => void>(),
  subscribe(cb: () => void) {
    forcedSellerStore.listeners.add(cb);
    return () => forcedSellerStore.listeners.delete(cb);
  },
  getSnapshot(): ForcedSellerStatus | null {
    try {
      const v = new URLSearchParams(window.location.search).get("seller");
      return (FORCED_SELLER_KEYS as readonly string[]).includes(v ?? "")
        ? (v as ForcedSellerStatus)
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
