-- Update users table to store Neynar data
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS custody_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location_city VARCHAR(255),
ADD COLUMN IF NOT EXISTS location_state VARCHAR(255),
ADD COLUMN IF NOT EXISTS location_country VARCHAR(255),
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verifications JSONB,
ADD COLUMN IF NOT EXISTS verified_addresses JSONB,
ADD COLUMN IF NOT EXISTS verified_accounts JSONB,
ADD COLUMN IF NOT EXISTS power_badge BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS neynar_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_neynar_sync TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_custody_address ON users(custody_address);
CREATE INDEX IF NOT EXISTS idx_users_follower_count ON users(follower_count);
CREATE INDEX IF NOT EXISTS idx_users_power_badge ON users(power_badge);
