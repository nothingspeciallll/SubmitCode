"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { useFarcaster } from "@/hooks/use-farcaster"
import { useTokenClaimContract, usePoolInfo } from "@/hooks/use-token-claim-contract"
import { airdropsService, type AirdropPool } from "@/lib/airdrops-service"
import { Gift, Coins, RefreshCw } from "lucide-react" 
import { Address, formatUnits } from "viem"

// Component for individual pool item with smart contract data
function PoolItem({ 
  pool, 
  onClaim, 
  isClaimingTokens, 
  isPending, 
  isConfirming, 
  farcasterUser,
  isHiding = false,
  isAnyClaimInProgress = false
}: { 
  pool: AirdropPool
  onClaim: (pool: AirdropPool) => void
  isClaimingTokens: boolean
  isPending: boolean
  isConfirming: boolean
  farcasterUser: any
  isHiding?: boolean
  isAnyClaimInProgress: boolean
}) {
  
  // Get real-time pool info from smart contract
  const { poolInfo, isLoading: isLoadingPool } = usePoolInfo(pool.contract_address as Address)
  
  // Format balance for display (from smart contract)
  const formatBalance = (balance: bigint, decimals: number = 18) => {
    try {
      if (balance === BigInt(0)) return "0"
      const formatted = formatUnits(balance, decimals)
      const num = parseFloat(formatted)
      if (num < 0.001) return "< 0.001"
      if (num < 1) return num.toFixed(6)
      if (num < 1000) return num.toFixed(3)
      if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
      return `${(num / 1000000).toFixed(1)}M`
    } catch {
      return "0"
    }
  }

  // Format balance for display (from Supabase - fallback)
  const formatBalanceFromString = (balance: string, decimals: number = 18) => {
    try {
      const num = parseFloat(formatUnits(BigInt(balance), decimals))
      if (num < 0.001) return "< 0.001"
      if (num < 1) return num.toFixed(6)
      if (num < 1000) return num.toFixed(3)
      if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
      return `${(num / 1000000).toFixed(1)}M`
    } catch {
      return "0"
    }
  }

  return (
    <div
      key={pool.id}
      className={`flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-all duration-500 ${
        isHiding 
          ? 'opacity-0 transform -translate-y-2 scale-95 pointer-events-none' 
          : 'opacity-100 transform translate-y-0 scale-100'
      }`}
    >
      {/* Token Icon */} 
      <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
        {pool.token_image ? (
          <img src={pool.token_image} alt={pool.token_name} className="w-full h-full object-cover rounded" />
        ) : (
          <Coins className="w-5 h-5 text-black" />
        )}
      </div>

      {/* Token Info */}
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-semibold text-gray-900">{pool.token_name.length > 6 ? pool.token_name.slice(0, 6) + '…' : pool.token_name}</h3>
        </div>
        
        {/* Smart Contract Pool Info */}
        <div className="text-sm text-gray-600">
          {isLoadingPool ? (
            <span className="text-gray-400">Loading pool...</span>
          ) : poolInfo && poolInfo.totalPool > BigInt(0) ? (
            <>
              <span className="text-green-600 font-medium">
                {formatBalance(poolInfo.totalPool, pool.token_decimals)} {pool.token_symbol}
              </span>
            </>
          ) : (
            <span className="text-gray-500">
              {formatBalanceFromString(pool.total_amount, pool.token_decimals)} {pool.token_symbol}
              <span className="text-xs text-orange-600 ml-1">(Supabase data)</span>
            </span>
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          From @{pool.depositor_username || pool.depositor_fid}
        </div>
      </div>

      {/* Claim Button */}
      <Button
        onClick={() => onClaim(pool)}
        disabled={!farcasterUser?.fid || isClaimingTokens || (isAnyClaimInProgress && !isClaimingTokens)}
        className={getMetalClassName('platinum', 'animated')}
        style={getMetalStyle('platinum')}
        size="sm"
      >
        {isClaimingTokens ? (
          <>
            {isPending ? 'Claiming...' : isConfirming ? 'Confirming...' : 'Processing...'}
          </>
        ) : (
          <>
            <Gift className="w-3 h-3 mr-1" />
            Claim
          </>
        )}
      </Button>
    </div>
  )
}

export function ClaimableTokensList() {
  const { user: farcasterUser } = useFarcaster()
  const { claimToken, isPending, isConfirming, isConfirmed, hash } = useTokenClaimContract()
  const [pools, setPools] = useState<AirdropPool[]>([])
  const [, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [claimingTokens, setClaimingTokens] = useState<Set<string>>(new Set())
  const [pendingClaims, setPendingClaims] = useState<Map<string, string>>(new Map()) // poolId -> contractAddress
  const [hidingTokens, setHidingTokens] = useState<Set<string>>(new Set()) // poolIds being hidden
  const [lastClaimedPool, setLastClaimedPool] = useState<string | null>(null) // Track last claimed pool

  // Fetch available airdrop pools and filter out already claimed ones
  useEffect(() => {
    let isMounted = true
    
    async function fetchPools(showLoading = true) {
      try {
        if (showLoading) {
          setLoading(true) 
        }
        const poolData = await airdropsService.getAvailablePoolsForUser(farcasterUser?.fid)
        if (isMounted) {
          setPools(poolData)
        }
      } catch (error) {
      } finally {
        if (isMounted && showLoading) {
          setLoading(false)
        }
      }
    }

    // Initial load with loading state
    fetchPools(true)
    
    return () => {
      isMounted = false
    }
  }, [farcasterUser?.fid])

  // Handle successful claim transaction
  useEffect(() => {
    const handleSuccessfulClaim = async () => {
      if (!isConfirmed || !hash || !farcasterUser?.fid || !lastClaimedPool) return
      const poolId = lastClaimedPool
      // Start hiding animation IMMEDIATELY when transaction is confirmed
      setHidingTokens(prev => new Set(prev).add(poolId))
      // Remove the pool from the pools list after animation completes
      setTimeout(() => {
        setPools(prev => prev.filter(p => p.id !== poolId))
        setHidingTokens(prev => {
          const newSet = new Set(prev)
          newSet.delete(poolId)
          return newSet
        })
      }, 200) // Match CSS animation duration
      // Clear pending claims and claiming state immediately
      const contractAddress = pendingClaims.get(poolId)
      setPendingClaims(new Map())
      setLastClaimedPool(null) // Reset last claimed pool
      if (contractAddress) {
        setClaimingTokens(prev => {
          const newSet = new Set(prev)
          newSet.delete(contractAddress)
          return newSet
        })
      }

      // Only mark as claimed in Supabase AFTER transaction is confirmed
      try {
        // Create a new claim record with transaction hash
        await airdropsService.markAsClaimed(poolId, farcasterUser.fid, '0', hash)
      } catch (error) {
        console.error('Error recording claim in Supabase:', error)
      }
    }
    handleSuccessfulClaim()
  }, [isConfirmed, hash, farcasterUser?.fid, lastClaimedPool, pendingClaims])

  // Handle token claim
  const handleClaim = async (pool: AirdropPool) => {
    if (!farcasterUser?.fid || claimingTokens.has(pool.contract_address)) return

    try {
      setClaimingTokens(prev => new Set(prev).add(pool.contract_address))
      setPendingClaims(new Map([[pool.id, pool.contract_address]]))
      setLastClaimedPool(pool.id) // Track which pool we're claiming
      
      // Initiate blockchain transaction - Supabase will be updated ONLY after confirmation
      await claimToken(pool.contract_address as Address)
    } catch (error) {
      // Clear states on error
      setClaimingTokens(prev => {
        const newSet = new Set(prev)
        newSet.delete(pool.contract_address)
        return newSet
      })
      setPendingClaims(new Map())
    }
  }

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (refreshing) return
    
    setRefreshing(true)
    try {
      const poolData = await airdropsService.getAvailablePoolsForUser(farcasterUser?.fid)
      setPools(poolData)
    } finally {
      setRefreshing(false)
    }
  }

  // All pools are visible since filtering is done at fetch time via Supabase
  const visiblePools = pools

  return (
    <div className="space-y-4">
      <div className={getMetalClassName('pearl', 'static', 'p-4 rounded-xl')} style={getMetalStyle('pearl')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={getMetalClassName('gold', 'animated', 'w-8 h-8 rounded-lg flex items-center justify-center')} style={getMetalStyle('gold')}>
              <Gift className="w-4 h-4 text-black" />
            </div>
            <span className="text-xl font-bold">Available Airdrops</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {visiblePools.length} Available
            </Badge>
            <Button
              onClick={handleManualRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="h-6 px-2"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        {!farcasterUser?.fid && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              Connect your Farcaster account to claim airdrops
            </p>
          </div>
        )}
      </div>

      {visiblePools.map((pool) => (
        <PoolItem
          key={pool.id}
          pool={pool}
          onClaim={handleClaim}
          isClaimingTokens={claimingTokens.has(pool.contract_address)}
          isPending={isPending}
          isConfirming={isConfirming}
          farcasterUser={farcasterUser}
          isHiding={hidingTokens.has(pool.id)}
          isAnyClaimInProgress={claimingTokens.size > 0}
        />
      ))}
    </div>
  )
} 