-- Referral system: invite link rewards (referrer +3 FC, invitee +10,000 Diamonds)
-- Run in Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code
  ON profiles (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  referrer_fc_reward NUMERIC(12, 2) NOT NULL DEFAULT 3,
  referred_diamonds_reward BIGINT NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);

-- Ongoing referrer cut: 5% of house profit when a referred user loses a session
CREATE TABLE IF NOT EXISTS referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_name TEXT,
  wagered NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payout NUMERIC(12, 2) NOT NULL DEFAULT 0,
  house_profit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  referrer_share NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'FC' CHECK (currency IN ('FC', 'GC')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer_id ON referral_earnings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referred_id ON referral_earnings(referred_id);
