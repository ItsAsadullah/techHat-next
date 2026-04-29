-- Add optional short code fields for SKU mapping
ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "short_code" TEXT;

ALTER TABLE "brands"
  ADD COLUMN IF NOT EXISTS "short_code" TEXT;