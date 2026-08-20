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

-- 5. Enable Realtime Replication
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
