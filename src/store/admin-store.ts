"use client";

import { create } from "zustand";
import { useSyncExternalStore } from "react";
import { canTransition, type SellerStatus } from "@/lib/seller-status";
import {
  useSellerOnboardingStore,
  type SellerApplication,
} from "@/store/seller-onboarding-store";
import { maskNationalId, maskSheba } from "@/lib/seller-validate";
import {
  canonicalPresenceLinks,
  type SellerPresenceDraft,
} from "@/lib/seller-presence";

/* ─────────────────────────────────────────────────────────────
   v1.9.1 — پنل ادمین (ساختار UI با دادهٔ mock — مطابق api-spec §7)
   ─ «درخواست‌های فروشندگی»: فهرست + فیلتر وضعیت/جستجو/تاریخ/دسته؛
     جزئیات با کد ملی و شبا فقط ماسک‌شده + دکمهٔ «نمایش» که در
     گزارش فعالیت ثبت می‌شود (مقدار کامل هرگز لاگ نمی‌شود).
   ─ عملیات: تأیید، رد (دلیل اجباری که به فروشنده نمایش داده می‌شود)،
     تعلیق/رفع تعلیق — هر عمل با دیالوگ تأیید و ثبت در گزارش فعالیت
     ادمین (چه کسی، چه چیزی، کی).
   ─ mock مشترک: درخواستِ کاربر دموی لاگین‌شده (req-demo) از استور
     onboarding می‌آید؛ تصمیم ادمین روی آن همان لحظه در نمای فروشنده
     تغییر می‌کند و اعلان به صندوق ورودی او می‌رود.
   ─ کاربر نقش ADMIN فقط با کلید دموی ‎?role=admin‎ (mock).
   ───────────────────────────────────────────────────────────── */

export const DEMO_SELLER_REQUEST_ID = "req-demo";
export const DEMO_USER_ID = "u-demo";
export const ADMIN_ACTOR = "مدیر LiveShop (دمو)";

/* ── v1.9.1 — صف اعلان‌های تصمیم ادمین برای صندوق ورودی فروشنده ──
   تصمیم ادمین در /admin ثبت می‌شود؛ وقتی کاربر به / برمی‌گردد (حتی با
   بارگذاری کامل صفحه)، inbox-store روی mount این صف را می‌خورد، به
   صندوق ورودی اضافه می‌کند و صف را خالی می‌کند (نمایش یک‌باره).
   sessionStorage با try/catch — هم‌فلسفهٔ mock حافظه‌ای. */
const ADMIN_INBOX_QUEUE_KEY = "ls-admin-inbox-v1";

export interface AdminInboxItem {
  kind: "system";
  title: string;
  body: string;
  atLabel: string;
  emoji: string;
  color: string;
}

