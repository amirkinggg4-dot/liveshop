"use client";

/* ─────────────────────────────────────────────────────────────
   v1.9.0 — استور تنظیمات حساب (اعلان‌ها + حریم خصوصی)
   مقادیر با try/catch در localStorage ماندگار می‌شوند (الگوی
   جستجوهای اخیر — خرابی storage هیچ‌وقت اپ را نمی‌شکند).
   ───────────────────────────────────────────────────────────── */

import { create } from "zustand";

export interface NotificationPrefs {
  /** به‌روزرسانی سفارش‌ها (ارسال/تحویل/اختلاف) */
  orders: boolean;
  /** شروع لایو فروشنده‌های دنبال‌شده */
  liveStarts: boolean;
  /** کمبود موجودی کالای ذخیره‌شده */
  restock: boolean;
  /** پیام‌های تبلیغاتی و تخفیف‌ها */
  promo: boolean;
}

export interface PrivacyPrefs {
  /** نمایش خریدهای من در فید عمومی (mock) */
  showPurchases: boolean;
}

interface SettingsState {
  notifications: NotificationPrefs;
  privacy: PrivacyPrefs;
  setNotification: (key: keyof NotificationPrefs, value: boolean) => void;
  setPrivacy: (key: keyof PrivacyPrefs, value: boolean) => void;
}

const LS_KEY = "liveshop:settings:v1";

function loadPersisted(): Pick<SettingsState, "notifications" | "privacy"> {
  const fallback: Pick<SettingsState, "notifications" | "privacy"> = {
    notifications: { orders: true, liveStarts: true, restock: true, promo: false },
    privacy: { showPurchases: true },
  };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Pick<SettingsState, "notifications" | "privacy">>;
    return {
      notifications: { ...fallback.notifications, ...(parsed.notifications ?? {}) },
      privacy: { ...fallback.privacy, ...(parsed.privacy ?? {}) },
    };
  } catch {
    return fallback;
  }
}

function persist(s: Pick<SettingsState, "notifications" | "privacy">) {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ notifications: s.notifications, privacy: s.privacy })
    );
  } catch {
    /* storage در دسترس نیست — بی‌خیال */
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadPersisted(),

  setNotification: (key, value) => {
    set((s) => {
      const next = { notifications: { ...s.notifications, [key]: value }, privacy: s.privacy };
      persist(next);
      return next;
    });
  },

  setPrivacy: (key, value) => {
    set((s) => {
      const next = { notifications: s.notifications, privacy: { ...s.privacy, [key]: value } };
      persist(next);
      return next;
    });
  },
}));
