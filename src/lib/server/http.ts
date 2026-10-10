/**
 * LiveShop API v1 — HTTP helpers.
 *
 * Contract (docs/api-spec.md):
 *   Errors:  { "error": { "code": "OUT_OF_STOCK", "message": "فارسی برای کاربر" } }
 *   Success: plain JSON object of the endpoint.
 */
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Standard errors with Persian (user-facing) messages. */
export const errors = {
  validation: (message = "اطلاعات ارسالی معتبر نیست") =>
    new ApiError("VALIDATION_ERROR", message, 400),
  unauthorized: () => new ApiError("UNAUTHORIZED", "ابتدا وارد حساب خود شوید", 401),
  forbidden: (message = "دسترسی مجاز نیست") => new ApiError("FORBIDDEN", message, 403),
  notFound: (message = "موردی که خواسته‌اید پیدا نشد") => new ApiError("NOT_FOUND", message, 404),
  rateLimited: (message = "درخواست‌های شما زیاد است؛ کمی بعد دوباره تلاش کنید") =>
    new ApiError("RATE_LIMITED", message, 429),
  internal: () => new ApiError("INTERNAL", "خطای غیرمنتظرهٔ سرور؛ دوباره تلاش کنید", 500),
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: ApiError) {
  return NextResponse.json(
    { error: { code: error.code, message: error.message } },
    { status: error.status },
  );
}

/**
 * Wraps a route handler so that:
 *  - ApiError           → its own status + { error: { code, message } }
 *  - ZodError           → 400 VALIDATION_ERROR
 *  - anything else      → 500 INTERNAL (logged server-side, never leaked)
 */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return errorResponse(err);
      if (err instanceof ZodError) return errorResponse(errors.validation());
      console.error("[api] unhandled error:", err);
      return errorResponse(errors.internal());
    }
  };
}

/** Parse + validate a JSON body with zod; throws VALIDATION_ERROR. */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw errors.validation("بدنهٔ درخواست JSON معتبر نیست");
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw errors.validation();
  return result.data;
}

/** Client IP for rate limiting (behind the Caddy gateway). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "local";
}
