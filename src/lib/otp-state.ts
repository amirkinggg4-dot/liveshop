/* ─────────────────────────────────────────────────────────────
   LiveShop v1.9.0 — ماشین وضعیت OTP (ماژول خالص)
   فازها: idle | sending | sent | verifying | locked | authenticated
   ─ فازهای اصلی طبق درخواست: idle/sent/verifying/locked
   ─ sending و authenticated دو فاز کمکی‌اند (sending برای حالت
     «در حال ارسال» با API واقعی؛ authenticated بعد از تأیید موفق)

   قواعد (هم‌شکل سرور src/lib/server/otp.ts):
   ─ کد ۶ رقمی، ۱۲۰ ثانیه پس از ارسال منقضی می‌شود (سرور: expiresAt
     با شرط gt — یعنی مرز «همین حالا» منقضی است).
   ─ حداکثر ۵ تلاش برای هر کد؛ با پنجمین تلاش غلط فاز locked می‌شود
     و تا ۱۰ دقیقه (هم‌طول پنجرهٔ نرخ) قفل می‌ماند.
   ─ محدودیت نرخ: حداکثر ۳ درخواست کد در پنجرهٔ ۱۰ دقیقه‌ای.
   ─ cooldown «ارسال دوباره»: ۱۲۰ ثانیه بعد از هر ارسال موفق؛
     ردشدن cooldown هم با همان کد خطای RATE_LIMITED برمی‌گردد
     (شمارش معکوس دقیق در UI با resendSecondsLeft نشان داده می‌شود).

   هیچ وابستگی به React/zustand/استور/سرور ندارد — فقط توابع خالص +
   ثابت‌ها. همهٔ توابع زمان‌دار nowMs صریح می‌گیرند (زمان mock در تست).
   expectedCode فقط برای دموی ماک است و در اتصال واقعی به سرور
   هیچ‌گاه ساخته/مقایسه نمی‌شود (سرور هش HMAC را مقایسه می‌کند).
   ───────────────────────────────────────────────────────────── */

/* ── ثابت‌ها ── */

/** انقضای کد — ۱۲۰ ثانیه (هم‌شکل سرور OTP_TTL_SECONDS) */
export const CODE_TTL_SECONDS = 120;

/** شمارش معکوس ۲ دقیقه‌ای «ارسال دوباره» بعد از هر ارسال موفق */
export const RESEND_COOLDOWN_SECONDS = 120;

/** حداکثر تلاش برای واردکردن کد — مطابق سرور OTP_MAX_ATTEMPTS */
export const MAX_ATTEMPTS = 5;

/** محدودیت نرخ: حداکثر ۳ درخواست در پنجرهٔ ۱۰ دقیقه‌ای (هم‌شکل سرور) */
export const RATE_LIMIT = 3;
export const RATE_WINDOW_SECONDS = 600;

/* ── فازها ── */
export const OTP_PHASES = [
  "idle",
  "sending",
  "sent",
  "verifying",
  "locked",
  "authenticated",
] as const;

export type OtpPhase = (typeof OTP_PHASES)[number];

/* ── خطاها — هم‌نام با کدهای خطای سرور/دریافت پیام فارسی ── */
export type OtpErrorCode =
  | "INVALID_CODE"
  | "TOO_MANY_ATTEMPTS"
  | "RATE_LIMITED"
  | "CODE_EXPIRED"
  | "GENERIC";

/** پیام فارسی هر خطا — تک منبع برای نمایش در UI */
export const OTP_ERROR_MESSAGE: Readonly<Record<OtpErrorCode, string>> = {
  INVALID_CODE: "کد واردشده اشتباه است",
  TOO_MANY_ATTEMPTS: "تلاش‌های شما بیش از حد مجاز بود؛ کد جدید بگیرید",
  RATE_LIMITED: "کد بیش از حد درخواست شده است؛ ۱۰ دقیقهٔ دیگر دوباره تلاش کنید",
  CODE_EXPIRED: "کد منقضی شده است؛ دوباره درخواست کد بده",
  GENERIC: "خطایی رخ داد؛ دوباره تلاش کنید",
};

/* ── وضعیت ──
   توجه: تایپ‌های prisma آرایه ندارند ولی این ماژول با DB کار ندارد و
   sentTimestampsMs برای پنجرهٔ نرخ آزادانه آرایه است. */
