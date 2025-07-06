-- Add payment columns to promotions table
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS payment_hash TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS payment_currency TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS payment_amount TEXT;

-- Create index for payment hash for faster queries
CREATE INDEX IF NOT EXISTS idx_promotions_payment_hash ON promotions(payment_hash);

-- Update table comment
COMMENT ON TABLE promotions IS 'Store promotion records with payment information';
COMMENT ON COLUMN promotions.payment_hash IS 'Transaction hash of the payment';
COMMENT ON COLUMN promotions.payment_currency IS 'Currency used for payment (ETH, USDC)';
COMMENT ON COLUMN promotions.payment_amount IS 'Amount paid in wei/smallest unit'; 