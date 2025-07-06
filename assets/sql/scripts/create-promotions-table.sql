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

-- Add RLS policies
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read promotions
CREATE POLICY promotions_select_policy ON promotions
  FOR SELECT USING (true);

-- Only allow users to insert their own promotions
CREATE POLICY promotions_insert_policy ON promotions
  FOR INSERT WITH CHECK (
    fid = auth.uid()::integer
  );

-- Only allow users to update their own promotions
CREATE POLICY promotions_update_policy ON promotions
  FOR UPDATE USING (
    fid = auth.uid()::integer
  );

-- Only allow users to delete their own promotions
CREATE POLICY promotions_delete_policy ON promotions
  FOR DELETE USING (
    fid = auth.uid()::integer
  );
