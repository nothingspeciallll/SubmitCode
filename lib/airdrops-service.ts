import { supabase } from './supabase'

export interface AirdropPool {
  id: string
  contract_address: string
  token_name: string
  token_symbol: string
  token_image?: string
  token_decimals: number
  total_amount: string
  depositor_fid: number
  depositor_username?: string
  created_at: string
  is_active: boolean
  claim_count: number
}

export interface AirdropClaim {
  id: string
  pool_id: string
  claimer_fid: number
  claimer_username?: string
  amount_claimed: string
  transaction_hash?: string
  claimed_at: string
}

export const airdropsService = {
  /**
   * Create a new airdrop pool when user deposits tokens
   */
  async createPool(poolData: {
    contract_address: string
    token_name: string
    token_symbol: string
    token_image?: string
    token_decimals: number
    total_amount: string
    depositor_fid: number
    depositor_username?: string
    transaction_hash?: string
  }): Promise<AirdropPool> {
    const { data, error } = await supabase
      .from('airdrop_pools')
      .insert({
        contract_address: poolData.contract_address,
        token_name: poolData.token_name,
        token_symbol: poolData.token_symbol,
        token_image: poolData.token_image,
        token_decimals: poolData.token_decimals,
        total_amount: poolData.total_amount,
        depositor_fid: poolData.depositor_fid,
        depositor_username: poolData.depositor_username,
        transaction_hash: poolData.transaction_hash,
        is_active: true,
        claim_count: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating airdrop pool:', error)
      throw new Error('Failed to create airdrop pool')
    }

    return data
  },

  /**
   * Get all available airdrop pools
   */
  async getAvailablePools(): Promise<AirdropPool[]> {
    const { data, error } = await supabase
      .from('airdrop_pools')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching airdrop pools:', error)
      throw new Error('Failed to fetch airdrop pools')
    }

    return data || []
  },


  /**
   * Mark a token as claimed by a user
   * Always creates a new record for each claim (after removing unique index constraint)
   */
  async markAsClaimed(poolId: string, claimerFid: number, amountClaimed?: string, transactionHash?: string): Promise<AirdropClaim> {
    // First, get the claimer's username if available
    let claimerUsername: string | undefined

    try {
      const { data: userData } = await supabase
        .from('farcaster_users')
        .select('username')
        .eq('fid', claimerFid)
        .single()
      
      claimerUsername = userData?.username
    } catch (error) {
      console.warn('Could not fetch claimer username:', error)
    }

    // Always create a new claim record for each claim
    // This requires removing the unique index constraint on (pool_id, claimer_fid)
    const { data, error } = await supabase
      .from('airdrop_claims')
      .insert({
        pool_id: poolId,
        claimer_fid: claimerFid,
        claimer_username: claimerUsername,
        amount_claimed: amountClaimed || '0',
        transaction_hash: transactionHash,
        // Explicitly set claimed_at to ensure it's updated even if default exists
        claimed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating claim record:', error)
      throw new Error('Failed to create claim record')
    }

    // Increment claim count for the pool
    // First get the current claim count
    const { data: poolData } = await supabase
      .from('airdrop_pools')
      .select('claim_count')
      .eq('id', poolId)
      .single()
    
    // Then increment it
    await supabase
      .from('airdrop_pools')
      .update({ 
        claim_count: poolData ? poolData.claim_count + 1 : 1
      })
      .eq('id', poolId)

    return data
  },

  /**
   * Get available pools for a specific user (excluding ones they've already claimed within 24h)
   */
  async getAvailablePoolsForUser(userFid?: number): Promise<AirdropPool[]> {
    if (!userFid) {
      return this.getAvailablePools()
    }

    // Get all active pools
    const { data: pools, error: poolsError } = await supabase
      .from('airdrop_pools')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (poolsError) {
      console.error('Error fetching pools:', poolsError)
      throw new Error('Failed to fetch pools')
    }

    if (!pools || pools.length === 0) {
      return []
    }

    // Get user's claims within the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: recentClaims, error: claimsError } = await supabase
      .from('airdrop_claims')
      .select('pool_id, claimed_at')
      .eq('claimer_fid', userFid)
      .gte('claimed_at', twentyFourHoursAgo)

    if (claimsError) {
      console.error('Error fetching user recent claims:', claimsError)
      throw new Error('Failed to fetch user claims')
    }

    const recentlyClaimedPoolIds = new Set(recentClaims?.map(claim => claim.pool_id) || [])
    
    // Filter out recently claimed pools (within 24h)
    return pools.filter(pool => !recentlyClaimedPoolIds.has(pool.id))
  },


  /**
   * Create or update airdrop pool when user deposits tokens
   * This prevents duplicate pools for the same token/depositor combination
   */
  async upsertPool(poolData: {
    contract_address: string
    token_name: string
    token_symbol: string
    token_image?: string
    token_decimals: number
    total_amount: string
    depositor_fid: number
    depositor_username?: string
    transaction_hash?: string
  }): Promise<AirdropPool> {
    try {
      // First try to find existing pool by contract address and depositor
      const existingPool = await this.getPoolByContractAndDepositor(
        poolData.contract_address, 
        poolData.depositor_fid
      )

      if (existingPool) {
        // Update existing pool by adding the new deposit amount        
        const currentAmount = BigInt(existingPool.total_amount)
        const newAmount = BigInt(poolData.total_amount)
        const updatedAmount = (currentAmount + newAmount).toString()

        const { data, error } = await supabase
          .from('airdrop_pools')
          .update({
            total_amount: updatedAmount,
            transaction_hash: poolData.transaction_hash,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPool.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating airdrop pool:', error)
          throw new Error('Failed to update airdrop pool')
        }

        return data
      } else {
        // Create new pool if none exists
        return await this.createPool(poolData)
      }
    } catch (error) {
      throw error
    }
  },

  /**
   * Get pool by contract address and depositor FID
   */
  async getPoolByContractAndDepositor(contractAddress: string, depositorFid: number): Promise<AirdropPool | null> {
    const { data, error } = await supabase
      .from('airdrop_pools')
      .select('*')
      .eq('contract_address', contractAddress)
      .eq('depositor_fid', depositorFid)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No pool found
      }
      console.error('Error fetching pool by contract and depositor:', error)
      throw new Error('Failed to fetch pool')
    }

    return data
  },
} 