-- Game history & activity (History page + ForgeCoins leaderboard)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    game_name TEXT NOT NULL,
    game_image TEXT,
    wagered NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payout NUMERIC(12, 2) NOT NULL DEFAULT 0,
    profit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'loss',
    currency TEXT NOT NULL DEFAULT 'FC' CHECK (currency IN ('FC', 'GC')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leaderboard: filter by game + FC currency
CREATE INDEX IF NOT EXISTS idx_user_history_game_fc
    ON user_history (game_name, currency)
    WHERE currency = 'FC' AND payout > 0;

CREATE INDEX IF NOT EXISTS idx_user_history_user_created
    ON user_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_activity_game_created
    ON game_activity (game_name, created_at DESC);

ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own history" ON user_history;
CREATE POLICY "Users read own history" ON user_history
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own history" ON user_history;
CREATE POLICY "Users insert own history" ON user_history
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert game activity" ON game_activity;
CREATE POLICY "Anyone can insert game activity" ON game_activity
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read game activity" ON game_activity;
CREATE POLICY "Anyone can read game activity" ON game_activity
    FOR SELECT USING (true);

GRANT SELECT, INSERT ON user_history TO authenticated;
GRANT SELECT, INSERT ON game_activity TO anon, authenticated;
