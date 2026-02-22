-- ============================================================
-- TechHat Order Lifecycle System — Migration
-- Run this against your Supabase DB (SQL Editor)
-- ============================================================

-- 1. NEW ENUM: Expanded OrderStatus
DO $$ BEGIN
  -- Drop old type after renaming column default (safe ALTER)
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PACKED';
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY';
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'REFUND_REQUESTED';
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'FAILED';
EXCEPTION WHEN others THEN NULL;
END $$;

-- 2. NEW ENUM: Expanded PaymentStatus
DO $$ BEGIN
  ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'UNPAID';
  ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID';
EXCEPTION WHEN others THEN NULL;
END $$;

-- 3. NEW COLUMNS on orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_token   TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS coupon_code      TEXT,
  ADD COLUMN IF NOT EXISTS coupon_discount  FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mobile_provider  TEXT,
  ADD COLUMN IF NOT EXISTS mobile_number    TEXT,
  ADD COLUMN IF NOT EXISTS ip_address       TEXT,
  ADD COLUMN IF NOT EXISTS sub_total        FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_amount    FLOAT,
  ADD COLUMN IF NOT EXISTS refund_note      TEXT,
  ADD COLUMN IF NOT EXISTS cancel_reason    TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS internal_note    TEXT,
  ADD COLUMN IF NOT EXISTS user_id          TEXT REFERENCES users(id) ON DELETE SET NULL;

-- Generate tracking tokens for existing orders without one
UPDATE orders
SET tracking_token = gen_random_uuid()::text
WHERE tracking_token IS NULL;

-- Make tracking_token NOT NULL after backfilling
ALTER TABLE orders ALTER COLUMN tracking_token SET NOT NULL;

-- 4. CREATE: order_events table (audit log for status changes)
CREATE TABLE IF NOT EXISTS order_events (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,   -- STATUS_CHANGE, PAYMENT_UPDATE, NOTE_ADDED, etc.
  old_status   TEXT,
  new_status   TEXT,
  old_payment_status TEXT,
  new_payment_status TEXT,
  changed_by   TEXT,            -- user email or 'system' or 'admin'
  note         TEXT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_created_at ON order_events(created_at DESC);

-- 5. CREATE: ip_rate_limits table (fraud prevention)
CREATE TABLE IF NOT EXISTS ip_rate_limits (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ip_address   TEXT NOT NULL,
  action       TEXT NOT NULL,   -- 'order_create', 'coupon_apply', 'payment_retry'
  count        INT  DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ip_rate_action ON ip_rate_limits(ip_address, action);
CREATE INDEX IF NOT EXISTS idx_ip_rate_window ON ip_rate_limits(ip_address, window_start);

-- 6. CREATE: order_counter for sequential TH-YYYY-XXXXXX numbers
CREATE TABLE IF NOT EXISTS order_counter (
  year    INT PRIMARY KEY,
  seq     INT DEFAULT 0
);

-- Backfill existing order count for current year
INSERT INTO order_counter(year, seq)
SELECT 
  EXTRACT(YEAR FROM now())::int,
  COUNT(*) 
FROM orders
WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now())
ON CONFLICT (year) DO NOTHING;

-- 7. FUNCTION: atomic order number generator
CREATE OR REPLACE FUNCTION next_order_number()
RETURNS TEXT AS $$
DECLARE
  yr  INT := EXTRACT(YEAR FROM now())::int;
  seq INT;
BEGIN
  INSERT INTO order_counter(year, seq) VALUES (yr, 1)
  ON CONFLICT (year) DO UPDATE SET seq = order_counter.seq + 1
  RETURNING order_counter.seq INTO seq;
  
  RETURN 'TH-' || yr || '-' || LPAD(seq::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 8. FUNCTION: trigger to auto-log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status OR
     OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO order_events(
      order_id, event_type,
      old_status, new_status,
      old_payment_status, new_payment_status,
      changed_by, created_at
    ) VALUES (
      NEW.id,
      CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'STATUS_CHANGE' ELSE 'PAYMENT_UPDATE' END,
      OLD.status::text, NEW.status::text,
      OLD.payment_status::text, NEW.payment_status::text,
      current_setting('app.current_user', true),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_status_log ON orders;
CREATE TRIGGER trg_order_status_log
  AFTER UPDATE OF status, payment_status ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- 9. RLS POLICIES (Supabase Row Level Security)

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating
DROP POLICY IF EXISTS "orders_owner_read" ON orders;
DROP POLICY IF EXISTS "orders_tracking_read" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;

-- Users can read their own orders
CREATE POLICY "orders_owner_read" ON orders
  FOR SELECT
  USING (
    auth.uid()::text = user_id
    OR user_id IS NULL  -- guest order with no user_id
  );

-- Allow reading own order events
CREATE POLICY "events_owner_read" ON order_events
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()::text
    )
  );

-- Allow inserts from authenticated and anonymous (for guest orders)
-- Service role bypasses RLS, so API routes using service key can always insert
CREATE POLICY "orders_insert" ON orders
  FOR INSERT
  WITH CHECK (true);

-- IP rate limits are only accessible by service role
CREATE POLICY "ip_rate_limit_service_only" ON ip_rate_limits
  FOR ALL
  USING (false);  -- only service role bypasses this

-- 10. INDEX performance improvements
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Done
SELECT 'Order lifecycle migration complete.' AS result;
