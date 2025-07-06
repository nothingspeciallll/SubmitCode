-- Create daily_claims table to track user claims
CREATE TABLE IF NOT EXISTS daily_claims (
  id SERIAL PRIMARY KEY,
  user_fid INTEGER NOT NULL,
  claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
  token_name VARCHAR(255) NOT NULL,
  token_symbol VARCHAR(50) NOT NULL,
  token_rarity VARCHAR(20) NOT NULL,
  token_image VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key to users table
  CONSTRAINT fk_user_fid FOREIGN KEY (user_fid) REFERENCES users(fid) ON DELETE CASCADE,
  
  -- Ensure one claim per user per day
  CONSTRAINT unique_daily_claim UNIQUE (user_fid, claim_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_claims_user_fid ON daily_claims(user_fid);
CREATE INDEX IF NOT EXISTS idx_daily_claims_date ON daily_claims(claim_date);
CREATE INDEX IF NOT EXISTS idx_daily_claims_rarity ON daily_claims(token_rarity);

-- Create function to get user's claim status for today
CREATE OR REPLACE FUNCTION can_claim_today(p_user_fid INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM daily_claims 
        WHERE user_fid = p_user_fid 
        AND claim_date = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to record a claim
CREATE OR REPLACE FUNCTION record_daily_claim(
    p_user_fid INTEGER,
    p_token_name VARCHAR(255),
    p_token_symbol VARCHAR(50),
    p_token_rarity VARCHAR(20),
    p_token_image VARCHAR(10)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user can claim today
    IF NOT can_claim_today(p_user_fid) THEN
        RETURN FALSE;
    END IF;
    
    -- Record the claim
    INSERT INTO daily_claims (user_fid, token_name, token_symbol, token_rarity, token_image)
    VALUES (p_user_fid, p_token_name, p_token_symbol, p_token_rarity, p_token_image);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
