"use client";

import { create } from "zustand";
import { useLiveStore } from "./live-store";
import { RAID_TARGETS, COHOST_CANDIDATES } from "@/lib/data/raid-p1";

/* ─────────────────────────────────────────────────────────────
   استور Raid و کو-هاست — فاز ۳ (اطلس تصویر ۳۲)
   - doRaid: مقصد Raid را ثبت + پیام سیستمی بدرقه در چت لایو می‌گذارد
   - sendInvite: دعوت کو-هاست برای فروشندهٔ داوطلب
   - acceptIncoming / declineIncoming: پاسخ به درخواست کو-هاست ورودی
   ───────────────────────────────────────────────────────────── */

export interface IncomingInvite {
  sellerId: string;
  sellerName: string;
  sellerEmoji: string;
  sellerColor: string;
  showTitle: string;
}

export type InviteStatus = "sent" | "accepted";

interface RaidState {
  /** شؤ مقصد آخرین Raid انجام‌شده */
  raidTargetShowId: string | null;
  /** برچسب پیام موفقیت Raid برای toast/چیپ وضعیت */
  raidDoneLabel: string | null;
  /** وضعیت دعوت‌های کو-هاست به تفکیک sellerId */
  invites: Record<string, InviteStatus>;
  /** درخواست کو-هاست ورودی (دمو: یک seed اولیه) */
  incomingInvite: IncomingInvite | null;
  /** برچسب ساعت فارسی آخرین Raid */
  lastRaidAtLabel: string | null;

  /** انجام Raid — برچسب پیام موفقیت را برمی‌گرداند (برای toast) */
  doRaid: (targetShowId: string, viewersCount: number) => string;
  /** ارسال دعوت کو-هاست — برچسب toast را برمی‌گرداند */
  sendInvite: (sellerId: string) => string;
  acceptIncoming: () => void;
  declineIncoming: () => void;
}

/** برچسب زمان فارسی HH:MM (کپی الگوی nowLabel در seller-store/live-store) */
function nowLabel(): string {
  const d = new Date();
  const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const two = (n: number) => `${fa[Math.floor(n / 10)]}${fa[n % 10]}`;
  return `${two(d.getHours())}:${two(d.getMinutes())}`;
}

/* ── seedها ── */

/* دعوت ارسال‌شدهٔ اولیه — از داوطلبِ seeded با status «invited» در دیتا (s3) */
function seedInvites(): Record<string, InviteStatus> {
  const inv: Record<string, InviteStatus> = {};
  const seeded = COHOST_CANDIDATES.find((c) => c.status === "invited");
  if (seeded) inv[seeded.sellerId] = "sent";
  return inv;
}

/* درخواست ورودی دمویی — از گجت‌بازار برای شؤ فعلی فروشنده (sh1) */
const incomingSeedCandidate =
  COHOST_CANDIDATES.find((c) => c.sellerId === "s4") ?? COHOST_CANDIDATES[0];

const SEED_INCOMING: IncomingInvite = {
  sellerId: incomingSeedCandidate.sellerId,
  sellerName: incomingSeedCandidate.name,
  sellerEmoji: incomingSeedCandidate.emoji,
  sellerColor: incomingSeedCandidate.color,
  showTitle: RAID_TARGETS[0].title,
};

export const useRaidStore = create<RaidState>((set, get) => ({
  raidTargetShowId: null,
  raidDoneLabel: null,
  invites: seedInvites(),
  incomingInvite: { ...SEED_INCOMING },
  lastRaidAtLabel: null,

  doRaid: (targetShowId, viewersCount) => {
    const target = RAID_TARGETS.find((t) => t.showId === targetShowId);
    const title = target?.title ?? "شو مقصد";
    /* viewersCount در جمع‌بندی تحلیلی Raid استفاده می‌شود (دمو: فقط برچسب) */
    void viewersCount;
    const label = `🚀 Raid به «${title}»`;
    set({
      raidTargetShowId: targetShowId,
      raidDoneLabel: label,
      lastRaidAtLabel: nowLabel(),
    });
    useLiveStore.getState().pushChat({
      author: "Raid",
      text: `🚀 بیننده‌ها به شو «${title}» منتقل شدند — بدرقهٔ گرم!`,
      kind: "system",
      emoji: "🚀",
      color: "#6C5CFF",
    });
    return label;
  },

  sendInvite: (sellerId) => {
    const candidate = COHOST_CANDIDATES.find((c) => c.sellerId === sellerId);
    set((s) => ({ invites: { ...s.invites, [sellerId]: "sent" } }));
    return candidate
      ? `دعوت کو-هاست برای ${candidate.name} ارسال شد ✓`
      : "دعوت کو-هاست ارسال شد ✓";
  },

  acceptIncoming: () => {
    const inc = get().incomingInvite;
    if (!inc) return;
    set((s) => ({
      incomingInvite: null,
      invites: { ...s.invites, [inc.sellerId]: "accepted" },
    }));
    useLiveStore.getState().pushChat({
      author: "کو-هاست",
      text: `🤝 کو-هاست با ${inc.sellerName} شروع شد — دو صدا، یک شو!`,
      kind: "system",
      emoji: "🤝",
      color: "#00C896",
    });
  },

  declineIncoming: () => set({ incomingInvite: null }),
}));
