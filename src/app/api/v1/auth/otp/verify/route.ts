import { z } from "zod";
import { db } from "@/lib/db";
import { handle, ok, parseBody } from "@/lib/server/http";
import { issueTokenPair, publicUser } from "@/lib/server/auth";
import { normalizePhone, verifyOtp } from "@/lib/server/otp";
const bodySchema = z.object({
  phone: z.string().min(4).max(20),
  code: z.string().regex(/^\d{4,8}$/, "کد باید عددی بین ۴ تا ۸ رقم باشد"),
});

/**
 * POST /api/v1/auth/otp/verify
 * { phone, code } → { accessToken, refreshToken, expiresIn, user, isNewUser }
 * Creates the user on first login (spec §1).
 */
export const POST = handle(async (req: Request) => {
  const { phone: rawPhone, code } = await parseBody(req, bodySchema);
  const phone = normalizePhone(rawPhone);

  await verifyOtp(phone, code);

  let user = await db.user.findUnique({ where: { phone } });
  let isNewUser = false;
  if (!user) {
    user = await db.user.create({ data: { phone } });
    isNewUser = true;
  }

  const tokens = await issueTokenPair(user);
  return ok({ ...tokens, user: publicUser(user), isNewUser });
});
