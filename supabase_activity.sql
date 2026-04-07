-- Create a table to track game activity for trending and statistics
CREATE TABLE IF NOT EXISTS public.game_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_guest BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.game_activity ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (anyone can join a game)
DROP POLICY IF EXISTS "Public can insert activity" ON public.game_activity;
CREATE POLICY "Public can insert activity" ON public.game_activity
    FOR INSERT TO public
    WITH CHECK (true);

-- Allow anyone to read (for trending stats)
DROP POLICY IF EXISTS "Public can view activity" ON public.game_activity;
CREATE POLICY "Public can view activity" ON public.game_activity
    FOR SELECT TO public
    USING (true);

-- Index for performance on time-based queries
CREATE INDEX IF NOT EXISTS idx_game_activity_created_at ON public.game_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_game_activity_name ON public.game_activity(game_name);
