-- Create users table with Farcaster integration
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  fid INTEGER UNIQUE NOT NULL,
  username VARCHAR(255),
  display_name VARCHAR(255),
  pfp_url TEXT,
  token_addr VARCHAR(42), -- Ethereum address format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on fid for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_fid ON users(fid);

-- Create index on token_addr for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_token_addr ON users(token_addr);
