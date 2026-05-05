-- ============================================================
-- Creator Analytics Tables for PlayForges
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Drop existing policies & tables to start fresh (safe for first-time run too)
DO $$ BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Allow inserts" ON creator_earnings;
    DROP POLICY IF EXISTS "Allow inserts" ON creator_game_plays;
    DROP POLICY IF EXISTS "Allow inserts" ON creator_profile_views;
    DROP POLICY IF EXISTS "Allow inserts" ON creator_follows;
    DROP POLICY IF EXISTS "Creators read own earnings" ON creator_earnings;
    DROP POLICY IF EXISTS "Creators read own plays" ON creator_game_plays;
    DROP POLICY IF EXISTS "Creators read own views" ON creator_profile_views;
    DROP POLICY IF EXISTS "Creators read own follows" ON creator_follows;
    DROP POLICY IF EXISTS "Service read all earnings" ON creator_earnings;
    DROP POLICY IF EXISTS "Service read all plays" ON creator_game_plays;
    DROP POLICY IF EXISTS "Service read all views" ON creator_profile_views;
    DROP POLICY IF EXISTS "Service read all follows" ON creator_follows;
    DROP POLICY IF EXISTS "Anyone can insert earnings" ON creator_earnings;
    DROP POLICY IF EXISTS "Anyone can insert plays" ON creator_game_plays;
    DROP POLICY IF EXISTS "Anyone can insert views" ON creator_profile_views;
    DROP POLICY IF EXISTS "Anyone can insert follows" ON creator_follows;
    DROP POLICY IF EXISTS "Anyone can read earnings" ON creator_earnings;
    DROP POLICY IF EXISTS "Anyone can read plays" ON creator_game_plays;
    DROP POLICY IF EXISTS "Anyone can read views" ON creator_profile_views;
    DROP POLICY IF EXISTS "Anyone can read follows" ON creator_follows;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP TABLE IF EXISTS creator_earnings CASCADE;
DROP TABLE IF EXISTS creator_game_plays CASCADE;
DROP TABLE IF EXISTS creator_profile_views CASCADE;
DROP TABLE IF EXISTS creator_follows CASCADE;

-- 1. Creator Earnings — records profit from player losses per session
CREATE TABLE creator_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    game_name TEXT NOT NULL DEFAULT '',
    player_id TEXT,
    wagered NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payout NUMERIC(12, 2) NOT NULL DEFAULT 0,
    profit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'FC',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Creator Game Plays — tracks every session on a creator's game
CREATE TABLE creator_game_plays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    game_name TEXT NOT NULL DEFAULT '',
    player_id TEXT,
    wagered NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payout NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'FC',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Creator Profile Views — logs when someone visits a creator's profile
CREATE TABLE creator_profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id TEXT NOT NULL,
    viewer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Creator Follows — tracks follower relationships
CREATE TABLE creator_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id TEXT NOT NULL,
    follower_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(creator_id, follower_id)
);

-- Indexes for performance
CREATE INDEX idx_ce_creator ON creator_earnings(creator_id);
CREATE INDEX idx_ce_created ON creator_earnings(created_at);
CREATE INDEX idx_cgp_creator ON creator_game_plays(creator_id);
CREATE INDEX idx_cgp_created ON creator_game_plays(created_at);
CREATE INDEX idx_cpv_creator ON creator_profile_views(creator_id);
CREATE INDEX idx_cf_creator ON creator_follows(creator_id);

-- Enable RLS
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_game_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_follows ENABLE ROW LEVEL SECURITY;

-- Policies: Allow anyone to INSERT (players recording their play sessions)
CREATE POLICY "Anyone can insert earnings" ON creator_earnings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert plays" ON creator_game_plays FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert views" ON creator_profile_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert follows" ON creator_follows FOR INSERT WITH CHECK (true);

-- Policies: Allow anyone to READ (dashboard reads its own data by filtering in app code)
CREATE POLICY "Anyone can read earnings" ON creator_earnings FOR SELECT USING (true);
CREATE POLICY "Anyone can read plays" ON creator_game_plays FOR SELECT USING (true);
CREATE POLICY "Anyone can read views" ON creator_profile_views FOR SELECT USING (true);
CREATE POLICY "Anyone can read follows" ON creator_follows FOR SELECT USING (true);

-- GRANT permissions to anon and authenticated roles (CRITICAL for Supabase client access)
GRANT SELECT, INSERT ON creator_earnings TO anon, authenticated;
GRANT SELECT, INSERT ON creator_game_plays TO anon, authenticated;
GRANT SELECT, INSERT ON creator_profile_views TO anon, authenticated;
GRANT SELECT, INSERT ON creator_follows TO anon, authenticated;
