-- Add unique constraint to ensure one coin per user
ALTER TABLE coins 
ADD CONSTRAINT unique_creator_fid UNIQUE (creator_fid);

-- Update existing data to mark users who have created coins
UPDATE users 
SET 
    has_created_coin = TRUE,
    coin_id = c.id,
    coin_created_at = c.created_at,
    token_addr = c.contract_address
FROM coins c 
WHERE users.fid = c.creator_fid;
