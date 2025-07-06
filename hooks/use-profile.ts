import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coinsService } from '@/lib/coins-service'
import { dailyClaimsService } from '@/lib/daily-claims-service'
import { zoraService } from '@/lib/zora-service'
import { promotionService } from '@/lib/promotion-service'
import { queryKeys } from '@/lib/react-query-config'  

// Hook để fetch user coin
export function useUserCoin(fid: number) {
  return useQuery({
    queryKey: queryKeys.user.coin(fid),
    queryFn: () => coinsService.getUserCoinByFid(fid),
    enabled: !!fid && fid > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 2,
  })
}

// Hook để fetch Zora data cho user coin
export function useUserCoinZoraData(contractAddress?: string) {
  return useQuery({
    queryKey: queryKeys.zora.token(contractAddress || ''),
    queryFn: () => zoraService.getTokenByAddress(contractAddress!),
    enabled: !!contractAddress,
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 2,
  })
}

// Hook để fetch user portfolio (coins + Zora data)
export function useUserPortfolio(fid: number) {
  const { data: userCoin, isLoading: coinLoading } = useUserCoin(fid)
  const { data: zoraData, isLoading: zoraLoading } = useUserCoinZoraData(
    userCoin?.contract_address && userCoin.deployment_status === "success" 
      ? userCoin.contract_address 
      : undefined
  )

  return {
    userCoin,
    zoraData,
    isLoading: coinLoading || zoraLoading,
    hasDeployedCoin: userCoin?.deployment_status === "success",
  }
}

// Hook để fetch user statistics
export function useUserStats(fid: number) {
  return useQuery({
    queryKey: [...queryKeys.user.all, 'stats', fid],
    queryFn: async () => {
      const [userCoin, claimHistory] = await Promise.all([
        coinsService.getUserCoinByFid(fid),
        dailyClaimsService.getUserClaimHistory(fid, 100)
      ])

      const totalClaims = claimHistory.length
      // Assuming ClaimData type may not have amount property, use safe default
      const totalClaimValue = claimHistory.reduce((sum, claim) => {
        const claimAmount = typeof claim.amount === 'number' ? claim.amount : 0
        return sum + claimAmount
      }, 0)
      const avgClaimValue = totalClaims > 0 ? totalClaimValue / totalClaims : 0
      
      // Calculate streak
      let currentStreak = 0
      const sortedClaims = claimHistory.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
      
      const today = new Date()
      for (const claim of sortedClaims) {
        if (!claim.created_at) continue
        const claimDate = new Date(claim.created_at)
        const daysDiff = Math.floor((today.getTime() - claimDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff === currentStreak) {
          currentStreak++
        } else {
          break
        }
      }

      return {
        hasCoin: !!userCoin,
        coinDeployed: userCoin?.deployment_status === "success",
        totalClaims,
        totalClaimValue,
        avgClaimValue,
        currentStreak,
        coinName: userCoin?.name,
        coinSymbol: userCoin?.symbol,
      }
    },
    enabled: !!fid && fid > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook để create/update user coin
export function useUpdateUserCoin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ coinData }: { fid: number; coinData: any }) => {

      // Assuming this method might not exist yet, check if it does
      if (typeof coinsService.updateCoin === 'function') {
        return coinsService.updateCoin(coinData.id, coinData)
      }
      
      // Fallback - this should be implemented properly in the future
      return Promise.reject('updateCoin method not implemented');
    },
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(queryKeys.user.coin(variables.fid), data)
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.coins.all })
      queryClient.invalidateQueries({ queryKey: [...queryKeys.user.all, 'stats', variables.fid] })
    },
  })
}

// Hook để claim daily rewards
export function useClaimDaily() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (fid: number) => {
      return dailyClaimsService.canClaimToday(fid)
    },
    onSuccess: (data, fid) => {
      // Invalidate claim history
      queryClient.invalidateQueries({ queryKey: queryKeys.user.claimHistory(fid) })
      queryClient.invalidateQueries({ queryKey: [...queryKeys.user.all, 'stats', fid] })
    },
  })
}

// Hook để fetch user promotion based on their coin
export function useUserPromotion(coinId?: number) {
  return useQuery({
    queryKey: [...queryKeys.user.all, 'promotion', coinId],
    queryFn: () => promotionService.getPromotionByCoinId(coinId!),
    enabled: !!coinId && coinId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

// Hook để prefetch profile data
export function usePrefetchProfile() {
  const queryClient = useQueryClient()
  
  return {
    prefetchUserData: (fid: number) => {
      // Prefetch user coin
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.coin(fid),
        queryFn: () => coinsService.getUserCoinByFid(fid),
        staleTime: 3 * 60 * 1000,
      })
      
      // Prefetch claim history
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.claimHistory(fid),
        queryFn: () => dailyClaimsService.getUserClaimHistory(fid, 20),
        staleTime: 2 * 60 * 1000,
      })
    },
  }
} 