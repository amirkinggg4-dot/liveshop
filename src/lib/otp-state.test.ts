import { describe, it, expect } from "bun:test";

/* ─────────────────────────────────────────────────────────────
   v1.9.0 — تست ماشین وضعیت OTP (ماژول خالص)
   مسیر خوش‌حال کامل، چهار خطا با پیام فارسی، مرز دقیق انقضای ۱۲۰s،
   قفل بعد از ۵ تلاش غلط، پنجرهٔ نرخ ۳/۶۰۰s با زمان mock،
   cooldown ارسال دوباره و helperهای مشتق — همه با nowMs صریح
   ───────────────────────────────────────────────────────────── */

import {
  CODE_TTL_SECONDS,
  RESEND_COOLDOWN_SECONDS,
  MAX_ATTEMPTS,
  RATE_LIMIT,
  RATE_WINDOW_SECONDS,
  OTP_PHASES,
  OTP_ERROR_MESSAGE,
  initialOtpState,
  withPhone,
  requestOtp,
  submitCode,
  resetToIdle,
  logout,
  codeSecondsLeft,
  resendSecondsLeft,
  lockedSecondsLeft,
  canSubmit,
  canResend,
} from "@/lib/otp-state";
import type { OtpState } from "@/lib/otp-state";

/* زمان ثابت mock — همهٔ تست‌های زمان‌دار از این مبنا استفاده می‌کنند */
const T0 = 1_700_000_000_000;

const PHONE = "09121234567";

/** شروع تمیز: وضعیت اولیه + شماره + یک درخواست موفق با کد معلوم */
function sentState(opts?: { atMs?: number; code?: string }): OtpState {
  const atMs = opts?.atMs ?? T0;
  const code = opts?.code ?? "123456";
  const started = withPhone(initialOtpState(T0), PHONE);
  const res = requestOtp(started, atMs, { expectedCode: code });
  expect(res.result.ok).toBe(true);
  return res.state;
}

/* ─── ۱) ثابت‌ها و وضعیت اولیه ─── */
describe("otp-state — ثابت‌ها و وضعیت اولیه", () => {
  it("ثابت‌ها هم‌شکل سرور (src/lib/server/otp.ts) هستند", () => {
    expect(CODE_TTL_SECONDS).toBe(120);
    expect(RESEND_COOLDOWN_SECONDS).toBe(120);
    expect(MAX_ATTEMPTS).toBe(5);
    expect(RATE_LIMIT).toBe(3);
    expect(RATE_WINDOW_SECONDS).toBe(600);
  });

  it("هر ۶ فاز شامل idle/sending/sent/verifying/locked/authenticated", () => {
    expect(OTP_PHASES).toEqual([
      "idle",
      "sending",
      "sent",
      "verifying",
      "locked",
      "authenticated",
    ]);
  });

  it("وضعیت اولیه idle، خالی و بدون خطاست", () => {
    const s = initialOtpState(T0);
    expect(s.phase).toBe("idle");
    expect(s.phone).toBe("");
    expect(s.expectedCode).toBeNull();
    expect(s.sentAtMs).toBeNull();
    expect(s.codeExpiresAtMs).toBeNull();
    expect(s.resendAvailableAtMs).toBeNull();
    expect(s.attemptsLeft).toBe(MAX_ATTEMPTS);
    expect(s.sentTimestampsMs).toEqual([]);
    expect(s.lockedUntilMs).toBeNull();
    expect(s.error).toBeNull();
  });
});

