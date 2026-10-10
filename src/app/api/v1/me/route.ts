import { z } from "zod";
import { db } from "@/lib/db";
import { handle, ok, parseBody } from "@/lib/server/http";
import { publicUser, requireUser, walletBalance } from "@/lib/server/auth";

/**
 * GET /api/v1/me  → profile + wallet balance (spec §1)
 * Authorization: Bearer <accessToken>
 */
export const GET = handle(async (req: Request) => {
  const user = await requireUser(req);
  const balance = await walletBalance(user.id);
  return ok({ user: publicUser(user), walletBalance: balance });
});

const patchSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  avatarUrl: z.string().trim().min(1).max(500).optional(),
});

/** PATCH /api/v1/me → update name / avatar (spec §1) */
export const PATCH = handle(async (req: Request) => {
  const user = await requireUser(req);
  const data = await parseBody(req, patchSchema);
  const updated = await db.user.update({ where: { id: user.id }, data });
  return ok({ user: publicUser(updated) });
});
