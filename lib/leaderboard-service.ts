import { supabase } from "@/lib/supabase"

export type LeaderboardEntry = {
  fid: number
  username?: string
  display_name?: string
  pfp_url?: string
  follower_count: number
  following_count: number
  power_badge: boolean
  neynar_score: number
  coins_created: number
  successful_deployments: number
  last_creation_date: string
  rank_score: number
  rank: number
  latest_token_id?: number
  latest_token_contract?: string
  latest_token_name?: string
  latest_token_symbol?: string
}

class LeaderboardService {
  // Get leaderboard entries with pagination
  async getLeaderboard(
    page = 1,
    pageSize = 20,
  ): Promise<{
    entries: LeaderboardEntry[]
    total: number
  }> {
    try {
      const start = (page - 1) * pageSize
      const end = start + pageSize - 1

      // Get total count
      const { count, error: countError } = await supabase
        .from("leaderboard")
        .select("*", { count: "exact", head: true })

      if (countError) {
        console.error("Error getting leaderboard count:", countError)
        throw countError
      }

      // Get paginated entries
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("rank", { ascending: true })
        .range(start, end)

      if (error) {
        console.error("Error fetching leaderboard:", error)
        throw error
      }

      return {
        entries: data as LeaderboardEntry[],
        total: count || 0,
      }
    } catch (error) {
      console.error("Error in getLeaderboard:", error)
      return { entries: [], total: 0 }
    }
  }

  // Get top N leaderboard entries
  async getTopLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("rank", { ascending: true })
        .limit(limit)

      if (error) {
        console.error("Error fetching top leaderboard:", error)
        throw error
      }

      return data as LeaderboardEntry[]
    } catch (error) {
      console.error("Error in getTopLeaderboard:", error)
      return []
    }
  }

  // Get a user's rank
  async getUserRank(fid: number): Promise<LeaderboardEntry | null> {
    try {
      const { data, error } = await supabase.from("leaderboard").select("*").eq("fid", fid).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No rows found
          return null
        }
        console.error("Error fetching user rank:", error)
        throw error
      }

      return data as LeaderboardEntry
    } catch (error) {
      console.error("Error in getUserRank:", error)
      return null
    }
  }

  // Get user's latest token
  async getLatestTokenForUser(fid: number): Promise<{
    id: number
    contract_address?: string
    name: string
    symbol: string
  } | null> {
    try {
      const { data, error } = await supabase
        .from("coins")
        .select("id, contract_address, name, symbol")
        .eq("creator_fid", fid)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error("Error fetching latest token:", error)
      return null
    }
  }

  // Get nearby ranks for a given rank
  async getNearbyRanks(rank: number, range = 2): Promise<LeaderboardEntry[]> {
    try {
      const minRank = Math.max(1, rank - range)
      const maxRank = rank + range

      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .gte("rank", minRank)
        .lte("rank", maxRank)
        .order("rank", { ascending: true })

      if (error) {
        console.error("Error fetching nearby ranks:", error)
        throw error
      }

      return data as LeaderboardEntry[]
    } catch (error) {
      console.error("Error in getNearbyRanks:", error)
      return []
    }
  }

  // Calculate rank breakdown
  calculateRankBreakdown(entry: LeaderboardEntry): {
    followerScore: number
    neynarScore: number
    powerBadgeScore: number
    deploymentScore: number
    total: number
  } {
    const followerScore = entry.follower_count || 0
    const neynarScore = (entry.neynar_score || 0) * 10
    const powerBadgeScore = entry.power_badge ? 1000 : 0
    const deploymentScore = entry.successful_deployments * 100

    return {
      followerScore,
      neynarScore,
      powerBadgeScore,
      deploymentScore,
      total: followerScore + neynarScore + powerBadgeScore + deploymentScore,
    }
  }
}

export const leaderboardService = new LeaderboardService()
