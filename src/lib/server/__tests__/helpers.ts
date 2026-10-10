/**
 * Shared helpers for the src/lib/server security tests (v1.5.1).
 *
 * These tests hit a REAL PostgreSQL — point DATABASE_URL at a dedicated test
 * schema (see scripts/test-server.sh) and run: `bun test src/lib/server/__tests__`.
 * Every test is written to fail against the pre-fix code and pass after it.
 */
import { db } from "@/lib/db";
import { ApiError } from "@/lib/server/http";

/** Resolves with the ApiError.code (or NO_THROW / NON_API:<msg>) instead of throwing. */
export async function catchCode(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "NO_THROW";
  } catch (err) {
    if (err instanceof ApiError) return err.code;
    return `NON_API:${(err as Error | undefined)?.message ?? String(err)}`;
  }
}

/** Wipes only the tables these tests touch (in the TEST schema — dev data untouched). */
export async function wipeAuthTables(): Promise<void> {
  await db.$executeRawUnsafe(`TRUNCATE TABLE "OtpCode", "RefreshToken", "User" CASCADE`);
}

/** Assigns/deletes an env var (Object.assign sidesteps the readonly NODE_ENV typing). */
export function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else Object.assign(process.env, { [key]: value });
}

/** Saves/restores env vars around a test that flips NODE_ENV / provider keys. */
export function grabEnv(keys: string[]): { restore(): void } {
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  return {
    restore() {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    },
  };
}
