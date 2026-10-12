/**
 * GET /api/v1/orders/:id — a single order, visible ONLY to its buyer.
 */
import { handle, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { getBuyerOrder } from "@/lib/server/orders";

export const GET = handle(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await requireUser(req);
    const { id } = await params;
    const order = await getBuyerOrder(user.id, id);
    return ok(order);
  },
);
