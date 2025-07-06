-- Remove chain_id and payout_recipient columns from coins table
ALTER TABLE coins 
DROP COLUMN IF EXISTS chain_id,
DROP COLUMN IF EXISTS payout_recipient;

-- Update any triggers or functions that might reference these columns
-- Check if the function exists before trying to update it
DO $$
BEGIN
    -- Drop any triggers that might use these columns
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_coin_creator_info') THEN
        DROP TRIGGER IF EXISTS update_coin_creator_info ON users;
    END IF;
    
    -- Update the function to not reference these columns
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
    
    -- Recreate the trigger
    CREATE TRIGGER update_coin_creator_info
        AFTER UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_coin_creator_info();
END$$;
