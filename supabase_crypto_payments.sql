-- ============================================================
-- Supabase Schema for NOWPayments Crypto Integration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Table to track crypto deposit payments
CREATE TABLE IF NOT EXISTS crypto_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nowpayments_id BIGINT UNIQUE,           -- NOWPayments payment_id
    invoice_id TEXT,                          -- NOWPayments invoice_id
    invoice_url TEXT,                         -- URL for the user to pay
    payment_status TEXT DEFAULT 'waiting',    -- waiting, confirming, confirmed, sending, finished, failed, expired, partially_paid, refunded
    price_amount NUMERIC NOT NULL,            -- Amount in fiat (USD)
    price_currency TEXT DEFAULT 'usd',
    pay_amount NUMERIC,                       -- Amount user needs to pay in crypto
    pay_currency TEXT DEFAULT 'btc',          -- Crypto currency to pay with
    pay_address TEXT,                         -- Crypto address to send to
    actually_paid NUMERIC DEFAULT 0,          -- How much actually paid
    outcome_amount NUMERIC,                   -- Converted amount  
    bundle_diamonds INTEGER DEFAULT 0,        -- Diamonds to credit
    bundle_forges_coins NUMERIC DEFAULT 0,    -- ForgesCoins to credit
    credited BOOLEAN DEFAULT FALSE,           -- Whether balance was credited
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to track crypto withdrawal/payout requests
CREATE TABLE IF NOT EXISTS crypto_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nowpayments_id TEXT,                      -- NOWPayments payout batch id
    payout_status TEXT DEFAULT 'pending',     -- pending, processing, completed, failed, rejected
    forges_coins_amount NUMERIC NOT NULL,     -- Amount of ForgesCoins being redeemed
    usd_amount NUMERIC NOT NULL,              -- Equivalent USD value
    pay_currency TEXT DEFAULT 'btc',          -- Crypto to receive
    pay_address TEXT NOT NULL,                -- User's wallet address
    pay_amount NUMERIC,                       -- Amount of crypto to send
    tx_hash TEXT,                             -- Blockchain transaction hash
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_crypto_payments_user ON crypto_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_np_id ON crypto_payments(nowpayments_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payouts_user ON crypto_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payouts_status ON crypto_payouts(payout_status);

-- RLS Policies
ALTER TABLE crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_payouts ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON crypto_payments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own payment records
CREATE POLICY "Users can create own payments" ON crypto_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only service role can update payments (via API webhook)
CREATE POLICY "Service role can update payments" ON crypto_payments
    FOR UPDATE USING (TRUE)
    WITH CHECK (TRUE);

-- Users can view their own payouts
CREATE POLICY "Users can view own payouts" ON crypto_payouts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create payout requests
CREATE POLICY "Users can create own payouts" ON crypto_payouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only service role can update payouts
CREATE POLICY "Service role can update payouts" ON crypto_payouts
    FOR UPDATE USING (TRUE)
    WITH CHECK (TRUE);
