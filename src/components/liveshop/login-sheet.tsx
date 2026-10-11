"use client";

/* ─────────────────────────────────────────────────────────────
   v1.9.0 — شیت ورود با پیامک (OTP)
   گام ۱: شمارهٔ موبایل ایرانی (اعتبارسنجی ۰۹xxxxxxxxx / ‎+989… با
   نرمال‌سازی ارقام فارسی) → گام ۲: کد ۶ رقمی با ورودی جدا برای هر رقم،
   پرش خودکار، paste، شمارش معکوس ۲ دقیقه‌ای و «ارسال دوباره».
   خطاها به فارسی از ماشین وضعیت otp-state (کد اشتباه / تلاش بیش از حد /
   محدودیت درخواست / کد منقضی / قفل). در حالت mock کد دمو با برچسب
   «کد دمو» نمایش داده می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquareText, PencilLine, ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";
import { OTP_ERROR_MESSAGE } from "@/lib/otp-state";
import { validatePhoneFa } from "@/lib/account-validate";
import { useAuth } from "@/store/auth-store";

/** تیک ثانیه‌ای فقط وقتی فعال باشد (برای شمارش‌های معکوس) —
 *  با فعال‌شدن، زمان جاری هم resync می‌شود (ناهمزمان — بدون setState همگام در effect) */
function useNowTick(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const sync = () => setNow(Date.now());
    const r = setTimeout(sync, 0);
    const t = setInterval(sync, 1000);
    return () => {
      clearTimeout(r);
      clearInterval(t);
    };
  }, [active]);
  return now;
}

/* ── شش ورودی جدا برای ارقام کد ── */
function CodeInputs({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (code: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (!clean && v !== "") return;
    setDigits((prev) => {
      const next = [...prev];
      if (clean.length > 1) {
        /* paste کل کد در هر خانه */
        const chars = clean.slice(0, 6).split("");
        for (let k = 0; k < 6; k++) next[k] = chars[k] ?? "";
        const full = next.join("");
        if (full.length === 6 && !full.includes("")) setTimeout(() => onSubmit(full), 0);
        return next;
      }
      next[i] = clean;
      if (clean && i < 5) refs.current[i + 1]?.focus();
      const full = next.join("");
      if (full.length === 6 && !next.some((d) => d === "")) setTimeout(() => onSubmit(full), 0);
      return next;
    });
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
      setDigits((prev) => {
        const next = [...prev];
        next[i - 1] = "";
        return next;
      });
    }
  };

  return (
    <div dir="ltr" className="flex items-center justify-center gap-2" role="group" aria-label="کد ۶ رقمی پیامک‌شده">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={6}
          disabled={disabled}
          aria-label={`رقم ${toFa(i + 1)} کد`}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          className={cn(
            "h-13 w-11 rounded-xl border bg-ls-card-2 text-center text-lg font-black tabular-nums outline-none transition-colors",
            "border-white/10 focus:border-ls-purple/70 disabled:opacity-40",
            "min-h-[52px]"
          )}
        />
      ))}
    </div>
  );
}

