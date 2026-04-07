-- Create a SEPARATE table to store user balances to avoid touching existing profiles
CREATE TABLE IF NOT EXISTS public.user_balances (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    diamonds BIGINT DEFAULT 0,
    forges_coins NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view own balance" ON public.user_balances;
DROP POLICY IF EXISTS "Users can update own balance" ON public.user_balances;
DROP POLICY IF EXISTS "Users can insert own balance" ON public.user_balances;

-- SELECT: users can read their own balance
CREATE POLICY "Users can view own balance" ON public.user_balances
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- UPDATE: users can update their own balance
CREATE POLICY "Users can update own balance" ON public.user_balances
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

-- INSERT: users can insert their own balance row (fallback if trigger didn't fire)
CREATE POLICY "Users can insert own balance" ON public.user_balances
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Function to handle auto-creation for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_balance()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_balances (id, diamonds, forges_coins)
  VALUES (new.id, 0, 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created_balance ON auth.users;
CREATE TRIGGER on_auth_user_created_balance
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_balance();

-- MIGRATION: If you already have rows with old defaults, update them:
-- UPDATE public.user_balances SET diamonds = 0, forges_coins = 0 WHERE diamonds = 100000;

-- Also fix column defaults if table already exists:
ALTER TABLE public.user_balances ALTER COLUMN diamonds SET DEFAULT 0;
ALTER TABLE public.user_balances ALTER COLUMN forges_coins SET DEFAULT 0;
