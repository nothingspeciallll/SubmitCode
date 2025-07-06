-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  coin_id INTEGER NOT NULL REFERENCES coins(id) ON DELETE CASCADE,
  fid INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  status TEXT NOT NULL DEFAULT 'active',
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_coin_promotion UNIQUE (coin_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_promotions_coin_id ON promotions(coin_id);
CREATE INDEX IF NOT EXISTS idx_promotions_fid ON promotions(fid);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);

-- Allow anyone to read promotions
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read promotions
CREATE POLICY promotions_select_policy ON promotions
  FOR SELECT USING (true);

-- For insert/update/delete, we'll use service_role access instead of RLS
-- This is because we're using fid (integer) for user identification
-- while Supabase auth uses UUID, making direct comparison difficult
-- We'll handle authorization in our application code instead
