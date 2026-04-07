-- Create a table for user game history (consolidated sessions)
CREATE TABLE IF NOT EXISTS public.user_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_name TEXT NOT NULL,
    game_image TEXT,
    wagered NUMERIC NOT NULL,
    payout NUMERIC NOT NULL,
    profit NUMERIC NOT NULL,
    status TEXT NOT NULL, -- 'win' | 'loss'
    currency TEXT DEFAULT 'FC', -- 'FC' (Forges Coins)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;

-- SELECT/INSERT Policies
DROP POLICY IF EXISTS "Users can view own history" ON public.user_history;
CREATE POLICY "Users can view own history" ON public.user_history
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own history" ON public.user_history;
CREATE POLICY "Users can insert own history" ON public.user_history
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON public.user_history(user_id);
