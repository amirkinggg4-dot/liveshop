-- v2.0.6 — Seller onboarding step 5 «حضور آنلاین» (online presence):
-- SellerLinkKind enum + one SellerLink row per submitted link (canonical
-- URL, http/https only — never fetched server-side, see SECURITY.md) and
-- the physical store address columns + profile-level linksPublic switch
-- on SellerProfile. All tolerant of empty values (nullable / default false).

CREATE TYPE "SellerLinkKind" AS ENUM ('WEBSITE', 'SOCIAL', 'STORE', 'OTHER_PLATFORM');

CREATE TABLE "SellerLink" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "kind" "SellerLinkKind" NOT NULL,
    "platform" TEXT,
    "value" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerLink_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SellerLink" ADD CONSTRAINT "SellerLink_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "SellerLink_sellerProfileId_idx" ON "SellerLink"("sellerProfileId");

ALTER TABLE "SellerProfile" ADD COLUMN "storeProvince" TEXT,
  ADD COLUMN "storeCity" TEXT,
  ADD COLUMN "storeAddress" TEXT,
  ADD COLUMN "storePhone" TEXT,
  ADD COLUMN "linksPublic" BOOLEAN NOT NULL DEFAULT false;