/* ─── ۲) مسیر خوش‌حال کامل ─── */
describe("otp-state — مسیر خوش‌حال (request → sent → submit → authenticated)", () => {
  it("درخواست کد → فاز sent با زمان‌های درست و expiresInSeconds ۱۲۰", () => {
    const started = withPhone(initialOtpState(T0), PHONE);
    const { state, result } = requestOtp(started, T0, {
      expectedCode: "123456",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.expiresInSeconds).toBe(120);
    expect(state.phase).toBe("sent");
    expect(state.phone).toBe(PHONE);
    expect(state.expectedCode).toBe("123456");
    expect(state.sentAtMs).toBe(T0);
    expect(state.codeExpiresAtMs).toBe(T0 + 120_000);
    expect(state.resendAvailableAtMs).toBe(T0 + 120_000);
    expect(state.attemptsLeft).toBe(MAX_ATTEMPTS);
    expect(state.sentTimestampsMs).toEqual([T0]);
    expect(state.lockedUntilMs).toBeNull();
    expect(state.error).toBeNull();
  });

  it("ارسال کد درست → authenticated و error پاک می‌شود", () => {
    const s = sentState();
    const { state, result } = submitCode(s, "123456", T0 + 5_000);
    expect(result.ok).toBe(true);
    expect(state.phase).toBe("authenticated");
    expect(state.error).toBeNull();
  });

  it("بعد از authenticated، ارسال دوباره کد رد می‌شود (CODE_EXPIRED)", () => {
    const s = sentState();
    const done = submitCode(s, "123456", T0 + 1_000);
    expect(done.result.ok).toBe(true);
    const again = submitCode(done.state, "123456", T0 + 2_000);
    expect(again.result.ok).toBe(false);
    if (!again.result.ok) expect(again.result.error).toBe("CODE_EXPIRED");
  });
});

/* ─── ۳) خطاها و پیام‌های فارسی ─── */
describe("otp-state — پیام‌های فارسی خطاها", () => {
  it("نقشهٔ OTP_ERROR_MESSAGE دقیقاً مطابق قرارداد است", () => {
    expect(OTP_ERROR_MESSAGE.INVALID_CODE).toBe("کد واردشده اشتباه است");
    expect(OTP_ERROR_MESSAGE.TOO_MANY_ATTEMPTS).toBe(
      "تلاش‌های شما بیش از حد مجاز بود؛ کد جدید بگیرید"
    );
    expect(OTP_ERROR_MESSAGE.RATE_LIMITED).toBe(
      "کد بیش از حد درخواست شده است؛ ۱۰ دقیقهٔ دیگر دوباره تلاش کنید"
    );
    expect(OTP_ERROR_MESSAGE.CODE_EXPIRED).toBe(
      "کد منقضی شده است؛ دوباره درخواست کد بده"
    );
    expect(OTP_ERROR_MESSAGE.GENERIC).toBe("خطایی رخ داد؛ دوباره تلاش کنید");
  });

  it("کد اشتباه → INVALID_CODE با پیام فارسی درست و فاز همچنان sent", () => {
    const s = sentState();
    const { state, result } = submitCode(s, "654321", T0 + 1_000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("INVALID_CODE");
      expect(OTP_ERROR_MESSAGE[result.error]).toBe("کد واردشده اشتباه است");
    }
    expect(state.phase).toBe("sent");
    expect(state.attemptsLeft).toBe(MAX_ATTEMPTS - 1);
  });

  it("ارسال کد در فاز idle → CODE_EXPIRED", () => {
    const s = withPhone(initialOtpState(T0), PHONE);
    const { result } = submitCode(s, "123456", T0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("CODE_EXPIRED");
  });
});

/* ─── ۴) انقضای کد — مرز دقیق ۱۲۰ ثانیه ─── */
describe("otp-state — انقضای کد (مرز دقیق ۱۲۰ ثانیه)", () => {
  it("۱۱۹٬۹۹۹ms پس از ارسال هنوز معتبر است", () => {
    const s = sentState();
    const { result } = submitCode(s, "123456", T0 + 119_999);
    expect(result.ok).toBe(true);
  });

  it("۱۲۰٬۰۰۰ms پس از ارسال منقضی است (CODE_EXPIRED)", () => {
    const s = sentState();
    const { result } = submitCode(s, "123456", T0 + 120_000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("CODE_EXPIRED");
      expect(OTP_ERROR_MESSAGE[result.error]).toBe(
        "کد منقضی شده است؛ دوباره درخواست کد بده"
      );
    }
  });

  it("codeSecondsLeft در مرزها: ۱۲۰ → ۱ → ۰", () => {
    const s = sentState();
    expect(codeSecondsLeft(s, T0)).toBe(120);
    expect(codeSecondsLeft(s, T0 + 119_999)).toBe(1);
    expect(codeSecondsLeft(s, T0 + 120_000)).toBe(0);
  });
});

/* ─── ۵) قفل بعد از ۵ تلاش غلط ─── */
describe("otp-state — قفل بعد از ۵ تلاش غلط", () => {
  it("پنجمین تلاش غلط → locked با قفل ۱۰ دقیقه‌ای و TOO_MANY_ATTEMPTS", () => {
    let s = sentState();
    let lastError: string | null = null;
    for (let i = 1; i <= 5; i++) {
      const res = submitCode(s, "000000", T0 + i * 1_000);
      s = res.state;
      if (!res.result.ok) lastError = res.result.error;
      if (i < 5) {
        expect(s.phase).toBe("sent");
        expect(s.attemptsLeft).toBe(MAX_ATTEMPTS - i);
      }
    }
    expect(lastError).toBe("TOO_MANY_ATTEMPTS");
    expect(OTP_ERROR_MESSAGE.TOO_MANY_ATTEMPTS).toBe(
      "تلاش‌های شما بیش از حد مجاز بود؛ کد جدید بگیرید"
    );
    expect(s.phase).toBe("locked");
    expect(s.attemptsLeft).toBe(0);
    expect(s.lockedUntilMs).toBe(T0 + 5_000 + RATE_WINDOW_SECONDS * 1000);
  });

  it("تلاش ششم حتی با کد درست رد می‌شود (TOO_MANY_ATTEMPTS)", () => {
    let s = sentState();
    for (let i = 1; i <= 5; i++) {
      s = submitCode(s, "000000", T0 + i * 1_000).state;
    }
    const res = submitCode(s, "123456", T0 + 6_000);
    expect(res.result.ok).toBe(false);
    if (!res.result.ok) expect(res.result.error).toBe("TOO_MANY_ATTEMPTS");
    expect(res.state.phase).toBe("locked");
  });

  it("lockedSecondsLeft شمارش معکوس قفل را می‌دهد: ۶۰۰ → ۱ → ۰", () => {
    let s = sentState();
    for (let i = 1; i <= 5; i++) {
      s = submitCode(s, "000000", T0 + i * 1_000).state;
    }
    expect(lockedSecondsLeft(s, T0 + 5_000)).toBe(600);
    expect(lockedSecondsLeft(s, T0 + 5_000 + 599_999)).toBe(1);
    expect(lockedSecondsLeft(s, T0 + 5_000 + 600_000)).toBe(0);
  });

  it("بعد از سررسید قفل، گرفتن کد جدید قفل را پاک و مسیر را باز می‌کند", () => {
    let s = sentState();
    for (let i = 1; i <= 5; i++) {
      s = submitCode(s, "000000", T0 + i * 1_000).state;
    }
    expect(s.phase).toBe("locked");
    /* درخواست کد جدید بعد از ۱۰ دقیقه — cooldown و پنجرهٔ نرخ آزادند */
    const req = requestOtp(s, T0 + 600_000, { expectedCode: "654321" });
    expect(req.result.ok).toBe(true);
    s = req.state;
    expect(s.phase).toBe("sent");
    expect(s.attemptsLeft).toBe(MAX_ATTEMPTS);
    expect(s.lockedUntilMs).toBeNull();
    const res = submitCode(s, "654321", T0 + 600_500);
    expect(res.result.ok).toBe(true);
    expect(res.state.phase).toBe("authenticated");
  });
});

/* ─── ۶) سقف ۳ درخواست در پنجرهٔ ۱۰ دقیقه ─── */
describe("otp-state — سقف ۳ درخواست در پنجرهٔ ۱۰ دقیقه", () => {
  it("سه درخواست در پنجره مجاز است؛ چهارمی RATE_LIMITED می‌گیرد", () => {
    let s = withPhone(initialOtpState(T0), PHONE);
    /* سه درخواست با رعایت cooldown ۱۲۰ ثانیه‌ای */
    for (const at of [T0, T0 + 120_000, T0 + 240_000]) {
      const res = requestOtp(s, at, { expectedCode: "123456" });
      expect(res.result.ok).toBe(true);
      s = res.state;
    }
    expect(s.sentTimestampsMs).toEqual([T0, T0 + 120_000, T0 + 240_000]);
    /* چهارمی هنوز داخل پنجرهٔ ۱۰ دقیقه است → رد */
    const res4 = requestOtp(s, T0 + 360_000, { expectedCode: "123456" });
    expect(res4.result.ok).toBe(false);
    if (!res4.result.ok) {
      expect(res4.result.error).toBe("RATE_LIMITED");
      expect(OTP_ERROR_MESSAGE[res4.result.error]).toBe(
        "کد بیش از حد درخواست شده است؛ ۱۰ دقیقهٔ دیگر دوباره تلاش کنید"
      );
    }
    /* درخواست ردشده timestamp اضافه نمی‌کند */
    expect(res4.state.sentTimestampsMs).toEqual([
      T0,
      T0 + 120_000,
      T0 + 240_000,
    ]);
  });

  it("با گذر پنجره، timestamp قدیمی می‌افتد و درخواست آزاد می‌شود", () => {
    let s = withPhone(initialOtpState(T0), PHONE);
    for (const at of [T0, T0 + 120_000, T0 + 240_000]) {
      s = requestOtp(s, at, { expectedCode: "123456" }).state;
    }
    expect(requestOtp(s, T0 + 360_000).result.ok).toBe(false);
    /* ۱ms بعد از پنجره — قدیمی‌ترین timestamp (T0) از آرایه می‌افتد */
    const res = requestOtp(s, T0 + 600_001, { expectedCode: "123456" });
    expect(res.result.ok).toBe(true);
    expect(res.state.sentTimestampsMs).toEqual([
      T0 + 120_000,
      T0 + 240_000,
      T0 + 600_001,
    ]);
  });
});

/* ─── ۷) cooldown ارسال دوباره (۱۲۰ ثانیه) ─── */
describe("otp-state — cooldown ارسال دوباره", () => {
  it("قبل از ۱۲۰ ثانیه رد می‌شود (RATE_LIMITED) و وضعیت دست‌نخورده می‌ماند", () => {
    const s = sentState();
    const { state, result } = requestOtp(s, T0 + 119_999);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("RATE_LIMITED");
    expect(state.phase).toBe("sent");
    expect(state.sentTimestampsMs).toEqual([T0]);
  });

  it("بعد از ۱۲۰ ثانیه ارسال دوباره مجاز است", () => {
    const s = sentState();
    const res = requestOtp(s, T0 + 120_000, { expectedCode: "654321" });
    expect(res.result.ok).toBe(true);
    expect(res.state.sentTimestampsMs).toEqual([T0, T0 + 120_000]);
    expect(res.state.expectedCode).toBe("654321");
    expect(res.state.codeExpiresAtMs).toBe(T0 + 120_000 + 120_000);
  });

  it("resendSecondsLeft و canResend در مرزهای cooldown", () => {
    const s = sentState();
    expect(resendSecondsLeft(s, T0)).toBe(120);
    expect(canResend(s, T0)).toBe(false);
    expect(resendSecondsLeft(s, T0 + 119_999)).toBe(1);
    expect(canResend(s, T0 + 119_999)).toBe(false);
    expect(resendSecondsLeft(s, T0 + 120_000)).toBe(0);
    expect(canResend(s, T0 + 120_000)).toBe(true);
  });

  it("در وضعیت اولیه cooldownی وجود ندارد (canResend true)", () => {
    expect(canResend(initialOtpState(T0), T0)).toBe(true);
  });
});

/* ─── ۸) attemptsLeft و canSubmit ─── */
describe("otp-state — attemptsLeft و canSubmit", () => {
  it("تلاش غلط کم می‌کند؛ تلاش درست فاز را عوض می‌کند ولی attemptsLeft دست‌نخورده می‌ماند", () => {
    let s = sentState();
    s = submitCode(s, "111111", T0 + 1_000).state;
    expect(s.attemptsLeft).toBe(4);
    s = submitCode(s, "222222", T0 + 2_000).state;
    expect(s.attemptsLeft).toBe(3);
    const res = submitCode(s, "123456", T0 + 3_000);
    expect(res.result.ok).toBe(true);
    expect(res.state.phase).toBe("authenticated");
    expect(res.state.attemptsLeft).toBe(3);
  });

  it("canSubmit فقط در فاز sent درست است", () => {
    expect(canSubmit(initialOtpState(T0))).toBe(false);
    const s = sentState();
    expect(canSubmit(s)).toBe(true);
    const done = submitCode(s, "123456", T0 + 1_000).state;
    expect(canSubmit(done)).toBe(false);
    let locked = sentState({ code: "999999" });
    for (let i = 1; i <= 5; i++) {
      locked = submitCode(locked, "000000", T0 + i * 1_000).state;
    }
    expect(canSubmit(locked)).toBe(false);
  });
});

/* ─── ۹) resetToIdle و logout ─── */
describe("otp-state — resetToIdle و logout", () => {
  it("هر دو به وضعیت اولیه برمی‌گردند", () => {
    let s = sentState();
    s = submitCode(s, "123456", T0 + 1_000).state;
    expect(s.phase).toBe("authenticated");

    const idle = resetToIdle(s);
    expect(idle.phase).toBe("idle");
    expect(idle.phone).toBe("");
    expect(idle.expectedCode).toBeNull();
    expect(idle.sentTimestampsMs).toEqual([]);
    expect(idle.error).toBeNull();
    expect(idle.attemptsLeft).toBe(MAX_ATTEMPTS);

    const out = logout(s);
    expect(out).toEqual(idle);
  });
});
