-- ============================================================================
-- SPORTSFORALL SUPABASE MIGRATION: PAYMENTS TABLE
-- Creates:
-- 1. payments table for Razorpay transactions
-- 2. RLS policies allowing SELECT/INSERT for all, and restricted UPDATE
-- 3. Enables Postgres Realtime for instant payment status updates
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  student_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created', 'verified', 'failed')) DEFAULT 'created',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- Configure Row Level Security (RLS)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 1. Allow read access for authenticated & anonymous users
DROP POLICY IF EXISTS "Allow select for all" ON payments;
CREATE POLICY "Allow select for all" ON payments 
FOR SELECT 
USING (true);

-- 2. Allow insert access (when order is created)
DROP POLICY IF EXISTS "Allow insert for all" ON payments;
CREATE POLICY "Allow insert for all" ON payments 
FOR INSERT 
WITH CHECK (true);

-- 3. Allow update access (Service Role / Edge Functions only for status verification)
DROP POLICY IF EXISTS "Allow update for service role" ON payments;
CREATE POLICY "Allow update for service role" ON payments 
FOR UPDATE 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 4. Enable Realtime Replication for payments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payments;
  END IF;
END $$;
