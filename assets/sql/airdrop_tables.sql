-- Create airdrop_pools table
CREATE TABLE IF NOT EXISTS airdrop_pools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_address TEXT NOT NULL,
    token_name TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    token_image TEXT,
    token_decimals INTEGER NOT NULL DEFAULT 18,
    total_amount TEXT NOT NULL, -- Store as string to handle large numbers
    depositor_fid BIGINT NOT NULL,
    depositor_username TEXT,
    transaction_hash TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    claim_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create airdrop_claims table
CREATE TABLE IF NOT EXISTS airdrop_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pool_id UUID NOT NULL REFERENCES airdrop_pools(id) ON DELETE CASCADE,
    claimer_fid BIGINT NOT NULL,
    claimer_username TEXT,
    amount_claimed TEXT NOT NULL DEFAULT '0', -- Store as string to handle large numbers
    transaction_hash TEXT,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_airdrop_pools_contract_address ON airdrop_pools(contract_address);
CREATE INDEX IF NOT EXISTS idx_airdrop_pools_depositor_fid ON airdrop_pools(depositor_fid);
CREATE INDEX IF NOT EXISTS idx_airdrop_pools_is_active ON airdrop_pools(is_active);
CREATE INDEX IF NOT EXISTS idx_airdrop_pools_created_at ON airdrop_pools(created_at);

CREATE INDEX IF NOT EXISTS idx_airdrop_claims_pool_id ON airdrop_claims(pool_id);
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_claimer_fid ON airdrop_claims(claimer_fid);
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_claimed_at ON airdrop_claims(claimed_at);

-- Create unique constraint to prevent double claiming from same pool
CREATE UNIQUE INDEX IF NOT EXISTS idx_airdrop_claims_unique_pool_claimer 
ON airdrop_claims(pool_id, claimer_fid);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_airdrop_pools_updated_at 
    BEFORE UPDATE ON airdrop_pools 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE airdrop_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE airdrop_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for airdrop_pools
-- Anyone can read active pools
CREATE POLICY "Allow read access to active airdrop pools" ON airdrop_pools
    FOR SELECT USING (is_active = true);

-- Only authenticated users can insert pools (will be handled by application logic)
CREATE POLICY "Allow insert for authenticated users" ON airdrop_pools
    FOR INSERT WITH CHECK (true);

-- Only pool creator can update their pools
CREATE POLICY "Allow pool creator to update their pools" ON airdrop_pools
    FOR UPDATE USING (depositor_fid = (current_setting('app.current_fid', true))::bigint);

-- RLS Policies for airdrop_claims
-- Anyone can read claims
CREATE POLICY "Allow read access to airdrop claims" ON airdrop_claims
    FOR SELECT USING (true);

-- Only authenticated users can insert claims (will be handled by application logic)
CREATE POLICY "Allow insert for authenticated users" ON airdrop_claims
    FOR INSERT WITH CHECK (true);

-- Users can only read their own claims for updates
CREATE POLICY "Allow users to update their own claims" ON airdrop_claims
    FOR UPDATE USING (claimer_fid = (current_setting('app.current_fid', true))::bigint);

-- Add helpful comments
COMMENT ON TABLE airdrop_pools IS 'Stores airdrop pool information when users deposit tokens';
COMMENT ON TABLE airdrop_claims IS 'Tracks individual claims from airdrop pools';

COMMENT ON COLUMN airdrop_pools.total_amount IS 'Total amount deposited in the pool (stored as string for large numbers)';
COMMENT ON COLUMN airdrop_pools.depositor_fid IS 'Farcaster ID of the user who deposited tokens';
COMMENT ON COLUMN airdrop_pools.claim_count IS 'Number of times this pool has been claimed from';

COMMENT ON COLUMN airdrop_claims.amount_claimed IS 'Amount claimed by user (stored as string for large numbers)';
COMMENT ON COLUMN airdrop_claims.claimer_fid IS 'Farcaster ID of the user who claimed tokens'; 