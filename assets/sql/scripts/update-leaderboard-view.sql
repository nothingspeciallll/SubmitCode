-- Update the leaderboard view to include latest token information
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
),
latest_tokens AS (
  SELECT DISTINCT ON (creator_fid)
    creator_fid,
    id as latest_token_id,
    contract_address as latest_token_contract,
    name as latest_token_name,
    symbol as latest_token_symbol
  FROM coins
  ORDER BY creator_fid, created_at DESC
)
SELECT 
  cs.fid,
  cs.username,
  cs.display_name,
  cs.pfp_url,
  cs.follower_count,
  cs.following_count,
  cs.power_badge,
  cs.neynar_score,
  cs.coins_created,
  cs.successful_deployments,
  cs.last_creation_date,
  lt.latest_token_id,
  lt.latest_token_contract,
  lt.latest_token_name,
  lt.latest_token_symbol,
  -- Calculate rank score: follower_count + (neynar_score * 10) + (power_badge ? 1000 : 0) + (successful_deployments * 100)
  (COALESCE(cs.follower_count, 0) + 
   COALESCE(cs.neynar_score, 0) * 10 + 
   (CASE WHEN cs.power_badge THEN 1000 ELSE 0 END) + 
   (cs.successful_deployments * 100)) AS rank_score,
  -- Assign rank based on the score
  ROW_NUMBER() OVER (ORDER BY 
    (COALESCE(cs.follower_count, 0) + 
     COALESCE(cs.neynar_score, 0) * 10 + 
     (CASE WHEN cs.power_badge THEN 1000 ELSE 0 END) + 
     (cs.successful_deployments * 100)) DESC
  ) AS rank
FROM 
  creator_stats cs
LEFT JOIN 
  latest_tokens lt ON cs.fid = lt.creator_fid
ORDER BY 
  rank_score DESC;
