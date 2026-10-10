/**
 * LiveShop API v1 — SMS OTP login.
 *
 * Spec §1: rate limit 3 codes per 10 minutes per phone AND per IP.
 * Codes are 6 digits, stored as HMAC-SHA256 hashes, expire in 2 minutes,
 * max 5 verification attempts, one-time use.
 *
 * SMS delivery: when KAVENEGAR_API_KEY is set the code is sent through the
 * Kavenegar verify/lookup API; otherwise it is printed to the server console
 * and returned as `devCode` (dev mode only — never when a provider exists).
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { ApiError, errors } from "./http";

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
  return createHmac("sha256", process.env.AUTH_SECRET ?? "").update(`${phone}:${code}`).digest("hex");
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
  /** Only present when no SMS provider is configured (development). */
  devCode?: string;
};

export async function requestOtp(phone: string, ip: string): Promise<RequestOtpResult> {
  const since = new Date(Date.now() - OTP_RATE_WINDOW_MINUTES * 60 * 1000);
  const [byPhone, byIp] = await Promise.all([
    db.otpCode.count({ where: { phone, createdAt: { gte: since } } }),
    db.otpCode.count({ where: { requestIp: ip, createdAt: { gte: since } } }),
  ]);
  if (byPhone >= OTP_RATE_LIMIT || byIp >= OTP_RATE_LIMIT) {
    throw errors.rateLimited("کد بیش از حد درخواست شده است؛ ۱۰ دقیقهٔ دیگر دوباره تلاش کنید");
  }

  // Hygiene: drop this phone's already-expired rows (kept rows are what the
  // rate-limit window counts — never delete recent requests here).
  await db.otpCode.deleteMany({ where: { phone, expiresAt: { lt: new Date() } } });

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
  return delivered
    ? { delivery: "sms", expiresInSeconds: OTP_TTL_SECONDS }
    : { delivery: "console", expiresInSeconds: OTP_TTL_SECONDS, devCode: code };
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
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await db.otpCode.delete({ where: { id: otp.id } });
    throw new ApiError("TOO_MANY_ATTEMPTS", "تلاش‌های شما بیش از حد مجاز بود؛ کد جدید بگیرید", 429);
  }
  if (!fixedTimeEqual(hashCode(phone, code), otp.codeHash)) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new ApiError("INVALID_OTP", "کد واردشده اشتباه است", 400);
  }
  // One-time use: burn exactly the verified code row.
  await db.otpCode.delete({ where: { id: otp.id } });
}
