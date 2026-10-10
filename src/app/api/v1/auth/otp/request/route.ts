import { z } from "zod";
import { handle, ok, parseBody, clientIp } from "@/lib/server/http";
import { normalizePhone, requestOtp } from "@/lib/server/otp";

const bodySchema = z.object({
  phone: z.string().min(4).max(20),
});

/**
 * POST /api/v1/auth/otp/request
 * { phone } → SMS code. Rate limit: 3 per 10 min per phone and per IP.
 * Without a configured SMS provider the code is returned as devCode (dev).
 */
export const POST = handle(async (req: Request) => {
  const { phone: rawPhone } = await parseBody(req, bodySchema);
  const phone = normalizePhone(rawPhone);
  const result = await requestOtp(phone, clientIp(req));
  return ok(result);
});
