/**
 * POST /api/v1/seller/orders/:id/ship — seller ships their own order (spec §6).
 * {carrier, trackingCode} → SHIPPED (+ Shipment row). Server-side ownership:
 * only the SellerProfile that owns the order may ship it.
 */
import { z } from "zod";
import { handle, ok, parseBody } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { shipOrderBySeller } from "@/lib/server/orders";

const shipSchema = z.object({
  // "courier" هم پذیرفته می‌شود (نام schema comment) و هم‌معنای peyk در fees.ts است
  carrier: z.enum(["tipax", "post", "peyk", "courier"]),
  trackingCode: z.string().trim().min(3).max(64),
});

export const POST = handle(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await requireUser(req);
    const { id } = await params;
    const body = await parseBody(req, shipSchema);
    const order = await shipOrderBySeller(user.id, id, body);
    return ok(order);
  },
);
