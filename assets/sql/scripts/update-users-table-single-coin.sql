-- Update users table to support single coin per user
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS has_created_coin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS coin_id INTEGER,
ADD COLUMN IF NOT EXISTS coin_created_at TIMESTAMP WITH TIME ZONE;

-- Add foreign key constraint to coins table
ALTER TABLE users 
ADD CONSTRAINT fk_user_coin_id FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_coin_id ON users(coin_id);
CREATE INDEX IF NOT EXISTS idx_users_has_created_coin ON users(has_created_coin);

-- Create function to update user when coin is created
CREATE OR REPLACE FUNCTION update_user_coin_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user's coin status when a new coin is created
    UPDATE users 
    SET 
        has_created_coin = TRUE,
        coin_id = NEW.id,
        coin_created_at = NEW.created_at,
        token_addr = NEW.contract_address,
        updated_at = NOW()
    WHERE fid = NEW.creator_fid;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user status when coin is created
DROP TRIGGER IF EXISTS trigger_update_user_coin_status ON coins;
CREATE TRIGGER trigger_update_user_coin_status
    AFTER INSERT ON coins
    FOR EACH ROW
    EXECUTE FUNCTION update_user_coin_status();

-- Create function to update user when coin contract is deployed
CREATE OR REPLACE FUNCTION update_user_coin_contract()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user's token address when coin is deployed
    IF NEW.contract_address IS NOT NULL AND OLD.contract_address IS NULL THEN
        UPDATE users 
        SET 
            token_addr = NEW.contract_address,
            updated_at = NOW()
        WHERE fid = NEW.creator_fid;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update user when coin contract is deployed
DROP TRIGGER IF EXISTS trigger_update_user_coin_contract ON coins;
CREATE TRIGGER trigger_update_user_coin_contract
    AFTER UPDATE ON coins
    FOR EACH ROW
    EXECUTE FUNCTION update_user_coin_contract();