export interface OtpState {
  /** فاز فعلی ماشین */
  phase: OtpPhase;
  /** شمارهٔ موبایل نرمال‌شدهٔ ۰۹xxxxxxxxx (از normalizePhoneFa) */
  phone: string;
  /** کد موردانتظار — فقط برای دموی ماک (بدون سرور) */
  expectedCode: string | null;
  /** زمان ارسال کد فعلی (ms) */
  sentAtMs: number | null;
  /** انقضای کد فعلی (ms) */
  codeExpiresAtMs: number | null;
  /** earliest زمان مجاز برای «ارسال دوباره» (ms) */
  resendAvailableAtMs: number | null;
  /** تلاش‌های باقی‌مانده برای کد فعلی */
  attemptsLeft: number;
  /** زمان‌های درخواست‌های موفق — برای پنجرهٔ نرخ ۳/۶۰۰s */
  sentTimestampsMs: number[];
  /** پایان قفل بعد از اتمام تلاش‌ها (ms) */
  lockedUntilMs: number | null;
  /** آخرین خطا (برای نمایش پیام فارسی از OTP_ERROR_MESSAGE) */
  error: OtpErrorCode | null;
}

/** وضعیت اولیه — nowMs طبق قرارداد ماژول‌های زمان‌دار صریح است ولی
    در وضعیت اولیه هیچ فیلد زمانی‌ای ست نمی‌شود */
export function initialOtpState(nowMs: number = 0): OtpState {
  void nowMs;
  return {
    phase: "idle",
    phone: "",
    expectedCode: null,
    sentAtMs: null,
    codeExpiresAtMs: null,
    resendAvailableAtMs: null,
    attemptsLeft: MAX_ATTEMPTS,
    sentTimestampsMs: [],
    lockedUntilMs: null,
    error: null,
  };
}

/** ثبت شمارهٔ نرمال‌شده (خروجی normalizePhoneFa در account-validate) */
export function withPhone(state: OtpState, phone: string): OtpState {
  return { ...state, phone };
}

/* ─────────────────────────────────────────────────────────────
   درخواست کد — پنجرهٔ نرخ و cooldown را رعایت می‌کند
   خروجی: وضعیت جدید + نتیجه (expiresInSeconds برای نمایش شمارش)
   ───────────────────────────────────────────────────────────── */

export type OtpRequestResult =
  | { ok: true; expiresInSeconds: number }
  | { ok: false; error: OtpErrorCode };

/** کد دموی ۶ رقمی — فقط وقتی opts.expectedCode نداده باشند؛
    در اتصال واقعی کد از سرور می‌آید و این مسیر مصرف نمی‌شود */
function randomDemoCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

export function requestOtp(
  state: OtpState,
  nowMs: number,
  opts?: { expectedCode?: string }
): { state: OtpState; result: OtpRequestResult } {
  /* ۱) پنجرهٔ نرخ ۳/۶۰۰s — timestampهای قدیمی‌تر از پنجره دور ریخته می‌شوند */
  const windowStartMs = nowMs - RATE_WINDOW_SECONDS * 1000;
  const recent = state.sentTimestampsMs.filter((ts) => ts > windowStartMs);
  if (recent.length >= RATE_LIMIT) {
    return {
      state: { ...state, error: "RATE_LIMITED" },
      result: { ok: false, error: "RATE_LIMITED" },
    };
  }

  /* ۲) cooldown ارسال دوباره — با همان RATE_LIMITED رد می‌شود؛
        درخواست ردشده timestamp اضافه نمی‌کند */
  if (state.resendAvailableAtMs != null && nowMs < state.resendAvailableAtMs) {
    return {
      state: { ...state, error: "RATE_LIMITED" },
      result: { ok: false, error: "RATE_LIMITED" },
    };
  }

  /* ۳) موفق — فاز sent و همهٔ زمان‌ها از همین nowMs */
  return {
    state: {
      ...state,
      phase: "sent",
      expectedCode: opts?.expectedCode ?? randomDemoCode(),
      sentAtMs: nowMs,
      codeExpiresAtMs: nowMs + CODE_TTL_SECONDS * 1000,
      resendAvailableAtMs: nowMs + RESEND_COOLDOWN_SECONDS * 1000,
      attemptsLeft: MAX_ATTEMPTS,
      sentTimestampsMs: [...recent, nowMs],
      lockedUntilMs: null,
      error: null,
    },
    result: { ok: true, expiresInSeconds: CODE_TTL_SECONDS },
  };
}

/* ─────────────────────────────────────────────────────────────
   ارسال کد توسط کاربر — مقایسهٔ رشته‌ای با expectedCode (دمو)
   ───────────────────────────────────────────────────────────── */

export type OtpSubmitResult = { ok: true } | { ok: false; error: OtpErrorCode };

