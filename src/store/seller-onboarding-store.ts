"use client";

import { create } from "zustand";
import { useSyncExternalStore } from "react";
import {
  canTransition,
  validateRejectReason,
  validateSuspendReason,
  type SellerStatus,
} from "@/lib/seller-status";
import {
  sanitizeCategoryDraft,
} from "@/lib/seller-category-pick";
import {
  sanitizeSubcategoryDraft,
  syncSubcategoryDraft,
  type SubcategoryDraft,
} from "@/lib/seller-subcategory-pick";
import {
  sanitizeSellerTypeDraft,
  type SellerTypeDraft,
} from "@/lib/seller-type-pick";
import {
  clearIncompatibleIdentity,
  sanitizeIdentityDraft,
  type IdentityDraft,
} from "@/lib/seller-identity";
import {
  CATEGORY_IDS,
  SUBCATEGORY_IDS_BY_CATEGORY,
} from "@/lib/data/categories";

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

/* ── v2.0.2 — پیشرفت مرحلهٔ «انتخاب دسته» (صفحهٔ SellerCategoryPickView) ──
   null = هنوز وارد جریان انتخاب نشده؛ آرایه = انتخاب‌های فعلی به ترتیب
   لمس (عضو اول = دستهٔ اصلی). با هر toggle ذخیره می‌شود تا با بستن
   و برگشتن از همین‌جا ادامه دهد؛ بعدی فرم «شروع فروش» دیگر دسته
   نمی‌پرسد و عضو اول پیش‌فرض دستهٔ اصلی می‌شود. */
export type CategoryDraft = string[] | null;

/* ── v2.0.3 — پیشرفت مرحلهٔ «انتخاب زیرمجموعه» (SellerSubcategoryPickView) ──
   {categoryId: string[]} — کلیدها دقیقاً دسته‌های انتخابی مرحلهٔ ۱ هستند
   (با حذف دسته، زیرمجموعه‌هایش از draft پاک می‌شود؛ با افزودن، بخش خالی
   می‌آید) و عضوهای هر کلید زیرمجموعه‌های انتخابی همان دسته‌اند (بدون سقف).
   null = هنوز وارد جریان زیرمجموعه نشده. */
export type SellerSubcategoryDraftState = SubcategoryDraft | null;

/* ── v2.0.4 — پیشرفت مرحلهٔ «نوع فروشنده» (SellerTypePickView) ──
   انتخاب تک‌گزینه‌ای: "individual" (شخص حقیقی) یا "business"
   (شخص حقوقی)؛ null = هنوز انتخاب نشده. با تغییر نوع، draft هویت
   مرحلهٔ ۵ (identityDraft) به نوع جدید تبدیل و فیلدهای ناسازگار پاک
   می‌شوند (فهرست پاک‌شده‌ها برای هشدار toast برمی‌گردد). */
export type SellerTypeDraftState = SellerTypeDraft;

/* ── v1.9.1 — پایداری نشست (sessionStorage) ──
   وضعیت فروشنده بین مسیر / و /admin مشترک است (mock مشترک ادمین/فروشنده).
   sessionStorage (نه localStorage): با بستن تب پاک می‌شود — هم‌فلسفهٔ
   mock حافظه‌ای بقیهٔ اپ. hydrate فقط روی mount صدا زده می‌شود تا
   SSR/هیدریشن mismatch رخ ندهد. خروج/حذف حساب کلید را هم پاک می‌کند. */
const SESSION_KEY = "ls-seller-onboarding-v1";