export default function LoginSheet() {
  const auth = useAuth();
  const { otp, sheetOpen, demoCode } = auth;
  const [phoneRaw, setPhoneRaw] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const locked = otp.phase === "locked" || ((otp.lockedUntilMs ?? 0) > 0 && Date.now() < (otp.lockedUntilMs ?? 0));
  const now = useNowTick(sheetOpen && (otp.phase === "sent" || locked));

  /* زمان‌های مشتق — با تیک ۱ ثانیه‌ای بازمحاسبه می‌شوند */
  const codeSecondsLeft = Math.max(0, Math.ceil(((otp.codeExpiresAtMs ?? 0) - now) / 1000));
  const resendSecondsLeft = Math.max(0, Math.ceil(((otp.resendAvailableAtMs ?? 0) - now) / 1000));
  const lockedSecondsLeft = Math.max(0, Math.ceil(((otp.lockedUntilMs ?? 0) - now) / 1000));

  const onGetCode = () => {
    setPhoneError(null);
    setSubmitting(true);
    const r = auth.requestOtp(phoneRaw);
    setSubmitting(false);
    if (!r.ok && r.message) setPhoneError(r.message);
  };

  const onVerify = (code: string) => {
    const r = auth.verifyOtp(code);
    if (!r.ok && r.message) {
      toast.error(r.message);
      setDigitsClear();
    }
  };

  const setDigitsClear = () => {
    /* پاک‌کردن ورودی‌ها بعد از خطا — با remount از طریق key در فراخوانی */
    setResetKey((k) => k + 1);
  };
  const [resetKey, setResetKey] = useState(0);

  const isCodeStep = otp.phase === "sent" || otp.phase === "locked";

  return (
    <Sheet open={sheetOpen} onOpenChange={(o) => (o ? auth.openLoginSheet() : auth.closeLoginSheet())}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-white/10 bg-ls-bg px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-2 sm:max-w-md sm:mx-auto"
        dir="rtl"
      >
        <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-white/15" aria-hidden />
        <SheetHeader className="space-y-1 p-0 text-right">
          <SheetTitle className="flex items-center gap-2 text-base font-black">
            <ShieldCheck className="h-5 w-5 text-ls-green" aria-hidden />
            {isCodeStep ? "کد تأیید را وارد کن" : "ورود به LiveShop"}
          </SheetTitle>
          <SheetDescription className="text-xs leading-5 text-white/55">
            {isCodeStep
              ? `کد ۶ رقمی به ${toFa(otp.phone)} پیامک شد.`
              : "با شمارهٔ موبایل وارد شو؛ خرید امانی و کیف پول مال همین شماره است."}
          </SheetDescription>
        </SheetHeader>

        {!isCodeStep ? (
          /* ── گام ۱: شمارهٔ موبایل ── */
          <div className="mt-4 space-y-3">
            <div dir="ltr">
              <input
                value={phoneRaw}
                onChange={(e) => setPhoneRaw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onGetCode()}
                inputMode="tel"
                placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                aria-label="شمارهٔ موبایل"
                className={cn(
                  "h-12 w-full rounded-xl border bg-ls-card-2 px-3 text-center text-base font-bold tracking-widest outline-none transition-colors",
                  phoneError ? "border-red-400/60" : "border-white/10 focus:border-ls-purple/70"
                )}
              />
            </div>
            {phoneError && (
              <p role="alert" className="text-xs font-bold text-red-400">
                {phoneError}
              </p>
            )}
            <Button
              onClick={onGetCode}
              disabled={submitting}
              className="h-12 w-full min-h-12 rounded-xl bg-ls-purple text-sm font-black hover:bg-ls-purple/90"
              aria-label="دریافت کد تأیید"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "دریافت کد تأیید"}
            </Button>
            <p className="flex items-center gap-1.5 text-[11px] leading-5 text-white/40">
              <MessageSquareText className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ورود به معنای پذیرش قوانین LiveShop است. محدودیت ارسال: ۳ کد در ۱۰ دقیقه.
            </p>
          </div>
        ) : (
          /* ── گام ۲: کد ۶ رقمی ── */
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                auth.startPhoneStep();
                setPhoneRaw("");
                setPhoneError(null);
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-ls-purple-soft hover:underline"
              aria-label="ویرایش شمارهٔ موبایل"
            >
              <PencilLine className="h-3.5 w-3.5" aria-hidden />
              ویرایش شماره
            </button>

            <CodeInputs key={resetKey} disabled={locked} onSubmit={onVerify} />

            {otp.error && (
              <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-300">
                {OTP_ERROR_MESSAGE[otp.error]}
              </p>
            )}

            {locked ? (
              <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-300">
                حساب به‌خاطر تلاش‌های ناموفق قفل شد؛ تا {toFa(Math.floor(lockedSecondsLeft / 60))}:{toFa(String(lockedSecondsLeft % 60).padStart(2, "0"))} دیگر کد جدید بگیر.
              </p>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-white/45">
                <span className="tabular-nums">
                  {codeSecondsLeft > 0 ? `اعتبار کد: ${toFa(Math.floor(codeSecondsLeft / 60))}:${toFa(String(codeSecondsLeft % 60).padStart(2, "0"))}` : "کد منقضی شد"}
                </span>
                <button
                  type="button"
                  disabled={resendSecondsLeft > 0}
                  onClick={() => {
                    const r = auth.requestOtp(otp.phone);
                    if (!r.ok && r.message) toast.error(r.message);
                  }}
                  className={cn(
                    "font-bold transition-colors",
                    resendSecondsLeft > 0
                      ? "cursor-not-allowed text-white/30"
                      : "text-ls-purple-soft hover:underline"
                  )}
                  aria-label={resendSecondsLeft > 0 ? `ارسال دوباره تا ${toFa(resendSecondsLeft)} ثانیه دیگر` : "ارسال دوبارهٔ کد"}
                >
                  {resendSecondsLeft > 0 ? `ارسال دوباره (${toFa(resendSecondsLeft)} ثانیه)` : "ارسال دوباره"}
                </button>
              </div>
            )}

            {/* کد دمو — فقط حالت mock؛ حالت API واقعی هرگز devCode ندارد */}
            {demoCode && !locked && (
              <p className="rounded-xl border border-ls-purple/30 bg-ls-purple/10 px-3 py-2 text-center text-xs font-bold text-ls-purple-soft">
                کد دمو: <span className="tabular-nums" dir="ltr">{toFa(demoCode)}</span> — فقط در این دمو نمایش داده می‌شود
              </p>
            )}

            {!locked && (
              <Button
                onClick={() => {
                  /* کد کامل را از کاربر می‌خواهیم؛ ورودی‌ها با تکمیل شش‌رقمی خودکار تأیید می‌کنند */
                  toast("کد را در ۶ خانه وارد کن — با تکمیل، خودکار تأیید می‌شود");
                }}
                className="hidden"
                aria-hidden
                tabIndex={-1}
              >
                تأیید
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