export function submitCode(
  state: OtpState,
  code: string,
  nowMs: number
): { state: OtpState; result: OtpSubmitResult } {
  /* ۱) قفل — حتی با کد درست؛ تنها راه ادامه، گرفتن کد جدید است
        (درخواست موفق جدید قفل را پاک و تلاش‌ها را صفر می‌کند) */
  if (
    state.phase === "locked" ||
    (state.lockedUntilMs != null && nowMs < state.lockedUntilMs)
  ) {
    return {
      state: { ...state, error: "TOO_MANY_ATTEMPTS" },
      result: { ok: false, error: "TOO_MANY_ATTEMPTS" },
    };
  }

  /* ۲) فاز غیر sent — کد فعالی برای ارسال وجود ندارد */
  if (state.phase !== "sent") {
    return {
      state: { ...state, error: "CODE_EXPIRED" },
      result: { ok: false, error: "CODE_EXPIRED" },
    };
  }

  /* ۳) انقضای کد — هم‌شکل شرط سرور (expiresAt > now)؛ یعنی در مرز
        دقیق ۱۲۰٬۰۰۰ms پس از ارسال، کد منقضی است */
  if (state.codeExpiresAtMs == null || nowMs >= state.codeExpiresAtMs) {
    return {
      state: { ...state, error: "CODE_EXPIRED" },
      result: { ok: false, error: "CODE_EXPIRED" },
    };
  }

  /* ۴) کد اشتباه — یک تلاش کم می‌شود؛ صفر شدن = قفل ۱۰ دقیقه‌ای */
  if (state.expectedCode == null || code !== state.expectedCode) {
    const attemptsLeft = Math.max(0, state.attemptsLeft - 1);
    if (attemptsLeft === 0) {
      return {
        state: {
          ...state,
          phase: "locked",
          attemptsLeft: 0,
          lockedUntilMs: nowMs + RATE_WINDOW_SECONDS * 1000,
          error: "TOO_MANY_ATTEMPTS",
        },
        result: { ok: false, error: "TOO_MANY_ATTEMPTS" },
      };
    }
    return {
      state: { ...state, attemptsLeft, error: "INVALID_CODE" },
      result: { ok: false, error: "INVALID_CODE" },
    };
  }

  /* ۵) کد درست — ورود موفق */
  return {
    state: { ...state, phase: "authenticated", error: null },
    result: { ok: true },
  };
}

/* ─────────────────────────────────────────────────────────────
   بازگشت به نقطهٔ صفر
   ───────────────────────────────────────────────────────────── */

/** بازگشت به idle (مثلاً بستن شیت ورود) */
export function resetToIdle(_state: OtpState): OtpState {
  void _state;
  return initialOtpState();
}

/** خروج از حساب — همان وضعیت اولیه */
export function logout(_state: OtpState): OtpState {
  void _state;
  return initialOtpState();
}

/* ─────────────────────────────────────────────────────────────
   helperهای مشتق — همه خالص و با nowMs صریح
   ───────────────────────────────────────────────────────────── */

/** ثانیهٔ باقی‌ماندهٔ اعتبار کد (۰ = منقضی/موجود نیست) */
export function codeSecondsLeft(state: OtpState, nowMs: number): number {
  if (state.codeExpiresAtMs == null) return 0;
  const left = state.codeExpiresAtMs - nowMs;
  return left <= 0 ? 0 : Math.ceil(left / 1000);
}

/** ثانیهٔ باقی‌مانده تا «ارسال دوباره» (۰ = الان مجاز است) */
export function resendSecondsLeft(state: OtpState, nowMs: number): number {
  if (state.resendAvailableAtMs == null) return 0;
  const left = state.resendAvailableAtMs - nowMs;
  return left <= 0 ? 0 : Math.ceil(left / 1000);
}

/** ثانیهٔ باقی‌ماندهٔ قفل (۰ = قفل نیست/سررسید شده) */
export function lockedSecondsLeft(state: OtpState, nowMs: number): number {
  if (state.lockedUntilMs == null) return 0;
  const left = state.lockedUntilMs - nowMs;
  return left <= 0 ? 0 : Math.ceil(left / 1000);
}

/** آیا می‌توان کد را ارسال کرد؟ — فقط در فاز sent */
export function canSubmit(state: OtpState): boolean {
  return state.phase === "sent";
}

/** آیا «ارسال دوباره» از نظر زمان آزاد است؟ — فقط cooldown؛
    تصمیم نهایی نمایش دکمه با فاز و UI است */
export function canResend(state: OtpState, nowMs: number): boolean {
  return state.resendAvailableAtMs == null || nowMs >= state.resendAvailableAtMs;
}
