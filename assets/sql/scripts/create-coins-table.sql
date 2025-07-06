-- Create coins table to store coin information
CREATE TABLE IF NOT EXISTS coins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  description TEXT,
  image_url TEXT,
  currency VARCHAR(10) NOT NULL DEFAULT 'ETH',
  creator_fid INTEGER NOT NULL,
  contract_address VARCHAR(42), -- Ethereum address format
  metadata_uri TEXT,
  payout_recipient VARCHAR(42),
  chain_id INTEGER,
  transaction_hash VARCHAR(66), -- Ethereum transaction hash format
  deployment_status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key to users table
  CONSTRAINT fk_creator_fid FOREIGN KEY (creator_fid) REFERENCES users(fid) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coins_creator_fid ON coins(creator_fid);
CREATE INDEX IF NOT EXISTS idx_coins_contract_address ON coins(contract_address);
CREATE INDEX IF NOT EXISTS idx_coins_symbol ON coins(symbol);
CREATE INDEX IF NOT EXISTS idx_coins_deployment_status ON coins(deployment_status);
CREATE INDEX IF NOT EXISTS idx_coins_created_at ON coins(created_at);

-- Create trigger for automatic updated_at updates
CREATE OR REPLACE FUNCTION update_coins_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_coins_updated_at ON coins;
CREATE TRIGGER update_coins_updated_at 
    BEFORE UPDATE ON coins 
    FOR EACH ROW 
    EXECUTE FUNCTION update_coins_updated_at_column();
