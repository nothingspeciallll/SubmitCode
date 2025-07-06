-- Fix RLS policies for promotions table
-- Since we're using Farcaster FID instead of Supabase auth, we need to remove restrictive RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS promotions_insert_policy ON promotions;
DROP POLICY IF EXISTS promotions_update_policy ON promotions;
DROP POLICY IF EXISTS promotions_delete_policy ON promotions;

-- Keep read access for everyone
-- CREATE POLICY promotions_select_policy ON promotions FOR SELECT USING (true); -- This should already exist

-- Allow all inserts (we'll handle authorization in application code)
CREATE POLICY promotions_insert_policy ON promotions
  FOR INSERT WITH CHECK (true);

-- Allow all updates (we'll handle authorization in application code)  
CREATE POLICY promotions_update_policy ON promotions
  FOR UPDATE USING (true);

-- Allow all deletes (we'll handle authorization in application code)
CREATE POLICY promotions_delete_policy ON promotions
  FOR DELETE USING (true);

-- Alternative: Disable RLS completely for promotions table
-- This is simpler but less secure, use only if the above doesn't work
-- ALTER TABLE promotions DISABLE ROW LEVEL SECURITY; 