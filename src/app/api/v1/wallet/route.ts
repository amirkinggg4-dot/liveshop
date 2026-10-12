/**
 * GET /api/v1/wallet — balance + cursor-paged entry history (spec §5).
 */
import { handle, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { getWalletView } from "@/lib/server/wallet";

export const GET = handle(async (req: Request) => {
  const user = await requireUser(req);
  const url = new URL(req.url);
  const view = await getWalletView(user.id, {
    cursor: url.searchParams.get("cursor"),
    limit: Number(url.searchParams.get("limit") ?? 20),
  });
  return ok(view);
});
