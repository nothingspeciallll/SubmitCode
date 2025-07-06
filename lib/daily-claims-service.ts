import { supabase } from "@/lib/supabase"

export type ClaimData = {
  amount: any
  id?: number
  user_fid: number
  claim_date: string
  token_name: string
  token_symbol: string
  token_image: string
  created_at?: string
}

export type RandomToken = {
}

class DailyClaimsService {
  // Check if user can claim today
  async canClaimToday(userFid: number): Promise<boolean> {
    try {
      const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

      const { error } = await supabase
        .from("daily_claims")
        .select("id")
        .eq("user_fid", userFid)
        .eq("claim_date", today)
        .single()

      if (error && error.code === "PGRST116") {
        // No rows returned - user can claim
        return true
      }

      if (error) {
        console.error("Error checking claim status:", error)
        return false
      }

      // If we found a record, user already claimed today
      return false
    } catch (error) {
      console.error("Error in canClaimToday:", error)
      return false
    }
  }


  // Get user's claim history
  async getUserClaimHistory(userFid: number, limit = 10): Promise<ClaimData[]> {
    try {
      const { data, error } = await supabase
        .from("daily_claims")
        .select("*")
        .eq("user_fid", userFid)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error fetching claim history:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getUserClaimHistory:", error)
      return []
    }
  }

  // Get user's last claim
  async getLastClaim(userFid: number): Promise<ClaimData | null> {
    try {
      const { data, error } = await supabase
        .from("daily_claims")
        .select("*")
        .eq("user_fid", userFid)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code === "PGRST116") {
        // No rows returned
        return null
      }

      if (error) {
        console.error("Error fetching last claim:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in getLastClaim:", error)
      return null
    }
  }

  // Get claim statistics
  async getClaimStats(): Promise<{
    totalClaims: number
    claimsByRarity: Record<string, number>
    uniqueClaimers: number
  }> {
    try {
      // Get total claims
      const { count: totalClaims } = await supabase.from("daily_claims").select("*", { count: "exact", head: true })

      // Get claims by rarity
      const { data: rarityData } = await supabase.from("daily_claims").select("token_rarity")

      const claimsByRarity: Record<string, number> = {}
      rarityData?.forEach((claim) => {
        claimsByRarity[claim.token_rarity] = (claimsByRarity[claim.token_rarity] || 0) + 1
      })

      // Get unique claimers
      const { data: uniqueData } = await supabase.from("daily_claims").select("user_fid")

      const uniqueClaimers = new Set(uniqueData?.map((claim) => claim.user_fid)).size

      return {
        totalClaims: totalClaims || 0,
        claimsByRarity,
        uniqueClaimers,
      }
    } catch (error) {
      console.error("Error getting claim stats:", error)
      return {
        totalClaims: 0,
        claimsByRarity: {},
        uniqueClaimers: 0,
      }
    }
  }
}

export const dailyClaimsService = new DailyClaimsService()
