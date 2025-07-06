-- Add user display name and username to coins table for better search
ALTER TABLE coins 
ADD COLUMN IF NOT EXISTS creator_display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS creator_username VARCHAR(255);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_coins_creator_display_name ON coins(creator_display_name);
CREATE INDEX IF NOT EXISTS idx_coins_creator_username ON coins(creator_username);

-- Create a function to update coin creator info when user info changes
CREATE OR REPLACE FUNCTION update_coin_creator_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all coins created by this user
    UPDATE coins 
    SET 
        creator_display_name = NEW.display_name,
        creator_username = NEW.username,
        updated_at = NOW()
    WHERE creator_fid = NEW.fid;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update coin creator info when user info changes
DROP TRIGGER IF EXISTS trigger_update_coin_creator_info ON users;
CREATE TRIGGER trigger_update_coin_creator_info
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_coin_creator_info();

-- Backfill existing coins with creator info
UPDATE coins 
SET 
    creator_display_name = users.display_name,
    creator_username = users.username
FROM users 
WHERE coins.creator_fid = users.fid 
AND (coins.creator_display_name IS NULL OR coins.creator_username IS NULL);
