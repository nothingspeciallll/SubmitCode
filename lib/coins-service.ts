import { supabase } from "@/lib/supabase"
import { zoraService, CreateZoraCoinParams, DeployCurrency } from "@/lib/zora-service"
import { Address } from "viem"

export type CoinData = {
  id?: number
  name: string
  symbol: string
  description?: string
  image_url?: string
  currency: string
  fid: number
  creator_fid: number
  creator_display_name?: string
  creator_username?: string
  contract_address?: string
  metadata_uri?: string
  transaction_hash?: string
  deployment_status?: "pending" | "success" | "failed"
  created_at?: string
  updated_at?: string
}

export type CreateCoinParams = {
  name: string
  symbol: string
  description?: string
  image_url?: string
  currency: string
  fid: number
  creator_fid?: number
  creator_display_name?: string
  creator_username?: string
}

class CoinsService {
  searchCoins(search: string, limit: number): any {
    throw new Error('Method not implemented.')
  }
  // Check if user has already created a coin by FID
  async hasUserCreatedCoin(fid: number): Promise<boolean> {
    try {
      const { error } = await supabase.from("coins").select("id").eq("fid", fid).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned - user hasn't created a coin
          return false
        }
        throw error
      }
      return true
    } catch (error) {
      console.error("Error checking if user has created coin:", error)
      return false
    }
  }

  // Get user's coin by FID
  async getUserCoinByFid(fid: number): Promise<CoinData | null> {
    try {
      const { data, error } = await supabase.from("coins").select("*").eq("fid", fid).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No coin found
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error("Error getting user coin by FID:", error)
      return null
    }
  }

  // Create a new coin record (only if user hasn't created one)
  async createCoin(params: CreateCoinParams): Promise<CoinData | null> {
    try {
      // First check if user has already created a coin
      const hasCreated = await this.hasUserCreatedCoin(params.fid)
      if (hasCreated) {
        throw new Error("User has already created a coin. Only one coin per user is allowed.")
      }

      const coinData = {
        name: params.name.trim(),
        symbol: params.symbol.trim().toUpperCase(),
        description: params.description?.trim() || null,
        image_url: params.image_url?.trim() || null,
        currency: params.currency,
        fid: params.fid,
        creator_fid: params.fid, // Keep for backward compatibility
        creator_display_name: params.creator_display_name?.trim() || null,
        creator_username: params.creator_username?.trim() || null,
        deployment_status: "pending" as const,
      }

      // Validate required fields
      if (!coinData.name || !coinData.symbol || !coinData.fid) {
        throw new Error("Missing required fields: name, symbol, or fid")
      }

      if (coinData.fid <= 0) {
        throw new Error("Invalid fid")
      }

      const { data, error } = await supabase.from("coins").insert(coinData).select().single()

      if (error) {
        console.error("Supabase error creating coin:", error)
        if (error.code === "23505") {
          throw new Error("You have already created a coin. Only one coin per user is allowed.")
        }
        throw error
      }
      return data
    } catch (error) {
      console.error("Error creating coin:", error)
      throw error
    }
  }

  // Update coin with general data
  async updateCoin(coinId: number, data: Partial<CoinData>): Promise<CoinData | null> {
    try {
      const { data: updatedData, error } = await supabase
        .from("coins")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", coinId)
        .select()
        .single()

      if (error) {
        console.error("Supabase error updating coin:", error)
        throw error
      }

      return updatedData
    } catch (error) {
      console.error("Error updating coin:", error)
      throw error
    }
  }

  // Update coin with deployment information
  async updateCoinDeployment(
    coinId: number,
    deploymentData: {
      contract_address?: string
      transaction_hash?: string
      deployment_status: "success" | "failed"
      metadata_uri?: string
    },
  ): Promise<CoinData | null> {
    try {
      const { data, error } = await supabase
        .from("coins")
        .update({
          contract_address: deploymentData.contract_address?.trim() || null,
          transaction_hash: deploymentData.transaction_hash?.trim() || null,
          deployment_status: deploymentData.deployment_status,
          metadata_uri: deploymentData.metadata_uri?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", coinId)
        .select()
        .single()

      if (error) {
        console.error("Supabase error updating coin:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error updating coin deployment:", error)
      throw error
    }
  }

  // Get coins by creator FID (backward compatibility)
  async getCoinsByCreator(creatorFid: number): Promise<CoinData[]> {
    try {
      const { data, error } = await supabase
        .from("coins")
        .select("*")
        .eq("creator_fid", creatorFid)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching coins by creator:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error getting coins by creator:", error)
      return []
    }
  }

  // Get coin by creator FID (since each user has only one coin)
  async getCoinByCreator(creatorFid: number): Promise<CoinData | null> {
    return this.getUserCoinByFid(creatorFid)
  }

  // Get coin by ID
  async getCoinById(coinId: number): Promise<CoinData | null> {
    try {
      const { data, error } = await supabase.from("coins").select("*").eq("id", coinId).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error("Error getting coin by ID:", error)
      return null
    }
  }

  // Get all coins with pagination
  async getAllCoins(
    limit = 50,
    offset = 0,
    status?: "pending" | "success" | "failed",
  ): Promise<{ coins: CoinData[]; total: number }> {
    try {
      let query = supabase
        .from("coins")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq("deployment_status", status)
      }

      const { data, error, count } = await query

      if (error) {
        console.error("Error fetching all coins:", error)
        throw error
      }

      return {
        coins: data || [],
        total: count || 0,
      }
    } catch (error) {
      console.error("Error getting all coins:", error)
      return { coins: [], total: 0 }
    }
  }

  // Delete coin (admin function)
  async deleteCoin(coinId: number): Promise<boolean> {
    try {
      const { error } = await supabase.from("coins").delete().eq("id", coinId)

      if (error) {
        console.error("Error deleting coin:", error)
        throw error
      }
      return true
    } catch (error) {
      console.error("Error deleting coin:", error)
      return false
    }
  }

  // Get statistics
  async getCoinsStats(): Promise<{
    total: number
    pending: number
    successful: number
    failed: number
  }> {
    try {
      const { data: totalData, error: totalError } = await supabase.from("coins").select("id", { count: "exact" })

      const { data: pendingData, error: pendingError } = await supabase
        .from("coins")
        .select("id", { count: "exact" })
        .eq("deployment_status", "pending")

      const { data: successData, error: successError } = await supabase
        .from("coins")
        .select("id", { count: "exact" })
        .eq("deployment_status", "success")

      const { data: failedData, error: failedError } = await supabase
        .from("coins")
        .select("id", { count: "exact" })
        .eq("deployment_status", "failed")

      if (totalError || pendingError || successError || failedError) {
        throw new Error("Error fetching stats")
      }

      return {
        total: totalData?.length || 0,
        pending: pendingData?.length || 0,
        successful: successData?.length || 0,
        failed: failedData?.length || 0,
      }
    } catch (error) {
      console.error("Error getting coins stats:", error)
      return { total: 0, pending: 0, successful: 0, failed: 0 }
    }
  }

  // Create a coin and deploy it to Zora
  async createAndDeployCoin(
    params: CreateCoinParams & {
      payoutRecipient: Address
      metadataUri?: string
      walletClient?: any
      publicClient?: any
    }
  ): Promise<{
    coinData: CoinData
    zoraResult?: any
  }> {
    try {
      // First create the coin record in database
      const coinData = await this.createCoin(params)
      if (!coinData) {
        throw new Error("Failed to create coin record")
      }

      // If wallet clients are provided, deploy to Zora
      if (params.walletClient && params.publicClient && params.metadataUri) {
        try {
          const zoraParams: CreateZoraCoinParams = {
            name: params.name,
            symbol: params.symbol,
            uri: params.metadataUri,
            payoutRecipient: params.payoutRecipient,
            chainId: 8453, // Base mainnet
            currency: DeployCurrency.ETH, // Default to ETH as per Zora documentation
          }

          const zoraResult = await zoraService.createCoin(
            zoraParams,
            params.walletClient,
            params.publicClient
          )

          // Update the coin record with deployment information
          if (zoraResult && coinData.id) {
            await this.updateCoinDeployment(coinData.id, {
              contract_address: zoraResult.address,
              transaction_hash: zoraResult.hash,
              deployment_status: "success",
              metadata_uri: params.metadataUri,
            })
          }

          return {
            coinData,
            zoraResult,
          }
        } catch (zoraError) {
          console.error("Error deploying to Zora:", zoraError)
          
          // Update coin status to failed
          if (coinData.id) {
            await this.updateCoinDeployment(coinData.id, {
              deployment_status: "failed",
            })
          }

          // Still return the coin data even if Zora deployment failed
          return {
            coinData,
          }
        }
      }

      return {
        coinData,
      }
    } catch (error) {
      console.error("Error in createAndDeployCoin:", error)
      throw error
    }
  }

  // Helper method to create metadata JSON for IPFS
  createCoinMetadata(params: {
    name: string
    description?: string
    image?: string
    external_url?: string
    creator?: {
      name?: string
      username?: string
      fid?: number
    }
  }) {
    return zoraService.createMetadataObject({
      name: params.name,
      description: params.description || `${params.name} coin created on Farcoins.xyz`,
      image: params.image || "",
      external_url: params.external_url || "https://farcoins.xyz",
      attributes: [
        ...(params.creator?.name ? [{ trait_type: "Creator", value: params.creator.name }] : []),
        ...(params.creator?.username ? [{ trait_type: "Username", value: params.creator.username }] : []),
        ...(params.creator?.fid ? [{ trait_type: "Farcaster FID", value: params.creator.fid.toString() }] : []),
        { trait_type: "Platform", value: "Farcoins.xyz" },
        { trait_type: "Type", value: "Social Token" },
      ],
    })
  }

  // Get coin by creator username
  async getCoinByUsername(username: string): Promise<CoinData | null> {
    try {
      const { data, error } = await supabase
        .from("coins")
        .select("*")
        .eq("creator_username", username)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // No coin found
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error("Error getting coin by username:", error)
      return null
    }
  }
}

export const coinsService = new CoinsService()
