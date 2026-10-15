-- v2.0.4 — Seller type (onboarding step 3): enum SellerType on
-- SellerProfile (default INDIVIDUAL so existing/empty rows stay valid)
-- plus nullable BUSINESS-only fields (companyName, companyNationalId,
-- economicCode, registrationNumber). Nullable = tolerant of empty values.
-- Mirrors prisma/schema.prisma (model SellerProfile).
-- SENSITIVE-DATA DESIGN (comment only, encryption implemented later):
-- companyNationalId and economicCode are KYC-grade secrets like
-- nationalIdHash — planned to be encrypted at rest (nationalIdHash
-- pattern) and masked in any UI/log/toast.

CREATE TYPE "SellerType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

ALTER TABLE "SellerProfile" ADD COLUMN "sellerType" "SellerType" NOT NULL DEFAULT 'INDIVIDUAL',
  ADD COLUMN "companyName" TEXT,
  ADD COLUMN "companyNationalId" TEXT,
  ADD COLUMN "economicCode" TEXT,
  ADD COLUMN "registrationNumber" TEXT;
