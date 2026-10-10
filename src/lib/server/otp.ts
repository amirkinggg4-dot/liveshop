/**
 * LiveShop API v1 — SMS OTP login.
 *
 * Spec §1: rate limit 3 codes per 10 minutes per phone AND per IP.
 * Codes are 6 digits, stored as HMAC-SHA256 hashes, expire in 2 minutes,
 * max 5 verification attempts, one-time use.
 *
 * SMS delivery: when KAVENEGAR_API_KEY is set the code is sent through the
 * Kavenegar verify/lookup API. Without a key, console delivery (+ `devCode`
 * in the response) is allowed ONLY in development — production fails closed
 * with OTP_DELIVERY_FAILED and reveals nothing (fix v1.5.1 #1).
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { ApiError, errors } from "./http";
import { getAuthSecret } from "./secret";

const OTP_TTL_SECONDS = 120;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_LIMIT = 3; // per window, per phone AND per IP (spec §1)
const OTP_RATE_WINDOW_MINUTES = 10;

/** Accepts 09xxxxxxxxx / +989xxxxxxxxx / 00989xxxxxxxxx / 989xxxxxxxxx → 09xxxxxxxxx */
export function normalizePhone(input: string): string {
  let p = input.replace(/[\s\-().]/g, "");
  if (/^\+98/.test(p)) p = `0${p.slice(3)}`;
  else if (/^0098/.test(p)) p = `0${p.slice(4)}`;
  else if (/^989\d{9}$/.test(p)) p = `0${p.slice(2)}`;
  if (!/^09\d{9}$/.test(p)) {
    throw errors.validation("شمارهٔ موبایل معتبر نیست؛ نمونهٔ صحیح: ۰۹۱۲۱۲۳۴۵۶۷");
  }
  return p;
}

function hashCode(phone: string, code: string): string {
  // fix v1.5.1 #4: the secret (and its strength policy) has exactly one owner.
  return createHmac("sha256", getAuthSecret()).update(`${phone}:${code}`).digest("hex");
}

function fixedTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// ───────── SMS provider ─────────

/** Returns true when the code was handed to a real provider. */
async function sendSms(phone: string, code: string): Promise<boolean> {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  if (!apiKey) {
    console.log(`[otp] dev delivery → ${phone}: ${code}`);
    return false;
  }
  const url = new URL(`https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`);
  url.searchParams.set("receptor", phone);
  url.searchParams.set("token", code);
  url.searchParams.set("template", "liveshop");
  const sender = process.env.KAVENEGAR_SENDER;
  if (sender) url.searchParams.set("sender", sender);
  let res: Response;
  try {
    res = await fetch(url, { method: "GET", cache: "no-store" });
  } catch (err) {
    console.error("[otp] sms provider unreachable:", err);
    throw new ApiError("OTP_DELIVERY_FAILED", "ارسال پیامک ناموفق بود؛ دوباره تلاش کنید", 502);
  }
  if (!res.ok) {
    console.error("[otp] sms provider error:", res.status);
    throw new ApiError("OTP_DELIVERY_FAILED", "ارسال پیامک ناموفق بود؛ دوباره تلاش کنید", 502);
  }
  return true;
}

// ───────── Request / verify ─────────

export type RequestOtpResult = {
  delivery: "sms" | "console";
  expiresInSeconds: number;
  /** Only when NODE_ENV !== "production" AND no SMS key is set (fix v1.5.1 #1). */
  devCode?: string;
};

export async function requestOtp(phone: string, ip: string): Promise<RequestOtpResult> {
  // fix v1.5.1 #1: fail closed. Production without an SMS provider must never
  // hand the code to the caller — and must not reveal why. Same message as an
  // ordinary provider outage, thrown before anything is written to the DB.
  if (!process.env.KAVENEGAR_API_KEY && process.env.NODE_ENV === "production") {
    throw new ApiError("OTP_DELIVERY_FAILED", "ارسال پیامک ناموفق بود؛ دوباره تلاش کنید", 502);
  }

  const since = new Date(Date.now() - OTP_RATE_WINDOW_MINUTES * 60 * 1000);
  const [byPhone, byIp] = await Promise.all([
    db.otpCode.count({ where: { phone, createdAt: { gte: since } } }),
    db.otpCode.count({ where: { requestIp: ip, createdAt: { gte: since } } }),
  ]);
  if (byPhone >= OTP_RATE_LIMIT || byIp >= OTP_RATE_LIMIT) {
    throw errors.rateLimited("کد بیش از حد درخواست شده است؛ ۱۰ دقیقهٔ دیگر دوباره تلاش کنید");
  }

  // fix v1.5.1 #3: hygiene only removes rows OLDER THAN THE RATE WINDOW
  // (createdAt — never expiresAt). Cleaning by expiry rewound the counters
  // above and let a caller farm a fresh code every 2 minutes.
  await db.otpCode.deleteMany({ where: { phone, createdAt: { lt: since } } });

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.otpCode.create({
    data: {
      phone,
      codeHash: hashCode(phone, code),
      expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
      requestIp: ip,
    },
  });

  const delivered = await sendSms(phone, code);
  if (!delivered) {
    // Console delivery is only reachable when the guard above didn't fire:
    // no provider key AND not production (fix v1.5.1 #1).
    return { delivery: "console", expiresInSeconds: OTP_TTL_SECONDS, devCode: code };
  }
  return { delivery: "sms", expiresInSeconds: OTP_TTL_SECONDS };
}

export async function verifyOtp(phone: string, code: string): Promise<void> {
  const now = new Date();
  const otp = await db.otpCode.findFirst({
    where: { phone, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) {
    throw new ApiError("OTP_EXPIRED", "کدی فعال برای این شماره نیست؛ دوباره درخواست کد بده", 400);
  }

  // fix v1.5.1 #2: claim the attempt atomically. The WHERE clause is checked
  // by PostgreSQL under a row lock, so the cap is exact even when guesses land
  // in parallel — the old read-then-increment let every concurrent request
  // pass the `attempts >= max` check with the same stale value.
  const claimed = await db.otpCode.updateMany({
    where: { id: otp.id, attempts: { lt: OTP_MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (claimed.count === 0) {
    throw new ApiError("TOO_MANY_ATTEMPTS", "تلاش‌های شما بیش از حد مجاز بود؛ کد جدید بگیرید", 429);
  }

  if (!fixedTimeEqual(hashCode(phone, code), otp.codeHash)) {
    throw new ApiError("INVALID_OTP", "کد واردشده اشتباه است", 400);
  }

  // One-time use: burn exactly the verified code row (deleteMany → never a
  // P2025 when two correct verifications race on the same code).
  await db.otpCode.deleteMany({ where: { id: otp.id, codeHash: otp.codeHash } });
}
