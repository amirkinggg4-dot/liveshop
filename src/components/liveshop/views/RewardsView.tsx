"use client";

import { cn } from "@/lib/utils";
import { faNum } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import { useRewardsStore } from "@/store/rewards-store";
import {
  REWARDS_PROFILE,
  REWARD_TIERS,
  REWARD_BADGES,
  REWARD_TASKS,
  type RewardTask,
} from "@/lib/data/rewards-p1";
import { PageHeader, SectionTitle } from "@/components/liveshop/shared";
import { Check, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

/* ═══════════════ باشگاه ریواردز — فاز ۳ (تصاویر Atlas ۳۳+۲۱) ═══════════════ */

export default function RewardsView() {
  const back = useAppStore((s) => s.back);
  const points = useRewardsStore((s) => s.points);
  const streakWeeks = useRewardsStore((s) => s.streakWeeks);
  const claimedIds = useRewardsStore((s) => s.claimedIds);
  const claimTask = useRewardsStore((s) => s.claimTask);

  /* سطح فعلی و سطح بعدی بر اساس امتیاز زنده */
  const currentTier =
    [...REWARD_TIERS].reverse().find((t) => points >= t.min) ?? REWARD_TIERS[0];
  const nextTier = REWARD_TIERS.find((t) => t.min > points) ?? null;

  const tierPct = nextTier
    ? Math.min(
        100,
        Math.max(
          0,
          ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100
        )
      )
    : 100;

  const onClaim = (task: RewardTask) => {
    const res = claimTask(task.id);
    if (res.ok && res.points != null) {
      toast.success(`+${faNum(res.points)} امتیاز گرفتی!`);
    } else {
      toast.error("این مأموریت قبلاً دریافت شده");
    }
  };

  return (
    <div className="flex-1 flex flex-col" aria-label="باشگاه ریواردز">
      <PageHeader title="باشگاه ریواردز" onBack={back} />

      <div className="px-4 py-4 space-y-5">
        {/* ── کارت قهرمان: امتیاز، سطح، استریک ── */}
        <div className="rounded-2xl border border-ls-purple/30 bg-gradient-to-l from-ls-purple/25 to-ls-pink/25 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-white/60 font-bold">
                امتیاز باشگاه تو
              </p>
              <p
                className="mt-1 text-4xl font-black tabular-nums leading-none text-white drop-shadow-[0_2px_10px_rgba(108,92,255,.5)]"
                aria-label={`امتیاز فعلی: ${faNum(points)}`}
              >
                {faNum(points)}
                <span className="ms-2 text-sm font-bold text-white/70">
                  امتیاز
                </span>
              </p>
            </div>
            <span
              className="shrink-0 inline-flex items-center gap-1 rounded-full bg-ls-purple px-3 py-1.5 text-xs font-extrabold text-white shadow-[0_0_14px_rgba(108,92,255,.45)]"
              aria-label={`سطح فعلی: ${currentTier.label}`}
            >
              🏅 سطح {currentTier.label}
            </span>
          </div>

          {/* نوار پیشرفت تا سطح بعدی */}
          <div>
            <div
              className="h-2 rounded-full bg-white/10 overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(tierPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={
                nextTier
                  ? `پیشرفت تا سطح ${nextTier.label}`
                  : "بالاترین سطح باشگاه"
              }
            >
              <div
                className="h-full rounded-full bg-gradient-to-l from-ls-purple to-ls-pink transition-[width] duration-500"
                style={{ width: `${tierPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-white/60">
              {nextTier
                ? `${faNum(nextTier.min - points)} امتیاز تا سطح ${nextTier.label} ✨`
                : "بالاترین سطح باشگاه — الماسی 👑"}
            </p>
          </div>

          {/* استریک + تماشای شوها */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-black/30 border border-white/10 px-3 py-1.5 text-xs font-bold"
              aria-label={`استریک ${faNum(streakWeeks)} هفته‌ای`}
            >
              🔥 استریک {faNum(streakWeeks)} هفته‌ای
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-black/30 border border-white/10 px-3 py-1.5 text-xs font-bold text-white/80"
              aria-label={`${faNum(REWARDS_PROFILE.watchedShows)} شو دیده‌شده`}
            >
              👁 {faNum(REWARDS_PROFILE.watchedShows)} شو دیده‌شده
            </span>
          </div>
        </div>

        {/* ── مأموریت‌ها ── */}
        <section aria-label="مأموریت‌های امتیازی">
          <SectionTitle
            title="مأموریت‌ها"
            icon="🎯"
            action={
              <span className="text-[11px] text-white/45">
                {faNum(claimedIds.length)} از {faNum(REWARD_TASKS.length)} تکمیل
                شد
              </span>
            }
          />
          <div className="rounded-2xl bg-ls-card border border-white/5 divide-y divide-white/5 max-h-96 overflow-y-auto scroll-thin">
            {REWARD_TASKS.map((task) => {
              const claimed = claimedIds.includes(task.id);
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-4"
                  aria-label={`مأموریت: ${task.title}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold leading-5 truncate">
                      {task.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/45 leading-4 line-clamp-2">
                      {task.desc}
                    </p>
                    {task.progressLabel && (
                      <p className="mt-1 text-[10px] font-bold text-white/40">
                        {task.progressLabel}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span
                      className="inline-flex items-center rounded-full bg-ls-purple/20 border border-ls-purple/40 px-2.5 py-0.5 text-[11px] font-extrabold text-ls-purple-soft"
                      aria-label={`${faNum(task.points)} امتیاز`}
                    >
                      +{faNum(task.points)} امتیاز
                    </span>
                    {claimed ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-ls-green/30 px-2.5 py-1 text-[11px] font-bold text-ls-green"
                        aria-label="امتیاز این مأموریت دریافت شد"
                      >
                        دریافت شد ✓
                      </span>
                    ) : task.ready ? (
                      <button
                        onClick={() => onClaim(task)}
                        aria-label={`دریافت ${faNum(task.points)} امتیاز برای مأموریت ${task.title}`}
                        className="rounded-xl bg-ls-green px-3.5 py-2 text-xs font-black text-[#04281e] shadow-[0_4px_14px_rgba(0,200,150,.3)] transition-transform active:scale-95 hover:brightness-110"
                      >
                        دریافت امتیاز
                      </button>
                    ) : (
                      <span
                        className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/40"
                        aria-label="در جریان"
                      >
                        در جریان…
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── نشان‌ها ── */}
        <section aria-label="نشان‌های باشگاه">
          <SectionTitle title="نشان‌ها" icon="🎖" />
          <div className="grid grid-cols-4 gap-2">
            {REWARD_BADGES.map((b) =>
              b.earned ? (
                <div
                  key={b.id}
                  className="rounded-2xl bg-ls-card border border-ls-purple/25 p-3 text-center space-y-1.5"
                  title={b.earnedAtLabel}
                  aria-label={`نشان کسب‌شده: ${b.label} — ${b.earnedAtLabel}`}
                >
                  <span className="block text-3xl leading-none" aria-hidden>
                    {b.emoji}
                  </span>
                  <p className="text-[10px] font-bold text-white/85 leading-4 line-clamp-2">
                    {b.label}
                  </p>
                </div>
              ) : (
                <div
                  key={b.id}
                  className="rounded-2xl bg-ls-card border border-white/5 p-3 text-center space-y-1.5 grayscale opacity-50"
                  title={b.howToEarn}
                  aria-label={`نشان قفل: ${b.label} — ${b.howToEarn}`}
                >
                  <span className="relative block text-3xl leading-none" aria-hidden>
                    {b.emoji}
                    <span
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center"
                      title={b.howToEarn}
                      aria-label="قفل است"
                    >
                      <Lock className="w-3 h-3 text-white/70 fill-white/30" aria-hidden />
                    </span>
                  </span>
                  <p className="text-[10px] font-bold text-white/60 leading-4 line-clamp-2">
                    {b.label}
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* ── مزایای سطح فعلی ── */}
        <section aria-label="مزایای سطح فعلی">
          <SectionTitle title="مزایای سطح فعلی" icon="💠" />
          <div className="rounded-2xl bg-ls-card border border-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-extrabold"
                aria-label={`سطح ${currentTier.label}`}
              >
                سطح {currentTier.label}
              </span>
              <span
                className="text-[11px] text-white/45"
                aria-label={`از ${faNum(currentTier.min)} امتیاز شروع می‌شود`}
              >
                از {faNum(currentTier.min)} امتیاز
              </span>
            </div>
            <ul className="space-y-2.5">
              {currentTier.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2.5 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-ls-green/15 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-ls-green" aria-hidden />
                  </span>
                  <span className="text-white/85 font-medium">{perk}</span>
                </li>
              ))}
            </ul>
            {nextTier && (
              <div
                className={cn(
                  "rounded-xl border border-ls-purple/25 bg-ls-purple/10 px-3 py-2.5 flex items-start gap-2"
                )}
              >
                <Sparkles
                  className="w-4 h-4 shrink-0 mt-0.5 text-ls-purple-soft"
                  aria-hidden
                />
                <p className="text-[11px] leading-5 text-white/70">
                  با {faNum(nextTier.min - points)} امتیاز دیگر به سطح{" "}
                  <span className="font-extrabold text-ls-purple-soft">
                    {nextTier.label}
                  </span>{" "}
                  می‌رسی: {nextTier.perks.slice(0, 2).join(" و ")}.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
