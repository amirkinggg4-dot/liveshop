/**
 * POST /api/v1/orders/:id/cancel — buyer cancels before shipment (spec §4).
 * Full refund ESCROW → buyer wallet; stock and soldCount restored.
 */
import { handle, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { cancelOrderByBuyer } from "@/lib/server/orders";

export const POST = handle(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await requireUser(req);
    const { id } = await params;
    const order = await cancelOrderByBuyer(user.id, id);
    return ok(order);
  },
);
