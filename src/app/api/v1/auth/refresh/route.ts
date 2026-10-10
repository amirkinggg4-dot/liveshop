import { z } from "zod";
import { handle, ok, parseBody } from "@/lib/server/http";
import { ACCESS_TTL_SECONDS, publicUser, rotateSession, signAccessToken } from "@/lib/server/auth";

const bodySchema = z.object({
  refreshToken: z.string().min(10),
});

/**
 * POST /api/v1/auth/refresh
 * { refreshToken } → rotated { accessToken, refreshToken, expiresIn, user }.
 * Reusing an already-rotated/expired token revokes all user sessions.
 */
export const POST = handle(async (req: Request) => {
  const { refreshToken: raw } = await parseBody(req, bodySchema);
  const { refreshToken, user } = await rotateSession(raw);
  const accessToken = await signAccessToken(user);
  return ok({
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TTL_SECONDS,
    user: publicUser(user),
  });
});
