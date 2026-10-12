/**
 * POST /api/v1/wallet/dev-topup — DEV-ONLY fake topup (no real gateway yet).
 *
 * Enabled ONLY when NODE_ENV !== "production" AND DEV_TOPUP=true.
 * In production the endpoint ALWAYS answers 404 — before reading the body —
 * so it cannot be probed, and in dev without the flag it is 404 as well.
 */
import { errors, handle, ok, parseBody } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { devTopup, devTopupEnabled, devTopupSchema } from "@/lib/server/wallet";

export const POST = handle(async (req: Request) => {
  if (!devTopupEnabled()) {
    // production همیشه ۴۰۴ — قبل از خواندن بدنه و قبل از احراز هویت،
    // بدون افشای وجود مسیر
    throw errors.notFound("چنین مسیری وجود ندارد");
  }
  const user = await requireUser(req);
  const body = await parseBody(req, devTopupSchema);
  const result = await devTopup(user.id, body.amount);
  return ok(result);
});
