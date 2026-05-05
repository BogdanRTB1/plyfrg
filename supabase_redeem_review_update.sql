-- ============================================================
-- Redeem verification workflow update
-- Run this in Supabase SQL Editor
-- ============================================================

-- 0) Admin flag in profiles (used by admin panel/API guard)
ALTER TABLE IF EXISTS profiles
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 1) Extend crypto_payouts for manual verification flow
ALTER TABLE IF EXISTS crypto_payouts
    ADD COLUMN IF NOT EXISTS requester_email TEXT,
    ADD COLUMN IF NOT EXISTS completed TEXT NOT NULL DEFAULT 'no',
    ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2) Ensure completed is strictly yes/no
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'crypto_payouts_completed_check'
    ) THEN
        ALTER TABLE crypto_payouts
            ADD CONSTRAINT crypto_payouts_completed_check
            CHECK (completed IN ('yes', 'no'));
    END IF;
END $$;

-- 3) Optional helpful indexes for admin filtering
CREATE INDEX IF NOT EXISTS idx_crypto_payouts_completed ON crypto_payouts(completed);
CREATE INDEX IF NOT EXISTS idx_crypto_payouts_email ON crypto_payouts(requester_email);

-- 4) Backfill existing rows safely
UPDATE crypto_payouts
SET completed = 'no'
WHERE completed IS NULL;

-- 4b) Tighten RLS on crypto_payouts updates (admins/service only)
DROP POLICY IF EXISTS "Service role can update payouts" ON crypto_payouts;

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

CREATE POLICY "Admins can view all payouts" ON crypto_payouts
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can update payouts" ON crypto_payouts
    FOR UPDATE USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- 5) Optional admin view for quick review in dashboard / SQL
CREATE OR REPLACE VIEW admin_redeem_requests AS
SELECT
    p.id,
    p.user_id,
    u.email AS account_email,
    p.requester_email,
    p.forges_coins_amount,
    p.usd_amount,
    p.pay_currency,
    p.pay_address,
    p.payout_status,
    p.completed,
    p.admin_notes,
    p.created_at,
    p.updated_at
FROM crypto_payouts p
LEFT JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC;

-- 6) Example: grant admin rights to a specific account email
-- Replace with your real email before running:
-- UPDATE profiles
-- SET is_admin = TRUE
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'you@example.com'
-- );
