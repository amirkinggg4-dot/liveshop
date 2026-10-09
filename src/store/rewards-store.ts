"use client";

import { create } from "zustand";
import { REWARDS_PROFILE, REWARD_TASKS } from "@/lib/data/rewards-p1";

/* ─────────────────────────────────────────────────────────────
   استور باشگاه ریواردز — فاز ۳ (P1)
   امتیاز و استریک از seed شروع می‌شوند؛ claimTask مأموریت را
   می‌بندد، امتیاز اضافه می‌کند و نتیجه را برای toast برمی‌گرداند.
   ───────────────────────────────────────────────────────────── */

interface RewardsState {
  points: number;
  streakWeeks: number;
  /** شناسهٔ مأموریت‌های دریافت‌شده */
  claimedIds: string[];
  /** در صورت تکراری بودن {ok:false}؛ در موفقیت امتیاز اضافه و برگردانده می‌شود */
  claimTask: (id: string) => { ok: boolean; points?: number };
}

const SEED_CLAIMED = REWARD_TASKS.filter((t) => t.claimed).map((t) => t.id);

export const useRewardsStore = create<RewardsState>((set, get) => ({
  points: REWARDS_PROFILE.points,
  streakWeeks: REWARDS_PROFILE.streakWeeks,
  claimedIds: SEED_CLAIMED,

  claimTask: (id) => {
    const { claimedIds } = get();
    if (claimedIds.includes(id)) return { ok: false };
    const task = REWARD_TASKS.find((t) => t.id === id);
    if (!task) return { ok: false };
    set((s) => ({
      points: s.points + task.points,
      claimedIds: [...s.claimedIds, id],
    }));
    return { ok: true, points: task.points };
  },
}));
