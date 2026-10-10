/**
 * LiveShop API v1 — authentication.
 *
 * Auth model (spec §1):
 *   - Access token:  JWT (HS256), 15 minutes, carries { sub: userId, role }.
 *   - Refresh token: opaque 64-char random, 30 days, stored SHA-256 hashed.
 *     Rotation on every /auth/refresh. Reusing a rotated/expired token
 *     revokes ALL sessions of that user (token-family reuse detection).
 *
 * Secrets never leave the server; OTP codes and tokens are never logged.
 */
import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { ApiError, errors } from "./http";

export const ACCESS_TTL_SECONDS = 15 * 60; // spec: access 15 min
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short — set it in .env (openssl rand -hex 32)");
  }
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  phone: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: Date;
};

/** Public shape of a user (owner-facing; own phone included). */
export function publicUser(u: SessionUser) {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    avatarUrl: u.avatarUrl,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  };
}

// ───────── Access tokens (JWT) ─────────

export async function signAccessToken(user: { id: string; role: string }): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer("liveshop")
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(secretKey());
}

async function verifyAccessToken(token: string): Promise<{ sub: string }> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: "liveshop" });
    if (!payload.sub) throw new Error("missing sub");
    return { sub: payload.sub };
  } catch {
    throw errors.unauthorized();
  }
}

// ───────── Refresh tokens (rotating, hashed at rest) ─────────

function hashToken(raw: string): string {
  return createHash("sha256").update(`${raw}:${process.env.AUTH_SECRET ?? ""}`).digest("hex");
}

/** Issue a new refresh token; returns the RAW value (only the hash is stored). */
export async function issueRefreshToken(userId: string): Promise<string> {
  const raw = randomBytes(48).toString("base64url");
  await db.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });
  return raw;
}

function invalidRefresh(): ApiError {
  return new ApiError("INVALID_REFRESH_TOKEN", "نشست شما معتبر نیست؛ دوباره وارد شوید", 401);
}

/**
 * Rotate a refresh token (spec: POST /auth/refresh).
 * If the presented token was already rotated or expired → treat as reuse
 * and revoke every active session of that user, then reject.
 */
export async function rotateSession(raw: string): Promise<{
  refreshToken: string;
  user: { id: string; phone: string; name: string | null; avatarUrl: string | null; role: string; createdAt: Date };
}> {
  const now = new Date();
  const row = await db.refreshToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  });
  if (!row) throw invalidRefresh();

  if (row.revokedAt || row.expiresAt.getTime() < now.getTime()) {
    await db.refreshToken.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: now },
    });
    throw invalidRefresh();
  }

  await db.refreshToken.update({ where: { id: row.id }, data: { revokedAt: now } });
  const refreshToken = await issueRefreshToken(row.userId);
  return { refreshToken, user: row.user };
}

// ───────── Request auth ─────────

/** Returns the user for a valid Bearer token, or null when no header is present. */
export async function getOptionalUser(req: Request) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const { sub } = await verifyAccessToken(header.slice(7).trim());
  const user = await db.user.findUnique({ where: { id: sub } });
  if (!user) throw errors.unauthorized();
  return user;
}

/** Requires a valid Bearer token; throws UNAUTHORIZED otherwise. */
export async function requireUser(req: Request) {
  const user = await getOptionalUser(req);
  if (!user) throw errors.unauthorized();
  return user;
}

/** Access + refresh pair (used by /auth/otp/verify). */
export async function issueTokenPair(user: { id: string; role: string }) {
  const accessToken = await signAccessToken(user);
  const refreshToken = await issueRefreshToken(user.id);
  return { accessToken, refreshToken, expiresIn: ACCESS_TTL_SECONDS };
}

// ───────── Wallet (read-only in phase 1) ─────────

/** Wallet balance = SUM of ledger entries on the user's USER_WALLET account. */
export async function walletBalance(userId: string): Promise<number> {
  const sum = await db.ledgerEntry.aggregate({
    _sum: { amount: true },
    where: { account: { type: "USER_WALLET", userId } },
  });
  return Number(sum._sum.amount ?? BigInt(0));
}
