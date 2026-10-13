-- v2.0.3 — Category tree: optional self-relation (parentId) for subcategories.
-- parentId = NULL → top-level category (the original 10 rows);
-- otherwise the row is a subcategory of another category.
-- Mirrors prisma/schema.prisma (model Category) — applied by
-- `prisma migrate deploy` on fresh environments; dev databases use
-- `bun run db:push` (the plain column/index needs no raw extras).

ALTER TABLE "Category" ADD COLUMN "parentId" TEXT;

ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Category"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
