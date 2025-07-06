-- Update users table to ensure proper constraints and data types
ALTER TABLE users 
ALTER COLUMN fid SET NOT NULL,
ALTER COLUMN username DROP NOT NULL,
ALTER COLUMN display_name DROP NOT NULL;

-- Add constraint to ensure fid is positive
ALTER TABLE users 
ADD CONSTRAINT fid_positive CHECK (fid > 0);

-- Update the updated_at column to use a trigger for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
