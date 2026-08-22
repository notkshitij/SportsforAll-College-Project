-- ============================================================================
-- SPORTSFORALL SUPABASE MIGRATION
-- Fixes:
-- 1. Adds missing columns (verified_by, verified_at) to pass_history
-- 2. Updates status check constraint to permit 'CheckedIn' & 'CheckedOut'
-- 3. Configures RLS policies allowing SELECT, INSERT, and UPDATE for anon role
-- 4. Enables Postgres Realtime for instant pass status synchronization
-- ============================================================================

-- 1. Add verified_by and verified_at columns
ALTER TABLE pass_history 
ADD COLUMN IF NOT EXISTS verified_by TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 2. Drop old check constraint that only allowed 'valid'/'expired'
ALTER TABLE pass_history 
DROP CONSTRAINT IF EXISTS pass_history_status_check;

-- 3. Add comprehensive check constraint
ALTER TABLE pass_history 
ADD CONSTRAINT pass_history_status_check 
CHECK (status IN ('valid', 'expired', 'CheckedIn', 'CheckedOut', 'Pending', 'Verified', 'Failed'));

-- 4. Configure RLS Policies
ALTER TABLE pass_history ENABLE ROW LEVEL SECURITY;

-- Allow read access
DROP POLICY IF EXISTS "Allow select for all" ON pass_history;
CREATE POLICY "Allow select for all" ON pass_history 
FOR SELECT 
USING (true);

-- Allow insert/create pass
DROP POLICY IF EXISTS "Allow insert for all" ON pass_history;
CREATE POLICY "Allow insert for all" ON pass_history 
FOR INSERT 
WITH CHECK (true);

-- Allow update pass status (Entry/Exit Approval)
DROP POLICY IF EXISTS "Allow update for gate guards" ON pass_history;
CREATE POLICY "Allow update for gate guards" ON pass_history 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 5. Enable Realtime Replication for pass_history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'pass_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pass_history;
  END IF;
END $$;

-- 6. Payments Table & RLS (Razorpay Server-Side Order & Verification)
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

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON payments;
CREATE POLICY "Allow select for all" ON payments 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert for all" ON payments;
CREATE POLICY "Allow insert for all" ON payments 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for service role" ON payments;
CREATE POLICY "Allow update for service role" ON payments 
FOR UPDATE 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

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

