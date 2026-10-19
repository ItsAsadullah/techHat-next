-- Nullable for existing adjustments: historical counts must not be invented.
ALTER TABLE "stock_adjustment_items"
  ADD COLUMN IF NOT EXISTS "system_qty" INTEGER,
  ADD COLUMN IF NOT EXISTS "actual_qty" INTEGER;
