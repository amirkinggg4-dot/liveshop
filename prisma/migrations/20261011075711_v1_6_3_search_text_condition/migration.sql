-- v1.6.3 — Persian-normalized searchText + Product.condition + trigram search
--
-- searchText is filled and kept in sync by the SHARED TypeScript function
-- normalizeFa (src/lib/normalize.ts) in seed and future create/edit paths.
-- The UPDATEs below are a one-time backfill for databases that were seeded
-- before this migration (same mapping, expressed in SQL so it can run on
-- already-seeded data without error):
--   ي ى → ی ، ك → ک ، ۀ ة → ه ، أ إ آ ٱ → ا
--   ۰-۹ and ٠-٩ → 0-9 ، remove tatweel/diacritics/ZWNJ ، lowercase ،
--   collapse whitespace + trim.

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('NEW', 'USED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "condition" "Condition" NOT NULL DEFAULT 'NEW',
ADD COLUMN "searchText" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "SellerProfile" ADD COLUMN "searchText" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Show" ADD COLUMN "searchText" TEXT NOT NULL DEFAULT '';

-- Trigram extension + GIN indexes.
-- The extension may live in ANY schema (the deploy search_path's schema, or
-- already installed in public from a previous deployment), so the opclass is
-- resolved dynamically and schema-qualified — the migration therefore applies
-- cleanly to ANY target schema (public, liveshop_test, a fresh tenant, …).
DO $$
DECLARE
  ext_schema text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE EXTENSION pg_trgm;
  END IF;
  SELECT n.nspname INTO ext_schema
  FROM pg_extension e
  JOIN pg_namespace n ON n.oid = e.extnamespace
  WHERE e.extname = 'pg_trgm';

  EXECUTE format(
    'CREATE INDEX "Product_searchText_trgm_idx" ON "Product" USING gin ("searchText" %I.gin_trgm_ops)',
    ext_schema);
  EXECUTE format(
    'CREATE INDEX "Show_searchText_trgm_idx" ON "Show" USING gin ("searchText" %I.gin_trgm_ops)',
    ext_schema);
  EXECUTE format(
    'CREATE INDEX "SellerProfile_searchText_trgm_idx" ON "SellerProfile" USING gin ("searchText" %I.gin_trgm_ops)',
    ext_schema);
END $$;

-- One-time backfill (mirrors normalizeFa in src/lib/normalize.ts)
-- Product: title + brand + category name
UPDATE "Product" AS p
SET "searchText" = btrim(regexp_replace(
      translate(
        lower(p."title" || ' ' || COALESCE(p."brand", '') || ' ' || c."nameFa"),
        'يىكۀةأإآٱ' || '۰۱۲۳۴۵۶۷۸۹' || '٠١٢٣٤٥٦٧٨٩' || 'ـًٌٍَُِّْٰٕٓٔ' || chr(8204),
        'ییکههاااا' || '0123456789' || '0123456789'
      ),
      '\s+', ' ', 'g'))
FROM "Category" c
WHERE c."id" = p."categoryId";

-- Show: title + category name
UPDATE "Show" AS s
SET "searchText" = btrim(regexp_replace(
      translate(
        lower(s."title" || ' ' || c."nameFa"),
        'يىكۀةأإآٱ' || '۰۱۲۳۴۵۶۷۸۹' || '٠١٢٣٤٥٦٧٨٩' || 'ـًٌٍَُِّْٰٕٓٔ' || chr(8204),
        'ییکههاااا' || '0123456789' || '0123456789'
      ),
      '\s+', ' ', 'g'))
FROM "Category" c
WHERE c."id" = s."categoryId";

-- SellerProfile: shopName + slug
UPDATE "SellerProfile" AS sp
SET "searchText" = btrim(regexp_replace(
      translate(
        lower(sp."shopName" || ' ' || sp."slug"),
        'يىكۀةأإآٱ' || '۰۱۲۳۴۵۶۷۸۹' || '٠١٢٣٤٥٦٧٨٩' || 'ـًٌٍَُِّْٰٕٓٔ' || chr(8204),
        'ییکههاااا' || '0123456789' || '0123456789'
      ),
      '\s+', ' ', 'g'));

-- GIN trigram indexes are created in the DO block above (schema-qualified
-- dynamically) so this migration applies to any target schema.
