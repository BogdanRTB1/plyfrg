-- ============================================================
-- Creator Games persistence schema
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS creator_games (
    id TEXT PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_name TEXT,
    game_name TEXT NOT NULL,
    game_type TEXT NOT NULL,
    game_data JSONB NOT NULL,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_games_creator_id ON creator_games(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_games_published_at ON creator_games(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_games_game_name ON creator_games(LOWER(game_name));

ALTER TABLE creator_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can view all published games" ON creator_games;
CREATE POLICY "Creators can view all published games" ON creator_games
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators can insert own games" ON creator_games;
CREATE POLICY "Creators can insert own games" ON creator_games
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can update own games" ON creator_games;
CREATE POLICY "Creators can update own games" ON creator_games
    FOR UPDATE USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can delete own games" ON creator_games;
CREATE POLICY "Creators can delete own games" ON creator_games
    FOR DELETE USING (auth.uid() = creator_id);
