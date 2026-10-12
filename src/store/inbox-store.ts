"use client";

import { create } from "zustand";
import type { InboxNotification } from "@/lib/data/buyer-p1";
import { INBOX_NOTIFICATIONS } from "@/lib/data/buyer-p1";
import { drainAdminInboxQueue } from "@/store/admin-store";

/* ─────────────────────────────────────────────────────────────
   استور صندوق ورودی — فاز ۳ (تصویر ۲۰)
   اعلان‌های خریدار (مزایده/برداشت/پرداخت/ارسال/فالو/انعام/سیستم)
   با خواندن تک‌تک و خواندن همه + شمارندهٔ ناخوانده‌ها (سلکتور).
   ───────────────────────────────────────────────────────────── */

interface InboxState {
  notifications: InboxNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** v1.7.0 — افزودن اعلان (مثل پیام لغو شو به فالوورها) */
  pushNotification: (n: Omit<InboxNotification, "id" | "unread">) => void;
  /** حذف اعلان — فیلتر immutable از آرایه (با تأیید AlertDialog در UI) */
  deleteNotification: (id: string) => void;
  /** v1.9.1 — اعلان‌های تصمیم ادمین (صف sessionStorage) را یک‌باره به صندوق می‌آورد */
  hydrateAdminNotifications: () => number;
}

/* ── seed (کپی مستقل از دیتای static) ── */
const SEED_NOTIFICATIONS: InboxNotification[] = INBOX_NOTIFICATIONS.map((n) => ({
  ...n,
}));

/** سلکتور آماده — تعداد اعلان‌های ناخوانده */
export function selectUnreadCount(state: InboxState): number {
  return state.notifications.reduce(
    (acc, n) => acc + (n.unread ? 1 : 0),
    0
  );
}

let inboxCounter = 100;

export const useInboxStore = create<InboxState>((set) => ({
  notifications: SEED_NOTIFICATIONS,

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, unread: false } : n
      ),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, unread: false })),
    })),

  pushNotification: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: `nb-${++inboxCounter}`, unread: true },
        ...s.notifications,
      ],
    })),

  deleteNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  /* v1.9.1 — اعلان‌های تصمیم ادمین که در /admin ثبت شده‌اند؛ روی mount
     یک‌بار مصرف می‌شود تا حتی با بارگذاری کامل صفحه از دست نرود.
     روی mount صدا زده می‌شود (نه در سازنده) تا SSR/هیدریشن سالم بماند. */
  hydrateAdminNotifications: () => {
    const items = drainAdminInboxQueue();
    if (items.length === 0) return 0;
    const mapped: InboxNotification[] = items.map((it, i) => ({
      id: `nb-admin-${++inboxCounter}-${i}`,
      kind: it.kind,
      title: it.title,
      body: it.body,
      atLabel: it.atLabel,
      unread: true,
      emoji: it.emoji,
      color: it.color,
    }));
    set((s) => ({ notifications: [...mapped, ...s.notifications] }));
    return mapped.length;
  },
}));
