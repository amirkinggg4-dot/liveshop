"use client";

import { useState } from "react";
import { toast } from "sonner";
import { faNum, compactFa, toFa } from "@/lib/format";
import {
  RAID_TARGETS,
  COHOST_CANDIDATES,
  type CohostCandidate,
} from "@/lib/data/raid-p1";
import { useRaidStore } from "@/store/raid-store";
import { Avatar, GradientCover } from "@/components/liveshop/shared";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

/* ═══════════════════════ RaidSheet + CoHostSheet — فاز ۳ (اطلس تصویر ۳۲) ═══════════════════════
   دو شیت ابزار رشد پخش داخل داشبورد زندهٔ فروشنده:
   - RaidSheet: انتخاب شؤ مقصد → تأیید → انتقال بیننده‌ها (پیام سیستمی در چت لایو)
   - CoHostSheet: درخواست کو-هاست ورودی + دعوت داوطلب‌ها + فهرست دعوت‌های فعال */

export function RaidSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const doRaid = useRaidStore((s) => s.doRaid);
  const raidDoneLabel = useRaidStore((s) => s.raidDoneLabel);
  const lastRaidAtLabel = useRaidStore((s) => s.lastRaidAtLabel);

  /* فلوی دومرحله‌ای داخل شیت: فهرست مقصدها → تأیید انتقال */
  const [step, setStep] = useState<"list" | "confirm">("list");
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

  const target = RAID_TARGETS.find((t) => t.showId === selectedShowId) ?? null;

  /* هنگام بستن، فلو به مرحلهٔ اول ریست می‌شود (setState در هندلر — نه در effect) */
  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setStep("list");
      setSelectedShowId(null);
    }
  };

  const confirmRaid = () => {
    if (!target) return;
    const label = doRaid(target.showId, target.viewers);
    toast.success(label);
    handleOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="bg-ls-card border-t border-ls-purple/30 rounded-t-3xl">
        <DrawerHeader className="text-right pb-2">
          <DrawerTitle className="flex items-center gap-2 text-base font-black">
            <span aria-hidden>🚀</span>
            <span>Raid — انتقال بیننده‌ها</span>
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            انتخاب شؤ مقصد و انتقال لحظه‌ای بیننده‌های پخش فعلی
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-1 space-y-3 max-h-[70vh] overflow-y-auto scroll-thin">
          {/* بنر توضیح */}
          <div
            className="rounded-xl border border-ls-purple/30 bg-ls-purple/10 px-3 py-2.5 text-xs leading-5 font-medium text-ls-purple-soft"
            role="note"
          >
            وقتی پخش را تمام می‌کنی، بیننده‌ها همان لحظه به شو مقصد می‌روند
          </div>

          {/* وضعیت آخرین Raid */}
          {raidDoneLabel && (
            <div
              className="flex items-center gap-2 rounded-xl border border-ls-green/30 bg-ls-green/10 px-3 py-2"
              aria-label="وضعیت آخرین Raid انجام‌شده"
            >
              <span aria-hidden>✅</span>
              <span className="text-[11px] font-bold text-ls-green leading-5">
                آخرین Raid: {raidDoneLabel} — ساعت {lastRaidAtLabel ?? "—"}
              </span>
            </div>
          )}

          {step === "list" ? (
            <div className="space-y-2" aria-label="فهرست شوهای مقصد Raid">
              <p className="text-[11px] text-white/50">شوی مقصد را انتخاب کن:</p>
              {RAID_TARGETS.map((t) => (
                <div
                  key={t.showId}
                  className="bg-ls-card border border-white/5 rounded-2xl p-2.5 flex items-center gap-2.5"
                >
                  <GradientCover
                    cover={t.cover}
                    className="w-11 h-11 rounded-xl shrink-0"
                    emojiClassName="text-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white/90 truncate">
                      {t.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/55 truncate">
                      <span aria-hidden>{t.sellerEmoji}</span> {t.sellerName}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded-full bg-ls-card-2 px-2 py-0.5 text-[9px] font-bold text-white/60">
                        {t.category}
                      </span>
                      <span
                        className="rounded-full bg-ls-pink/15 px-2 py-0.5 text-[9px] font-bold text-ls-pink whitespace-nowrap"
                        aria-label={`${toFa(t.viewers)} بینندهٔ زنده در این شو`}
                      >
                        ● {compactFa(t.viewers)} بیننده
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedShowId(t.showId);
                      setStep("confirm");
                    }}
                    aria-label={`انتخاب شو ${t.title} به‌عنوان مقصد Raid`}
                    className="shrink-0 rounded-xl border border-ls-purple/40 bg-ls-purple/10 px-3 py-2 text-[11px] font-bold text-ls-purple-soft hover:bg-ls-purple/20 active:scale-95 transition-all"
                  >
                    انتخاب
                  </button>
                </div>
              ))}
            </div>
          ) : target ? (
            <div className="space-y-3" aria-label="تأیید انتقال بیننده‌ها">
              {/* شمارندهٔ بزرگ بیننده‌های منتقلشونده */}
              <div className="rounded-2xl border border-ls-purple/30 bg-ls-bg/50 p-4 text-center">
                <p
                  className="text-4xl font-black text-ls-purple-soft tabular-nums leading-tight"
                  aria-live="polite"
                  aria-label={`${faNum(target.viewers)} بیننده منتقل می‌شود`}
                >
                  {faNum(target.viewers)}
                </p>
                <p className="mt-1 text-xs font-bold text-white/80">
                  بیننده منتقل می‌شوند به…
                </p>
              </div>

              {/* خلاصهٔ شؤ مقصد */}
              <div className="bg-ls-card border border-white/5 rounded-2xl p-3 flex items-center gap-3">
                <GradientCover
                  cover={target.cover}
                  className="w-14 h-14 rounded-2xl shrink-0"
                  emojiClassName="text-2xl"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white/90 truncate">
                    {target.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/55 truncate">
                    <span aria-hidden>{target.sellerEmoji}</span> {target.sellerName}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-ls-card-2 px-2 py-0.5 text-[9px] font-bold text-white/60">
                    {target.category}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={confirmRaid}
                  aria-label={`انجام Raid به شو ${target.title} با ${faNum(target.viewers)} بیننده`}
                  className="rounded-xl bg-ls-purple py-2.5 text-xs font-extrabold text-white shadow-[0_0_14px_rgba(108,92,255,.4)] hover:bg-ls-purple-deep active:scale-[.99] transition-all"
                >
                  انجامش بده 🚀
                </button>
                <button
                  onClick={() => {
                    setStep("list");
                    setSelectedShowId(null);
                  }}
                  aria-label="بازگشت به فهرست شوهای مقصد"
                  className="rounded-xl border border-white/10 bg-ls-card-2 py-2.5 text-xs font-bold text-white/70 hover:bg-ls-line active:scale-[.99] transition-all"
                >
                  بازگشت
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function CoHostSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const invites = useRaidStore((s) => s.invites);
  const incomingInvite = useRaidStore((s) => s.incomingInvite);
  const sendInvite = useRaidStore((s) => s.sendInvite);
  const acceptIncoming = useRaidStore((s) => s.acceptIncoming);
  const declineIncoming = useRaidStore((s) => s.declineIncoming);

  const onAccept = () => {
    if (!incomingInvite) return;
    acceptIncoming();
    toast.success(`🤝 کو-هاست با ${incomingInvite.sellerName} فعال شد`);
  };

  const onDecline = () => {
    if (!incomingInvite) return;
    declineIncoming();
    toast(`درخواست کو-هاست از ${incomingInvite.sellerName} رد شد`);
  };

  const onInvite = (c: CohostCandidate) => {
    const label = sendInvite(c.sellerId);
    toast.success(label);
  };

  /* دعوت‌های فعال — در انتظار پاسخ یا پذیرش‌شده */
  const activeInvites = COHOST_CANDIDATES.filter((c) => invites[c.sellerId]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-ls-card border-t border-ls-green/30 rounded-t-3xl">
        <DrawerHeader className="text-right pb-2">
          <DrawerTitle className="flex items-center gap-2 text-base font-black">
            <span aria-hidden>🤝</span>
            <span>پخش مشترک (Co-host)</span>
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            مدیریت درخواست ورودی کو-هاست و دعوت فروشنده‌های داوطلب
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-1 space-y-3 max-h-[70vh] overflow-y-auto scroll-thin">
          {/* بنر توضیح */}
          <div
            className="rounded-xl border border-ls-green/30 bg-ls-green/10 px-3 py-2.5 text-xs leading-5 font-medium text-ls-green"
            role="note"
          >
            یک فروشندهٔ دیگر هم‌زمان با تو دوربین روشن می‌کند — دو صدا، یک لایو
          </div>

          {/* کارت درخواست ورودی */}
          {incomingInvite && (
            <div
              className="rounded-2xl border border-ls-green/40 bg-ls-green/5 p-3 space-y-2.5"
              aria-label="درخواست کو-هاست دریافتی"
            >
              <div className="flex items-center gap-2.5">
                <Avatar
                  emoji={incomingInvite.sellerEmoji}
                  color={incomingInvite.sellerColor}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white/90 leading-5">
                    درخواست کو-هاست از {incomingInvite.sellerName}
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/55 truncate">
                    برای شو «{incomingInvite.showTitle}»
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onAccept}
                  aria-label={`پذیرش درخواست کو-هاست از ${incomingInvite.sellerName}`}
                  className="rounded-xl bg-ls-green py-2 text-xs font-extrabold text-[#04281e] hover:brightness-110 active:scale-[.99] transition-all"
                >
                  پذیرش
                </button>
                <button
                  onClick={onDecline}
                  aria-label={`رد درخواست کو-هاست از ${incomingInvite.sellerName}`}
                  className="rounded-xl border border-white/10 py-2 text-xs font-bold text-white/60 hover:bg-white/5 active:scale-[.99] transition-all"
                >
                  رد
                </button>
              </div>
            </div>
          )}

          {/* داوطلب‌های کو-هاست */}
          <p className="text-[11px] text-white/50">فروشنده‌های آمادهٔ هم‌پخشی:</p>
          <div
            className="space-y-2 max-h-72 overflow-y-auto scroll-thin"
            aria-label="فهرست فروشنده‌های آمادهٔ کو-هاست"
          >
            {COHOST_CANDIDATES.map((c) => {
              const st = invites[c.sellerId];
              return (
                <div
                  key={c.sellerId}
                  className="bg-ls-card border border-white/5 rounded-2xl p-2.5 flex items-center gap-2.5"
                >
                  <Avatar emoji={c.emoji} color={c.color} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white/90 truncate">
                      {c.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/50">
                      <span dir="ltr" className="truncate">
                        @{c.handle}
                      </span>
                      <span aria-hidden>·</span>
                      <span
                        className="whitespace-nowrap"
                        aria-label={`${compactFa(c.followers)} دنبال‌کننده`}
                      >
                        {compactFa(c.followers)} دنبال‌کننده
                      </span>
                    </div>
                    <span className="mt-1 inline-block rounded-full bg-ls-card-2 px-2 py-0.5 text-[9px] font-bold text-white/60">
                      {c.categoryLabel}
                    </span>
                  </div>
                  {st === "sent" ? (
                    <span
                      className="shrink-0 rounded-full bg-ls-purple/15 px-2.5 py-1 text-[10px] font-bold text-ls-purple-soft whitespace-nowrap"
                      aria-label={`دعوت کو-هاست برای ${c.name} ارسال شد`}
                    >
                      ارسال شد ✓
                    </span>
                  ) : st === "accepted" ? (
                    <span
                      className="shrink-0 rounded-full bg-ls-green/15 px-2.5 py-1 text-[10px] font-bold text-ls-green whitespace-nowrap"
                      aria-label={`کو-هاست با ${c.name} فعال شد`}
                    >
                      پذیرش شد ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => onInvite(c)}
                      aria-label={`دعوت ${c.name} به پخش مشترک`}
                      className="shrink-0 rounded-xl border border-ls-purple/40 bg-ls-purple/10 px-3 py-1.5 text-[11px] font-bold text-ls-purple-soft hover:bg-ls-purple/20 active:scale-95 transition-all"
                    >
                      دعوت
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* فهرست دعوت‌های فعال — در انتظار پاسخ / پذیرش‌شده */}
          {activeInvites.length > 0 && (
            <div
              className="rounded-2xl border border-white/5 bg-ls-bg/40 p-3 space-y-2"
              aria-label="فهرست دعوت‌های فعال کو-هاست"
            >
              <p className="text-[11px] font-bold text-white/70">دعوت‌های فعال</p>
              {activeInvites.map((c) => {
                const st = invites[c.sellerId];
                return (
                  <div
                    key={c.sellerId}
                    className="flex items-center gap-2 text-[11px]"
                  >
                    <span aria-hidden>{c.emoji}</span>
                    <span className="font-bold text-white/80 truncate">
                      {c.name}
                    </span>
                    <span className="ms-auto whitespace-nowrap">
                      {st === "accepted" ? (
                        <span className="rounded-full bg-ls-green/15 px-2 py-0.5 text-[9px] font-bold text-ls-green">
                          پذیرش شد ✓ — کو-هاست فعال
                        </span>
                      ) : (
                        <span className="rounded-full bg-ls-purple/15 px-2 py-0.5 text-[9px] font-bold text-ls-purple-soft">
                          در انتظار پاسخ…
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
