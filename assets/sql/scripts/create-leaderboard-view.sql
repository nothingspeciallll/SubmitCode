-- Create a view for the leaderboard that ranks users who have created coins
CREATE OR REPLACE VIEW leaderboard AS
WITH creator_stats AS (
  SELECT 
    u.fid,
    u.username,
    u.display_name,
    u.pfp_url,
    u.follower_count,
    u.following_count,
    u.power_badge,
    u.neynar_score,
    COUNT(DISTINCT c.id) AS coins_created,
    SUM(CASE WHEN c.deployment_status = 'success' THEN 1 ELSE 0 END) AS successful_deployments,
    MAX(c.created_at) AS last_creation_date
  FROM 
    users u
  JOIN 
    coins c ON u.fid = c.creator_fid
  GROUP BY 
    u.fid, u.username, u.display_name, u.pfp_url, u.follower_count, u.following_count, u.power_badge, u.neynar_score
)
SELECT 
  fid,
  username,
  display_name,
  pfp_url,
  follower_count,
  following_count,
  power_badge,
  neynar_score,
  coins_created,
  successful_deployments,
  last_creation_date,
  -- Calculate rank score: follower_count + (neynar_score * 10) + (power_badge ? 1000 : 0) + (successful_deployments * 100)
  (COALESCE(follower_count, 0) + 
   COALESCE(neynar_score, 0) * 10 + 
   (CASE WHEN power_badge THEN 1000 ELSE 0 END) + 
   (successful_deployments * 100)) AS rank_score,
  -- Assign rank based on the score
  ROW_NUMBER() OVER (ORDER BY 
    (COALESCE(follower_count, 0) + 
     COALESCE(neynar_score, 0) * 10 + 
     (CASE WHEN power_badge THEN 1000 ELSE 0 END) + 
     (successful_deployments * 100)) DESC
  ) AS rank
FROM 
  creator_stats
ORDER BY 
  rank_score DESC;

-- Create an index on the view for better performance (if your database supports it)
-- Note: Not all databases support creating indexes on views
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank);
  EXCEPTION WHEN OTHERS THEN
    -- If the database doesn't support indexing views, silently continue
    RAISE NOTICE 'Cannot create index on view, continuing...';
  END;
END $$;
