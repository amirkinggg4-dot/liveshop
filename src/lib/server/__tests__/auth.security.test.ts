/**
 * [Fix 5 — v1.5.1] Refresh-token rotation must be ATOMIC.
 *
 * Before the fix, two concurrent refreshes with the same token both read the
 * un-revoked row, both passed the `revokedAt` check and both issued a new
 * token — a stolen token could be raced into two live sessions. Now the
 * revocation is a single conditional updateMany (id, revokedAt: null → now);
 * any loser (count !== 1) is treated as token reuse: every session of the
 * user is revoked and INVALID_REFRESH_TOKEN is returned.
 */
import { beforeEach, expect, test } from "bun:test";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/server/http";
import { issueRefreshToken, rotateSession } from "@/lib/server/auth";
import { catchCode, wipeAuthTables } from "./helpers";

beforeEach(wipeAuthTables);

test("fix 5 — two concurrent refreshes with one token: exactly one wins", async () => {
  const user = await db.user.create({ data: { phone: "09123330001" } });
  const raw = await issueRefreshToken(user.id);

  const settled = await Promise.allSettled([rotateSession(raw), rotateSession(raw)]);
  const fulfilled = settled.filter((s) => s.status === "fulfilled");
  const rejected = settled.filter((s) => s.status === "rejected") as PromiseRejectedResult[];

  expect(fulfilled).toHaveLength(1);
  expect(rejected).toHaveLength(1);
  expect(rejected[0]!.reason).toBeInstanceOf(ApiError);
  expect((rejected[0]!.reason as ApiError).code).toBe("INVALID_REFRESH_TOKEN");

  // The original token is dead either way, and exactly one rotation happened:
  expect(await catchCode(rotateSession(raw))).toBe("INVALID_REFRESH_TOKEN");
  expect(await db.refreshToken.count({ where: { userId: user.id } })).toBe(2);
});

test("fix 5 — replaying a rotated token revokes the whole family (regression guard)", async () => {
  const user = await db.user.create({ data: { phone: "09123330002" } });
  const raw1 = await issueRefreshToken(user.id);
  const { refreshToken: raw2 } = await rotateSession(raw1);

  expect(await catchCode(rotateSession(raw1))).toBe("INVALID_REFRESH_TOKEN");
  // raw2 existed BEFORE the replay — reuse detection must have killed it too:
  expect(await catchCode(rotateSession(raw2))).toBe("INVALID_REFRESH_TOKEN");
  expect(await db.refreshToken.count({ where: { userId: user.id, revokedAt: null } })).toBe(0);
});

test("fix 5 — an expired-but-unrevoked token is treated as reuse", async () => {
  const user = await db.user.create({ data: { phone: "09123330003" } });
  const raw = await issueRefreshToken(user.id);
  // Simulate a token that expired without being rotated:
  await db.refreshToken.updateMany({
    where: { userId: user.id },
    data: { expiresAt: new Date(Date.now() - 1_000) },
  });

  expect(await catchCode(rotateSession(raw))).toBe("INVALID_REFRESH_TOKEN");
  // reuse handling revoked everything the user had:
  expect(await db.refreshToken.count({ where: { userId: user.id, revokedAt: null } })).toBe(0);
});
