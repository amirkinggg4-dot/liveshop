/**
 * [Fix 6 — v1.5.1] clientIp must trust x-forwarded-for ONLY behind a trusted
 * proxy (TRUSTED_PROXY=true). Before the fix, ANY client could spoof
 * `x-forwarded-for` and rotate identities past the per-IP OTP rate limit.
 *
 * The TRUSTED_PROXY=true cases are regression guards; the untrusted cases
 * fail before the fix.
 */
import { afterEach, expect, test } from "bun:test";
import { clientIp } from "@/lib/server/http";
import { grabEnv } from "./helpers";

const req = (headers: Record<string, string>) =>
  new Request("http://liveshop.test/api/v1/auth/otp/request", { headers });

const env = grabEnv(["TRUSTED_PROXY"]);
afterEach(() => env.restore());

test("fix 6 — TRUSTED_PROXY=true: first x-forwarded-for hop is trusted", () => {
  process.env.TRUSTED_PROXY = "true";
  expect(clientIp(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
});

test("fix 6 — TRUSTED_PROXY=true, no xff: falls back to the connection header", () => {
  process.env.TRUSTED_PROXY = "true";
  expect(clientIp(req({ "x-real-ip": "198.51.100.9" }))).toBe("198.51.100.9");
  expect(clientIp(req({}))).toBe("local");
});

test("fix 6 — untrusted: spoofed x-forwarded-for is IGNORED (connection IP wins)", () => {
  delete process.env.TRUSTED_PROXY;
  expect(clientIp(req({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "192.0.2.44" }))).toBe(
    "192.0.2.44",
  );
  expect(clientIp(req({ "x-forwarded-for": "6.6.6.6" }))).toBe("local");
  expect(clientIp(req({}))).toBe("local");
});

test("fix 6 — only the exact value «true» enables proxy trust", () => {
  process.env.TRUSTED_PROXY = "1";
  expect(clientIp(req({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "192.0.2.44" }))).toBe(
    "192.0.2.44",
  );
  process.env.TRUSTED_PROXY = "TRUE";
  expect(clientIp(req({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "192.0.2.44" }))).toBe(
    "192.0.2.44",
  );
});
