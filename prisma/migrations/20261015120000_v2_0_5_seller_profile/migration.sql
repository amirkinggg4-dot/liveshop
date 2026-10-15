-- v2.0.5 — Seller onboarding step 4 «ویژگی‌های فروش»:
-- sellChannels (TEXT[], allowed values mirror SELL_CHANNEL_IDS:
-- website/social/physical_store/other_platforms/just_starting) and
-- optional businessKind enum for the BUSINESS variant. Both tolerant
-- of empty values (default empty array / NULL).

CREATE TYPE "BusinessKind" AS ENUM ('RESELLER', 'LIQUIDATOR', 'BRAND', 'RETAILER', 'CONSIGNMENT');

ALTER TABLE "SellerProfile" ADD COLUMN "sellChannels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "businessKind" "BusinessKind";