export function enqueueAdminInboxItem(item: AdminInboxItem): void {
  try {
    const raw = sessionStorage.getItem(ADMIN_INBOX_QUEUE_KEY);
    const list: AdminInboxItem[] = raw ? JSON.parse(raw) : [];
    list.push(item);
    sessionStorage.setItem(ADMIN_INBOX_QUEUE_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

/** خواندن و خالی‌کردن صف — فقط یک‌بار مصرف (inbox-store روی mount) */
export function drainAdminInboxQueue(): AdminInboxItem[] {
  try {
    const raw = sessionStorage.getItem(ADMIN_INBOX_QUEUE_KEY);
    if (!raw) return [];
    sessionStorage.removeItem(ADMIN_INBOX_QUEUE_KEY);
    const list = JSON.parse(raw) as AdminInboxItem[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export type AdminRequestStatus = Extract<
  SellerStatus,
  "pending" | "approved" | "rejected" | "suspended"
>;

/* ── v2.0.6 — حضور آنلاین (مرحلهٔ ۵ ثبت‌نام) — لینک‌های canonical +
   آدرس فروشگاه فیزیکی + سوئیچ نمایش عمومی — اختیاری و tolerant با mockهای قدیمی ── */

/** یک لینک canonical — kind با enum SellerLinkKind دیتابیس هم‌خوان است */
export interface AdminSellerLink {
  kind: "WEBSITE" | "SOCIAL" | "STORE" | "OTHER_PLATFORM";
  platform?: string | null;
  value: string;
  isPublic?: boolean;
}

/** حضور آنلاین فروشنده — لینک‌ها همیشه canonical (src/lib/seller-presence.ts) */
export interface AdminSellerPresence {
  links: AdminSellerLink[];
  storeAddress?: {
    province?: string;
    city?: string;
    address?: string;
    phone?: string;
  } | null;
  linksPublic?: boolean;
}

export interface AdminSellerRequest {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  mainCategoryLabel: string;
  /** مقدار کامل فقط برای ماسک‌کردن در لحظهٔ نمایش — هرگز در UI/لاگ کامل نمی‌رود */
  nationalId: string;
  sheba: string;
  submittedAtLabel: string;
  submittedAtMs: number;
  status: AdminRequestStatus;
  rejectionReason?: string;
  suspendedReason?: string;
  /** درخواست کاربر دموی لاگین‌شده — به نمای فروشنده متصل است */
  isDemoUser: boolean;
  /** v2.0.5 — نوع فروشنده (مرحلهٔ ۳) — اختیاری برای سازگاری با mockهای قدیمی */
  sellerType?: "INDIVIDUAL" | "BUSINESS";
  /** v2.0.5 — ویژگی‌های فروش (مرحلهٔ ۴): کانال‌های فروش (حقیقی) */
  sellChannels?: string[];
  /** v2.0.5 — نوع کسب‌وکار (مرحلهٔ ۴، حقوقی) */
  businessKind?: string | null;
  /** v2.0.6 — حضور آنلاین (مرحلهٔ ۵) — اختیاری برای سازگاری با mockهای قدیمی */
  presence?: AdminSellerPresence;
}

export type AdminActionKind =
  | "approve"
  | "reject"
  | "suspend"
  | "unsuspend"
  | "reveal";

export interface AdminActivityEntry {
  id: string;
  actor: string;
  action: AdminActionKind;
  actionLabel: string;
  /** هدف — نام فروشگاه (بدون دادهٔ حساس) */
  target: string;
  /** جزئیات مثل «کد ملی» برای reveal — بدون مقدار کامل */
  detail?: string;
  atMs: number;
  atLabel: string;
}

export const ADMIN_ACTION_LABEL: Record<AdminActionKind, string> = {
  approve: "تأیید درخواست فروشندگی",
  reject: "رد درخواست فروشندگی",
  suspend: "تعلیق اکانت فروشنده",
  unsuspend: "رفع تعلیق اکانت فروشنده",
  reveal: "نمایش دادهٔ حساس",
};

/** draft مرحلهٔ ۵ استور onboarding → ساختار ادمین (لینک‌های canonical) */
export function buildAdminPresence(
  draft: SellerPresenceDraft
): AdminSellerPresence {
  return {
    links: canonicalPresenceLinks(draft).map((l) => ({
      kind: l.kind,
      platform: l.platform,
      value: l.value,
      isPublic: draft.linksPublic,
    })),
    storeAddress: draft.store,
    linksPublic: draft.linksPublic,
  };
}

/** ساخت شیء درخواست کاربر دمو از استور onboarding (mock مشترک) */
export function buildDemoRequest(
  status: SellerStatus,
  application: SellerApplication | null,
  profile: {
    sellerType: "individual" | "business" | null;
    sellChannels: string[];
    businessKind: string | null;
  },
  presence: AdminSellerPresence
): AdminSellerRequest | null {
  if (!application || status === "none") return null;
  if (status === "pending" || status === "approved" || status === "rejected" || status === "suspended") {
    return {
      id: DEMO_SELLER_REQUEST_ID,
      userId: DEMO_USER_ID,
      storeName: application.storeName,
      slug: application.slug,
      mainCategoryLabel: application.mainCategoryLabel,
      nationalId: application.nationalId,
      sheba: application.sheba,
      submittedAtLabel: application.submittedAtLabel ?? "همین حالا",
      submittedAtMs: DEMO_SUBMITTED_MS,
      status,
      rejectionReason: application.rejectionReason,
      suspendedReason: application.suspendedReason,
      isDemoUser: true,
      // v2.0.5 — ویژگی‌های فروش از draft استور (مرحلهٔ ۳ و ۴)
      sellerType: profile.sellerType === "business" ? "BUSINESS" : "INDIVIDUAL",
      sellChannels: profile.sellChannels,
      businessKind: profile.businessKind,
      // v2.0.6 — حضور آنلاین (مرحلهٔ ۵) — فقط وقتی داده‌ای دارد
      presence:
        presence.links.length > 0 || presence.linksPublic
          ? presence
          : undefined,
    };
  }
  return null;
}

/** برچسب ماسک‌شدهٔ یکتا برای نمایش — مقدار کامل هرگز برگردانده نمی‌شود */
export function maskedNidOf(req: AdminSellerRequest): string {
  return maskNationalId(req.nationalId);
}

export function maskedShebaOf(req: AdminSellerRequest): string {
  return maskSheba(req.sheba);
}

/* ── زمان‌های seed (ثابت برای دمو) ── */
const DAY = 86_400_000;
const NOW_BASE = Date.now();
const DEMO_SUBMITTED_MS = NOW_BASE - 2 * 60 * 1000; /* «همین حالا» — جدیدترین */

/* ── فروشنده‌های نمونهٔ دیگر (غیر دمو) — ترکیبی از همهٔ وضعیت‌ها ── */
const SEED_REQUESTS: AdminSellerRequest[] = [
  {
    id: "req-a1",
    userId: "u-a1",
    storeName: "گلخانهٔ مینا",
    slug: "mina-garden",
    mainCategoryLabel: "خانه و آشپزخانه",
    nationalId: "0079345812",
    sheba: "IR120180000000012345678001",
    submittedAtLabel: "۱۴۰۴/۰۵/۲۱ — ۰۹:۱۲",
    submittedAtMs: NOW_BASE - 1 * DAY,
    status: "pending",
    isDemoUser: false,
    // v2.0.5 — ویژگی‌های فروش (مرحلهٔ ۴) — نمونهٔ حقیقی
    sellerType: "INDIVIDUAL",
    sellChannels: ["social", "physical_store"],
    // v2.0.6 — حضور آنلاین (مرحلهٔ ۵) — لینک‌های canonical
    presence: {
      links: [
        { kind: "SOCIAL", platform: "instagram", value: "https://instagram.com/mina.garden", isPublic: false },
        {
          kind: "OTHER_PLATFORM",
          platform: "digikala",
          value: "https://www.digikala.com/seller/mina-garden",
          isPublic: false,
        },
      ],
      linksPublic: false,
    },
  },
  {
    id: "req-a2",
    userId: "u-a2",
    storeName: "بوتیک آوا",
    slug: "ava-boutique",
    mainCategoryLabel: "مد و پوشاک",
    nationalId: "0461287359",
    sheba: "IR300570011180123456789002",
    submittedAtLabel: "۱۴۰۴/۰۵/۲۰ — ۱۸:۴۰",
    submittedAtMs: NOW_BASE - 2 * DAY,
    status: "pending",
    isDemoUser: false,
  },
  {
    id: "req-a3",
    userId: "u-a3",
    storeName: "عطر و نگین",
    slug: "atr-negin",
    mainCategoryLabel: "زیبایی و سلامت",
    nationalId: "0923748516",
    sheba: "IR450120020000034567891003",
    submittedAtLabel: "۱۴۰۴/۰۵/۱۸ — ۱۱:۰۵",
    submittedAtMs: NOW_BASE - 4 * DAY,
    status: "approved",
    isDemoUser: false,
    // v2.0.5 — ویژگی‌های فروش (مرحلهٔ ۴) — نمونهٔ حقیقی
    sellerType: "INDIVIDUAL",
    sellChannels: ["website", "social"],
    // v2.0.6 — حضور آنلاین (مرحلهٔ ۵) — لینک‌های canonical
    presence: {
      links: [
        { kind: "WEBSITE", value: "https://atr-negin.example.com", isPublic: false },
        { kind: "SOCIAL", platform: "instagram", value: "https://instagram.com/atr.o.negin", isPublic: false },
      ],
      linksPublic: false,
    },
  },
  {
    id: "req-a4",
    userId: "u-a4",
    storeName: "کتاب‌سرای نیاکان",
    slug: "niaakan-books",
    mainCategoryLabel: "کتاب و لوازم‌التحریر",
    nationalId: "1589032746",
    sheba: "IR670560030180456789123004",
    submittedAtLabel: "۱۴۰۴/۰۵/۱۷ — ۲۰:۳۳",
    submittedAtMs: NOW_BASE - 5 * DAY,
    status: "rejected",
    rejectionReason: "شماره شبا با نام صاحب حساب همخوانی نداشت.",
    isDemoUser: false,
  },
  {
    id: "req-a5",
    userId: "u-a5",
    storeName: "گجت‌لند",
    slug: "gadgetland",
    mainCategoryLabel: "الکترونیک",
    nationalId: "0347851296",
    sheba: "IR890190000011123456789005",
    submittedAtLabel: "۱۴۰۴/۰۵/۱۶ — ۰۸:۵۵",
    submittedAtMs: NOW_BASE - 6 * DAY,
    status: "pending",
    isDemoUser: false,
    // v2.0.5 — ویژگی‌های فروش (مرحلهٔ ۴) — نمونهٔ حقوقی (نام فروشگاه شرکت‌نما)
    sellerType: "BUSINESS",
    businessKind: "RESELLER",
    sellChannels: ["social", "other_platforms"],
    // v2.0.6 — حضور آنلاین (مرحلهٔ ۵) — لینک‌های canonical (بدون STORE)
    presence: {
      links: [
        { kind: "SOCIAL", platform: "instagram", value: "https://instagram.com/gadgetland", isPublic: false },
        {
          kind: "OTHER_PLATFORM",
          platform: "digikala",
          value: "https://www.digikala.com/seller/gadgetland",
          isPublic: false,
        },
      ],
      linksPublic: false,
    },
  },
  {
    id: "req-a6",
    userId: "u-a6",
    storeName: "ورزش‌خانهٔ البرز",
    slug: "alborz-sport",
    mainCategoryLabel: "ورزش و سفر",
    nationalId: "2214568739",
    sheba: "IR230170000000678912345006",
    submittedAtLabel: "۱۴۰۴/۰۵/۱۴ — ۱۵:۲۰",
    submittedAtMs: NOW_BASE - 8 * DAY,
    status: "suspended",
    suspendedReason: "ارسال‌های تأخیری مکرر و غیرفعال‌کردن پیگیری مرسوله.",
    isDemoUser: false,
  },
  {
    id: "req-a7",
    userId: "u-a7",
    storeName: "دنیای اسباب‌بازی",
    slug: "toy-world",
    mainCategoryLabel: "کودک و نوجوان",
    nationalId: "4178920365",
    sheba: "IR540150000000987654321007",
    submittedAtLabel: "۱۴۰۴/۰۵/۱۲ — ۱۰:۱۰",
    submittedAtMs: NOW_BASE - 10 * DAY,
    status: "approved",
    isDemoUser: false,
  },
];

/* ── گزارش فعالیت seed — هماهنگ با وضعیت‌های seed بالا ── */
const SEED_ACTIVITY: AdminActivityEntry[] = [
  {
    id: "act-seed-2",
    actor: ADMIN_ACTOR,
    action: "reject",
    actionLabel: ADMIN_ACTION_LABEL.reject,
    target: "کتاب‌سرای نیاکان",
    detail: "دلیل: شماره شبا با نام صاحب حساب همخوانی نداشت.",
    atMs: NOW_BASE - 4 * DAY,
    atLabel: "۱۴۰۴/۰۵/۱۸ — ۱۲:۰۲",
  },
  {
    id: "act-seed-1",
    actor: ADMIN_ACTOR,
    action: "approve",
    actionLabel: ADMIN_ACTION_LABEL.approve,
    target: "عطر و نگین",
    atMs: NOW_BASE - 3 * DAY,
    atLabel: "۱۴۰۴/۰۵/۱۹ — ۰۹:۴۵",
  },
];

let activityCounter = 10;

function timeNowLabel(): string {
  /* برچسب سادهٔ دمو — تاریخ واقعی شمسی از jalali.ts در نماهای دیگر
     استفاده می‌شود؛ اینجا برچسب لحظهٔ تصمیم کافی است */
  return "همین حالا";
}

interface AdminState {
  /** فقط فروشنده‌های دیگر — درخواست کاربر دمو از استور onboarding می‌آید */
  requests: AdminSellerRequest[];
  activityLog: AdminActivityEntry[];

  /** تصمیم ادمین — با گارد گذار + ثبت در گزارش فعالیت + اعلان فروشندهٔ دمو */
  decide: (
    id: string,
    action: Exclude<AdminActionKind, "reveal">,
    reason?: string
  ) => { ok: boolean; message?: string };
  /** ثبت «نمایش دادهٔ حساس» — مقدار کامل هرگز در لاگ نمی‌رود */
  logReveal: (target: string, detail: string) => void;
  clearLog: () => void;
}

/** متن اعلان صندوق ورودی فروشندهٔ دمو برای هر عمل */
function notificationFor(
  action: Exclude<AdminActionKind, "reveal">,
  storeName: string,
  reason?: string
): { title: string; body: string } {
  switch (action) {
    case "approve":
      return {
        title: "درخواست فروشندگی تأیید شد ✅",
        body: `فروشگاه «${storeName}» تأیید شد — از همین لحظه می‌توانی شو زمان‌بندی کنی و لیستینگ بسازی.`,
      };
    case "reject":
      return {
        title: "درخواست فروشندگی رد شد",
        body: `دلیل رد: ${reason ?? "—"} — می‌توانی اطلاعات را اصلاح کنی و درخواست را دوباره بفرستی.`,
      };
    case "suspend":
      return {
        title: "اکانت فروشنده تعلیق شد",
        body: `علت تعلیق: ${reason ?? "—"} — برای پیگیری با پشتیبانی در تماس باش.`,
      };
    case "unsuspend":
      return {
        title: "تعلیق فروشنده برداشته شد ✅",
        body: `اکانت فروشندگی «${storeName}» دوباره فعال شد — شو بعدی‌ات را زمان‌بندی کن.`,
      };
  }
}

export const useAdminStore = create<AdminState>((set, get) => ({
  requests: SEED_REQUESTS.map((r) => ({ ...r })),
  activityLog: SEED_ACTIVITY.map((a) => ({ ...a })),

  decide: (id, action, reason) => {
    const atMs = Date.now();
    const atLabel = timeNowLabel();

    /* ── درخواست کاربر دمو → استور onboarding (mock مشترک) + اعلان ── */
    if (id === DEMO_SELLER_REQUEST_ID) {
      const so = useSellerOnboardingStore.getState();
      const target = so.application?.storeName ?? "فروشگاه من";
      const r =
        action === "approve"
          ? so.approve()
          : action === "reject"
            ? so.reject(reason ?? "")
            : action === "suspend"
              ? so.suspend(reason ?? "")
              : so.unsuspend();
      if (!r.ok) return { ok: false, message: r.message };

      const n = notificationFor(action, target, reason);
      const item: AdminInboxItem = {
        kind: "system",
        title: n.title,
        body: n.body,
        atLabel: "همین حالا",
        emoji: "🛡️",
        color: "#6C5CFF",
      };
      /* فقط صف — inbox-store روی mount صفحهٔ فروشگاه یک‌بار مصرف می‌کند
         (push مستقیم + hydrate = اعلان تکراری در نشست نرم) */
      enqueueAdminInboxItem(item);

      const entry: AdminActivityEntry = {
        id: `act-${++activityCounter}`,
        actor: ADMIN_ACTOR,
        action,
        actionLabel: ADMIN_ACTION_LABEL[action],
        target,
        detail:
          action === "reject"
            ? `دلیل: ${reason}`
            : action === "suspend"
              ? `علت: ${reason}`
              : undefined,
        atMs,
        atLabel,
      };
      set((s) => ({ activityLog: [entry, ...s.activityLog].slice(0, 50) }));
      return { ok: true };
    }

    /* ── فروشنده‌های دیگر → همان استور ادمین ── */
    const req = get().requests.find((r) => r.id === id);
    if (!req) return { ok: false, message: "درخواست پیدا نشد" };
    /* نقشهٔ عمل → وضعیت هدف (approve→approved و …) */
    const ACTION_TO_STATUS: Record<
      Exclude<AdminActionKind, "reveal">,
      SellerStatus
    > = {
      approve: "approved",
      reject: "rejected",
      suspend: "suspended",
      unsuspend: "approved",
    };
    const targetStatus: SellerStatus = ACTION_TO_STATUS[action];
    if (!canTransition(req.status, targetStatus)) {
      return {
        ok: false,
        message: `گذار ${req.status} → ${targetStatus} مجاز نیست`,
      };
    }
    set((s) => ({
      requests: s.requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: targetStatus as AdminRequestStatus,
              rejectionReason:
                action === "reject" ? reason?.trim() : r.rejectionReason,
              suspendedReason:
                action === "suspend" ? reason?.trim() : r.suspendedReason,
            }
          : r
      ),
    }));
    const entry: AdminActivityEntry = {
      id: `act-${++activityCounter}`,
      actor: ADMIN_ACTOR,
      action,
      actionLabel: ADMIN_ACTION_LABEL[action],
      target: req.storeName,
      detail:
        action === "reject"
          ? `دلیل: ${reason}`
          : action === "suspend"
            ? `علت: ${reason}`
            : undefined,
      atMs,
      atLabel,
    };
    set((s) => ({ activityLog: [entry, ...s.activityLog].slice(0, 50) }));
    return { ok: true };
  },

  logReveal: (target, detail) => {
    const entry: AdminActivityEntry = {
      id: `act-${++activityCounter}`,
      actor: ADMIN_ACTOR,
      action: "reveal",
      actionLabel: ADMIN_ACTION_LABEL.reveal,
      target,
      detail,
      atMs: Date.now(),
      atLabel: timeNowLabel(),
    };
    set((s) => ({ activityLog: [entry, ...s.activityLog].slice(0, 50) }));
  },

  clearLog: () => set({ activityLog: [] }),
}));

/* ── کلید دموی نقش ادمین (?role=admin) — الگوی useSyncExternalStore ── */

const adminRoleStore = {
  listeners: new Set<() => void>(),
  subscribe(cb: () => void) {
    adminRoleStore.listeners.add(cb);
    return () => adminRoleStore.listeners.delete(cb);
  },
  getSnapshot(): boolean {
    try {
      return new URLSearchParams(window.location.search).get("role") === "admin";
    } catch {
      return false;
    }
  },
  getServerSnapshot(): boolean {
    return false;
  },
};

/** v1.9.1 — نقش ADMIN فقط با کلید دمو ‎?role=admin‎ (mock) */
export function useAdminRole(): boolean {
  return useSyncExternalStore(
    adminRoleStore.subscribe,
    adminRoleStore.getSnapshot,
    adminRoleStore.getServerSnapshot
  );
}
