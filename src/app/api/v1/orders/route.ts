/**
 * POST /api/v1/orders — checkout (spec §4). Header: Idempotency-Key (required).
 * GET  /api/v1/orders — the buyer's own orders (cursor-paged).
 */
import { z } from "zod";
import { ApiError, handle, ok, parseBody } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import {
  createOrder,
  SHIPPING_METHODS,
  type CreateOrderInput,
} from "@/lib/server/checkout";
import { listBuyerOrders } from "@/lib/server/orders";

export const createOrderSchema = z.object({
  showId: z.string().min(1),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(20),
  addressId: z.string().min(1),
  shippingMethod: z.enum(SHIPPING_METHODS),
  // نکتهٔ امنیتی: فیلدهای اضافه (مثل price/total جعلی) با zod حذف می‌شوند —
  // هیچ مبلغی از کلاینت پذیرفته یا استفاده نمی‌شود.
});

/** POST /orders */
export const POST = handle(async (req: Request) => {
  const user = await requireUser(req);
  const idempotencyKey = req.headers.get("idempotency-key")?.trim() ?? "";
  if (!idempotencyKey) {
    throw new ApiError(
      "IDEMPOTENCY_KEY_REQUIRED",
      "هدر Idempotency-Key برای ثبت سفارش الزامی است",
      400,
    );
  }
  const body = (await parseBody(req, createOrderSchema)) as CreateOrderInput;
  const result = await createOrder(user.id, idempotencyKey, body);
  return ok(result, result.replayed ? 200 : 201);
});

/** GET /orders */
export const GET = handle(async (req: Request) => {
  const user = await requireUser(req);
  const url = new URL(req.url);
  const page = await listBuyerOrders(user.id, {
    cursor: url.searchParams.get("cursor"),
    limit: Number(url.searchParams.get("limit") ?? 20),
  });
  return ok(page);
});
