-- Add fid column to coins table to track which user created each coin
ALTER TABLE coins ADD COLUMN IF NOT EXISTS fid INTEGER;

-- Add foreign key constraint to link with users table
ALTER TABLE coins ADD CONSTRAINT fk_coins_fid 
FOREIGN KEY (fid) REFERENCES users(fid) ON DELETE CASCADE;

-- Add unique constraint to ensure one coin per user
ALTER TABLE coins ADD CONSTRAINT unique_user_coin UNIQUE (fid);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_coins_fid ON coins(fid);

-- Update existing coins to set fid from creator_fid if available
UPDATE coins 
SET fid = creator_fid 
WHERE fid IS NULL AND creator_fid IS NOT NULL;
