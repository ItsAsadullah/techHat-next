-- Phase 0: TechHat ERP Enterprise Migration
-- Safe additive-only SQL migration (no data loss)
-- Run this directly in your Supabase SQL editor

-- 1. Add new WarehouseType enum values (additive only)
DO $$ BEGIN
  ALTER TYPE "WarehouseType" ADD VALUE IF NOT EXISTS 'STORE';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "WarehouseType" ADD VALUE IF NOT EXISTS 'TRANSIT';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add costPrice column to order_items (for profit calculation)
ALTER TABLE "order_items" 
  ADD COLUMN IF NOT EXISTS "cost_price" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- 3. Add unitCost column to goods_receive_note_items (stores cost at receipt time)
ALTER TABLE "goods_receive_note_items"
  ADD COLUMN IF NOT EXISTS "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- 4. Add physical dimension columns to product_variants
ALTER TABLE "product_variants"
  ADD COLUMN IF NOT EXISTS "barcode" TEXT,
  ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "width" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "height" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "depth" DOUBLE PRECISION;

-- 5. Add supplierId FK and unitCost to supplier_products
ALTER TABLE "supplier_products"
  ADD COLUMN IF NOT EXISTS "supplier_id" TEXT,
  ADD COLUMN IF NOT EXISTS "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add FK constraint for supplier_id (nullable, so safe)
DO $$ BEGIN
  ALTER TABLE "supplier_products"
    ADD CONSTRAINT "supplier_products_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Add performance indexes to stock_ledgers
CREATE INDEX IF NOT EXISTS "stock_ledgers_date_idx" ON "stock_ledgers"("date");
CREATE INDEX IF NOT EXISTS "stock_ledgers_warehouse_date_idx" ON "stock_ledgers"("warehouse_id", "date");

-- 7. Add supplierId index to supplier_products
CREATE INDEX IF NOT EXISTS "supplier_products_supplier_id_idx" ON "supplier_products"("supplier_id");

-- Done!
COMMENT ON COLUMN "order_items"."cost_price" IS 'Cost price at time of sale for profit calculation';
COMMENT ON COLUMN "goods_receive_note_items"."unit_cost" IS 'Unit cost from PO at time of receipt';
