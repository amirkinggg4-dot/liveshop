"use client";

import { toast } from "sonner";
import { useLiveStore } from "@/store/live-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { faNum } from "@/lib/format";
import Confetti from "@/components/liveshop/confetti";

/* ═══════════════════════ GiveawayModal — قرعه‌کشی زنده ═══════════════════════
   باز با شرط giveaway.phase !== 'idle'. بستن فقط UI است (dismissed) —
   store در phase 'won' می‌ماند و با گیواوی بعدی، LiveView دوباره بازش می‌کند. */

export default function GiveawayModal({
  dismissed,
  onDismiss,
}: {
  dismissed: boolean;
  onDismiss: () => void;
}) {
  const giveaway = useLiveStore((s) => s.giveaway);
  const open = giveaway.phase !== "idle" && !dismissed;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onDismiss();
      }}
    >
      <DialogContent
        className="bg-ls-card border border-ls-purple/30 rounded-2xl sm:max-w-sm"
        showCloseButton={false}
      >
        {giveaway.phase === "countdown" ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <div
              className="w-28 h-28 rounded-full border-4 border-ls-purple/50 bg-ls-purple/10 flex items-center justify-center animate-ls-pulse shadow-[0_0_30px_rgba(108,92,255,.35)]"
              role="timer"
              aria-label={`اعلام برنده تا ${faNum(giveaway.secondsLeft)} ثانیهٔ دیگر`}
            >
              <span className="text-4xl font-black text-ls-purple-soft tabular-nums">
                {faNum(giveaway.secondsLeft)}
              </span>
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-base font-extrabold">
                در حال قرعه‌کشی زنده…
              </DialogTitle>
              <DialogDescription className="text-xs text-white/50">
                برنده بین بینندگان حاضر در لایو انتخاب می‌شود
              </DialogDescription>
            </div>
            <span className="text-2xl animate-ls-float" aria-hidden>
              🎁
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-1 text-center">
            <Confetti />
            <span className="text-6xl animate-ls-float" aria-hidden>
              🏆
            </span>
            <DialogTitle className="text-lg font-extrabold">
              برندهٔ گیواوی!
            </DialogTitle>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold"
              style={{
                backgroundColor: `${giveaway.winnerColor}26`,
                color: giveaway.winnerColor,
                boxShadow: `inset 0 0 0 1.5px ${giveaway.winnerColor}59`,
              }}
            >
              <span aria-hidden>{giveaway.winnerEmoji}</span>
              {giveaway.winnerLabel}
            </span>
            <DialogDescription className="text-xs text-white/50">
              جایزه به پروفایل برنده اضافه شد (دمو)
            </DialogDescription>
            <button
              onClick={() => {
                onDismiss();
                toast("برندهٔ بعدی می‌تونی باشی 🍀");
              }}
              className="mt-1 w-full rounded-xl bg-ls-purple py-2.5 text-sm font-bold text-white shadow-[0_0_14px_rgba(108,92,255,.35)] hover:bg-ls-purple-deep active:scale-[.98] transition-all"
              aria-label="بستن اعلان گیواوی"
            >
              عالیه!
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
