/**
 * [Fixes 1–3 — v1.5.1] OTP security tests against a REAL PostgreSQL.
 *
 *  Fix 1 — devCode only when NODE_ENV !== "production" AND no SMS key;
 *          production without a key fails closed with OTP_DELIVERY_FAILED.
 *  Fix 2 — verification attempts are claimed ATOMICALLY (updateMany with
 *          attempts < max) so parallel guesses can never exceed the cap.
 *  Fix 3 — hygiene deletes rows older than the RATE WINDOW (createdAt), never
 *          by expiresAt — cleaning by expiry rewound the rate-limit counters.
 *
 * Simulated time in the window test: the JS clock is NOT mocked, because
 * `createdAt`/`expiresAt` are stamped by the DATABASE clock (JS mocking would
 * not move them). Instead each step shifts BOTH stored timestamps back by the
 * simulated gap — from the app's point of view (which compares `new Date()`
 * against exactly those columns) exactly 3 minutes have passed.
 */
import { afterEach, beforeEach, expect, test } from "bun:test";
import { db } from "@/lib/db";
import { requestOtp, verifyOtp } from "@/lib/server/otp";
import { catchCode, grabEnv, setEnv, wipeAuthTables } from "./helpers";

const PHONE = "09121110001";
const IP = "10.9.9.9";

const env = grabEnv(["NODE_ENV", "KAVENEGAR_API_KEY"]);
beforeEach(() => {
  delete process.env.KAVENEGAR_API_KEY; // dev (console) delivery in tests
});
afterEach(() => env.restore());

beforeEach(wipeAuthTables);

/** Requests a code in dev mode and returns the devCode. */
async function devCode(phone = PHONE, ip = IP): Promise<string> {
  const res = await requestOtp(phone, ip);
  if (!res.devCode) throw new Error(`expected devCode, got delivery=${res.delivery}`);
  return res.devCode;
}

// ───────── Fix 1 ─────────

test("fix 1 — production without SMS key: OTP_DELIVERY_FAILED and nothing leaks", async () => {
  setEnv("NODE_ENV", "production");
  delete process.env.KAVENEGAR_API_KEY;

  expect(await catchCode(requestOtp(PHONE, IP))).toBe("OTP_DELIVERY_FAILED");
  // Nothing was stored either — no code hash, no phone trace in the response:
  expect(await db.otpCode.count({ where: { phone: PHONE } })).toBe(0);
});

test("fix 1 — dev without a key still returns devCode exactly once (regression guard)", async () => {
  setEnv("NODE_ENV", "development");
  const res = await requestOtp(PHONE, IP);
  expect(res.delivery).toBe("console");
  expect(res.devCode).toMatch(/^\d{6}$/);
});

// ───────── Fix 2 ─────────

test("fix 2 — 100 parallel wrong guesses: exactly 5 counted, correct code rejected after", async () => {
  setEnv("NODE_ENV", "development");
  const code = await devCode();
  const wrong = code === "000000" ? "111111" : "000000";

  const results = await Promise.all(
    Array.from({ length: 100 }, () => catchCode(verifyOtp(PHONE, wrong))),
  );
  const invalid = results.filter((c) => c === "INVALID_OTP").length;
  const tooMany = results.filter((c) => c === "TOO_MANY_ATTEMPTS").length;

  // The atomic claim makes the cap EXACT: 5 attempts get counted, everyone
  // else is locked out — no parallel request slips past the old read/compare.
  expect(invalid).toBe(5);
  expect(tooMany).toBe(95);
  const row = await db.otpCode.findFirst({ where: { phone: PHONE } });
  expect(row?.attempts).toBe(5);

  // After exhaustion even the CORRECT code is rejected:
  expect(await catchCode(verifyOtp(PHONE, code))).toBe("TOO_MANY_ATTEMPTS");
});

// ───────── Fix 3 ─────────

test("fix 3 — 4 codes 3 simulated minutes apart stay rate-limited inside the 10-minute window", async () => {
  setEnv("NODE_ENV", "development");
  // Simulate the passage of `mins` minutes: shift the stored timeline back.
  // (The app compares new Date() against createdAt/expiresAt — moving both
  // columns back is exactly "N minutes older" for every one of its queries.)
  const passSimulatedMinutes = (mins: number) =>
    db.$executeRaw`UPDATE "OtpCode" SET "createdAt" = "createdAt" - (${mins} * interval '1 minute'), "expiresAt" = "expiresAt" - (${mins} * interval '1 minute') WHERE "phone" = ${PHONE}`;

  await requestOtp(PHONE, IP); // 1st @ t=0
  await passSimulatedMinutes(3);
  await requestOtp(PHONE, IP); // 2nd @ t=3
  await passSimulatedMinutes(3);
  await requestOtp(PHONE, IP); // 3rd @ t=6
  await passSimulatedMinutes(3);

  // 4th @ t=9 — three codes are already inside the 10-minute window. (Before
  // the fix, hygiene deleted the EXPIRED rows → the 4th request succeeded.)
  expect(await catchCode(requestOtp(PHONE, IP))).toBe("RATE_LIMITED");
  expect(await db.otpCode.count({ where: { phone: PHONE } })).toBe(3);

  // @ t=11 the first code (now 11 min old) leaves the window → allowed again,
  // and the window-aged row is cleaned by createdAt (never by expiresAt):
  await passSimulatedMinutes(2);
  const res = await requestOtp(PHONE, IP);
  expect(res.devCode).toMatch(/^\d{6}$/);
  // rows @3min, @6min and the fresh one — the @0 row was window-cleaned:
  expect(await db.otpCode.count({ where: { phone: PHONE } })).toBe(3);
});

test("fix 3 — per-IP limit counts on the same 10-minute window (regression guard)", async () => {
  setEnv("NODE_ENV", "development");
  for (let i = 0; i < 3; i++) {
    expect(await catchCode(requestOtp(`0912200000${i}`, "10.1.1.1"))).toBe("NO_THROW");
  }
  // 4th code for a DIFFERENT phone but the same IP inside the window:
  expect(await catchCode(requestOtp("09122000010", "10.1.1.1"))).toBe("RATE_LIMITED");
  // …while another IP is untouched:
  expect(await catchCode(requestOtp("09122000010", "10.1.1.2"))).toBe("NO_THROW");
});
