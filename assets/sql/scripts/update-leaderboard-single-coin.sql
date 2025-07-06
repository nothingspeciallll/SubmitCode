-- Update the leaderboard view to work with single coin per user model
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
    u.has_created_coin,
    CASE WHEN u.has_created_coin THEN 1 ELSE 0 END as coins_created,
    CASE WHEN c.deployment_status = 'success' THEN 1 ELSE 0 END as successful_deployments,
    c.created_at as coin_creation_date,
    c.id as coin_id,
    c.contract_address as coin_contract,
    c.name as coin_name,
    c.symbol as coin_symbol
  FROM 
    users u
  LEFT JOIN 
    coins c ON u.fid = c.creator_fid
  WHERE 
    u.has_created_coin = TRUE
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
  coin_creation_date as last_creation_date,
  coin_id as latest_token_id,
  coin_contract as latest_token_contract,
  coin_name as latest_token_name,
  coin_symbol as latest_token_symbol,
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
