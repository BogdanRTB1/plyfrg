-- Run in Supabase SQL Editor (payment fixes)
-- Adds order_id for reliable IPN matching; stores NOWPayments payment_id as text

ALTER TABLE crypto_payments
  ADD COLUMN IF NOT EXISTS order_id TEXT;

ALTER TABLE crypto_payments
  ALTER COLUMN nowpayments_id TYPE TEXT USING nowpayments_id::TEXT;

CREATE INDEX IF NOT EXISTS idx_crypto_payments_order_id ON crypto_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_invoice_id ON crypto_payments(invoice_id);
