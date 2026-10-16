import { db } from "@/lib/db";
import { errors, handle, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";

/**
 * GET /api/admin/seller-links?sellerProfileId=<id>   (ADMIN only)
 *
 * Returns the online-presence data (v2.0.6, onboarding step 5) of one
 * SellerProfile: its SellerLink rows + store address columns + the
 * profile-level linksPublic switch — for the ADMIN PANEL review UI.
 *
 * Guard: no dedicated admin guard existed, so the minimal check is done
 * here with the same helpers every other route uses — the Bearer JWT is
 * parsed by requireUser() (401 when missing/invalid) and the role must be
 * ADMIN (403 otherwise). No demo-query fallback on purpose.
 *
 * SECURITY (SECURITY.md):
 * - NO public endpoint may ever return these rows — public exposure
 *   (future storefront profile API) requires SellerProfile.linksPublic ===
 *   true AND SellerLink.isPublic === true.
 * - These values must never be fetched server-side for preview or
 *   verification (SSRF surface — see SECURITY.md). Storage/display only.
 */
export const GET = handle(async (req: Request) => {
  const user = await requireUser(req); // 401 when the Bearer JWT is missing/invalid
  if (user.role !== "ADMIN") throw errors.forbidden(); // 403 for non-admin roles

  const sellerProfileId = new URL(req.url).searchParams
    .get("sellerProfileId")
    ?.trim();
  if (!sellerProfileId) {
    throw errors.validation("شناسهٔ پروفایل فروشنده الزامی است");
  }

  const profile = await db.sellerProfile.findUnique({
    where: { id: sellerProfileId },
    select: {
      id: true,
      storeProvince: true,
      storeCity: true,
      storeAddress: true,
      storePhone: true,
      linksPublic: true,
    },
  });
  if (!profile) throw errors.notFound("پروفایل فروشنده پیدا نشد");

  const links = await db.sellerLink.findMany({
    where: { sellerProfileId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      kind: true,
      platform: true,
      value: true,
      isPublic: true,
      createdAt: true,
    },
  });

  const storeFilled =
    !!profile.storeProvince?.trim() ||
    !!profile.storeCity?.trim() ||
    !!profile.storeAddress?.trim() ||
    !!profile.storePhone?.trim();

  return ok({
    links,
    storeAddress: storeFilled
      ? {
          province: profile.storeProvince,
          city: profile.storeCity,
          address: profile.storeAddress,
          phone: profile.storePhone,
        }
      : null,
    linksPublic: profile.linksPublic,
  });
});