type PersistedSeller = {
  status: SellerOnboardingStatus;
  application: SellerApplication | null;
  /** v2.0.2 — اختیاری برای سازگاری با نشست‌های قبلی */
  categoryDraft?: string[] | null;
  /** v2.0.3 — اختیاری برای سازگاری با نشست‌های قبلی */
  subcategoryDraft?: Record<string, string[]> | null;
  /** v2.0.4 — اختیاری برای سازگاری با نشست‌های قبلی */
  sellerTypeDraft?: SellerTypeDraft;
  /** v2.0.4 — اختیاری برای سازگاری با نشست‌های قبلی (مرحلهٔ ۵ هنوز UI ندارد) */
  identityDraft?: IdentityDraft | null;
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
      const categoryDraft = sanitizeCategoryDraft(p.categoryDraft, CATEGORY_IDS);
      /* v2.0.3 — draft زیرمجموعه هم پاک‌سازی و همگام با دسته‌های موجود می‌شود:
         کلیدهای دستهٔ حذف‌شده دور ریخته و کلیدهای تازه با [] برمی‌گردند. */
      const subcategoryDraft = categoryDraft
        ? syncSubcategoryDraft(
            sanitizeSubcategoryDraft(
              p.subcategoryDraft,
              SUBCATEGORY_IDS_BY_CATEGORY
            ) ?? {},
            categoryDraft
          )
        : null;
      /* v2.0.4 — نوع فروشنده و draft هویت (پاک‌سازی نرم: شکل خراب → null) */
      const sellerTypeDraft = sanitizeSellerTypeDraft(p.sellerTypeDraft);
      const identityDraft = sanitizeIdentityDraft(p.identityDraft);
      return {
        status: p.status,
        application: p.application ?? null,
        categoryDraft,
        subcategoryDraft,
        sellerTypeDraft,
        identityDraft,
      };
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
  /** v2.0.2 — انتخاب‌های مرحلهٔ دسته (عضو اول = اصلی)؛ null = شروع نشده */
  categoryDraft: CategoryDraft;
  /** v2.0.2 — ثبت/به‌روزرسانی انتخاب دسته‌ها (با هر toggle صدا زده می‌شود) */
  setCategoryDraft: (ids: string[]) => void;
  /** v2.0.2 — پاک‌کردن انتخاب دسته‌ها (خروج از جریان بدون ذخیرهٔ عمدی — فعلاً مصرف نمی‌شود) */
  clearCategoryDraft: () => void;

  /** v2.0.3 — انتخاب‌های مرحلهٔ زیرمجموعه ({categoryId: string[]})؛ null = شروع نشده */
  subcategoryDraft: SellerSubcategoryDraftState;
  /** v2.0.3 — ثبت/به‌روزرسانی انتخاب زیرمجموعه‌ها (با هر toggle صدا زده می‌شود) */
  setSubcategoryDraft: (draft: SubcategoryDraft) => void;
  /** v2.0.3 — پاک‌کردن انتخاب زیرمجموعه‌ها (هم‌قرارداد clearCategoryDraft) */
  clearSubcategoryDraft: () => void;

  /** v2.0.4 — نوع فروشنده (مرحلهٔ ۳): "individual" | "business" | null */
  sellerTypeDraft: SellerTypeDraftState;
  /** v2.0.4 — ثبت نوع فروشنده؛ تغییر نوع، فیلدهای ناسازگار مرحلهٔ ۵ را پاک
      می‌کند و برچسب فارسی آن‌ها را برای هشدار برمی‌گرداند (خالی = هشدار ندارد) */
  setSellerTypeDraft: (type: SellerTypeDraft) => { clearedFields: string[] };
  /** v2.0.4 — پاک‌کردن نوع فروشنده (هم‌قرارداد clearCategoryDraft) */
  clearSellerTypeDraft: () => void;
  /** v2.0.4 — draft هویت مرحلهٔ ۵ (فقط داده/اعتبارسنجی؛ UI مرحلهٔ ۵ بعداً) */
  identityDraft: IdentityDraft | null;
  /** v2.0.4 — ثبت مستقیم draft هویت (برای صفحهٔ مرحلهٔ ۵ در آینده) */
  setIdentityDraft: (draft: IdentityDraft | null) => void;

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
  categoryDraft: null,
  subcategoryDraft: null,
  sellerTypeDraft: null,
  identityDraft: null,

  setCategoryDraft: (ids) => {
    const categoryDraft = sanitizeCategoryDraft(ids, CATEGORY_IDS);
    /* v2.0.3 — همگام‌سازی draft زیرمجموعه با انتخاب دسته‌ها:
       حذف دسته ← زیرمجموعه‌هایش پاک؛ افزودن ← کلید خالی؛
       بدون دسته (null) ← draft زیرمجموعه هم null. */
    const subcategoryDraft = categoryDraft
      ? syncSubcategoryDraft(get().subcategoryDraft ?? {}, categoryDraft)
      : null;
    const next = { ...get(), categoryDraft, subcategoryDraft };
    writeSellerSession(next);
    set({ categoryDraft: next.categoryDraft, subcategoryDraft: next.subcategoryDraft });
  },

  clearCategoryDraft: () => {
    const next = { ...get(), categoryDraft: null, subcategoryDraft: null };
    writeSellerSession(next);
    set({ categoryDraft: null, subcategoryDraft: null });
  },

  setSubcategoryDraft: (draft) => {
    const { categoryDraft } = get();
    const sanitized = sanitizeSubcategoryDraft(draft, SUBCATEGORY_IDS_BY_CATEGORY);
    /* همیشه همگام با دسته‌های انتخابی — کلیدهای بیگانه دور ریخته می‌شوند */
    const subcategoryDraft = categoryDraft
      ? syncSubcategoryDraft(sanitized ?? {}, categoryDraft)
      : null;
    const next = { ...get(), subcategoryDraft };
    writeSellerSession(next);
    set({ subcategoryDraft: next.subcategoryDraft });
  },

  clearSubcategoryDraft: () => {
    const next = { ...get(), subcategoryDraft: null };
    writeSellerSession(next);
    set({ subcategoryDraft: null });
  },

  /* v2.0.4 — تغییر نوع فروشنده: draft هویتِ نوع قبلی پاک می‌شود (با
     هشدار به فراخوان)؛ null = پاک‌کردن انتخاب (هویت هم پاک می‌شود و
     هشدار ندارد). */
  setSellerTypeDraft: (type) => {
    const { identityDraft } = get();
    const r =
      type === null
        ? { next: null, clearedFields: [] }
        : clearIncompatibleIdentity(identityDraft, type);
    const next = { ...get(), sellerTypeDraft: type, identityDraft: r.next };
    writeSellerSession(next);
    set({ sellerTypeDraft: type, identityDraft: r.next });
    return { clearedFields: r.clearedFields };
  },

  clearSellerTypeDraft: () => {
    const next = { ...get(), sellerTypeDraft: null, identityDraft: null };
    writeSellerSession(next);
    set({ sellerTypeDraft: null, identityDraft: null });
  },

  setIdentityDraft: (draft) => {
    const next = { ...get(), identityDraft: draft };
    writeSellerSession(next);
    set({ identityDraft: draft });
  },

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
    /* v2.0.2/v2.0.3/v2.0.4 — پیشرفت انتخاب دسته/زیرمجموعه/نوع و هویت هم
       به کاربر گره خورده است */
    set({
      status: "none",
      application: null,
      categoryDraft: null,
      subcategoryDraft: null,
      sellerTypeDraft: null,
      identityDraft: null,
    });
  },

  hydrateFromSession: () => {
    const p = readSellerSession();
    if (!p) return false;
    set({
      status: p.status,
      application: p.application,
      categoryDraft: p.categoryDraft ?? null,
      subcategoryDraft: p.subcategoryDraft ?? null,
      sellerTypeDraft: p.sellerTypeDraft ?? null,
      identityDraft: p.identityDraft ?? null,
    });
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
