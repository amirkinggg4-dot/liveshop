"use client";

import { create } from "zustand";
import type { InboxNotification } from "@/lib/data/buyer-p1";
import { INBOX_NOTIFICATIONS } from "@/lib/data/buyer-p1";

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
}));
