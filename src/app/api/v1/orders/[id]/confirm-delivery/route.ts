/**
 * POST /api/v1/orders/:id/confirm-delivery — buyer-only (spec §4).
 * SHIPPED → RELEASED; ESCROW → SELLER_PAYABLE (+commission → PLATFORM_REVENUE).
 * Idempotent: calling twice never moves money twice.
 */
import { handle, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { confirmDeliveryByBuyer } from "@/lib/server/orders";

export const POST = handle(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await requireUser(req);
    const { id } = await params;
    const result = await confirmDeliveryByBuyer(user.id, id);
    return ok(result, result.alreadyReleased ? 200 : 200);
  },
);
