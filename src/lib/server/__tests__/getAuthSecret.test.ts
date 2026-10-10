/**
 * [Fix 4 — v1.5.1] One getAuthSecret() with a real strength policy.
 *
 * Before the fix there was NO shared function: `secretKey()` silently accepted
 * 16-char secrets and `hashToken`/`hashCode` fell back to `process.env.AUTH_
 * SECRET ?? ""` — i.e. an unset secret made every HMAC key the literal empty
 * string. These tests fail before the fix (module doesn't exist / weak secrets
 * accepted) and pass after it.
 */
import { afterEach, expect, test } from "bun:test";
import { getAuthSecret } from "@/lib/server/secret";
import { catchCode, grabEnv } from "./helpers";

const env = grabEnv(["AUTH_SECRET"]);
afterEach(() => env.restore());

test("fix 4 — missing AUTH_SECRET fails loudly (no empty-string fallback)", () => {
  delete process.env.AUTH_SECRET;
  expect(() => getAuthSecret()).toThrow(/AUTH_SECRET/);
});

test("fix 4 — AUTH_SECRET shorter than 32 chars is rejected", () => {
  process.env.AUTH_SECRET = "a".repeat(31);
  expect(() => getAuthSecret()).toThrow(/AUTH_SECRET/);
});

test("fix 4 — exactly 32 chars is accepted and returned verbatim", () => {
  const secret = "b".repeat(32);
  process.env.AUTH_SECRET = secret;
  expect(getAuthSecret()).toBe(secret);
});

test("fix 4 — a 20-char secret must be rejected by the signing path (old code accepted ≥16)", async () => {
  process.env.AUTH_SECRET = "e".repeat(20);
  const { signAccessToken } = await import("@/lib/server/auth");
  const result = await catchCode(signAccessToken({ id: "u1", role: "BUYER" }));
  expect(result).toContain("AUTH_SECRET");
});

test("fix 4 — a token signed under one secret is rejected after the secret changes (wiring test)", async () => {
  process.env.AUTH_SECRET = "e".repeat(32);
  const { signAccessToken, getOptionalUser } = await import("@/lib/server/auth");
  const token = await signAccessToken({ id: "u1", role: "BUYER" });

  process.env.AUTH_SECRET = "f".repeat(32); // rotated secret
  const req = new Request("http://liveshop.test/api", {
    headers: { authorization: `Bearer ${token}` },
  });
  expect(await catchCode(getOptionalUser(req))).toBe("UNAUTHORIZED");
});
