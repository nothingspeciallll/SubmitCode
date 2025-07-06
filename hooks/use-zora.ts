import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query'
import { zoraService, type ZoraToken } from '@/lib/zora-service'
import { queryKeys } from '@/lib/react-query-config'

// Hook to fetch single Zora token
export function useZoraToken(address: string) {
  return useQuery({
    queryKey: queryKeys.zora.token(address),
    queryFn: () => zoraService.getTokenByAddress(address),
    enabled: !!address,
    staleTime: 10 * 60 * 1000, // 10 minutes for token data
    retry: 1, // Zora API can be unstable
  })
}

// Hook to fetch multiple Zora tokens efficiently
export function useZoraTokens(addresses: string[]) {
  return useQuery({
    queryKey: queryKeys.zora.tokens(addresses),
    queryFn: async () => {
      if (addresses.length === 0) return {}
      
      const requests = addresses.map(address => ({
        collectionAddress: address,
        chainId: 8453, // Base chain ID
      }))
      
      const tokens = await zoraService.getTokensByAddresses(requests)
      
      // Convert to record for easy lookup
      const tokenRecord: Record<string, ZoraToken> = {}
      tokens.forEach(token => {
        tokenRecord[token.address.toLowerCase()] = token
      })
      
      return tokenRecord
    },
    enabled: addresses.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
}

// Hook to fetch Zora tokens for multiple coins with selective fetching
export function useZoraTokensForCoins(coins: Array<{ contract_address?: string; deployment_status?: string }>) {
  // Filter coins with contract addresses and deployed status
  const validAddresses = coins
    .filter(coin => coin.contract_address && coin.deployment_status === "success")
    .map(coin => coin.contract_address!)
    .filter((address, index, arr) => arr.indexOf(address) === index) // Remove duplicates

  return useZoraTokens(validAddresses)
}

// Hook to batch fetch Zora data with better error handling
export function useZoraTokensBatch(
  tokens: Array<{ address: string; chainId?: number }>
) {
  return useQueries({
    queries: tokens.map(token => ({
      queryKey: queryKeys.zora.token(token.address),
      queryFn: () => zoraService.getTokenByAddress(token.address),
      staleTime: 10 * 60 * 1000,
      retry: 1,
      enabled: !!token.address,
    })),
  })
}

// Hook to prefetch Zora data
export function usePrefetchZora() {
  const queryClient = useQueryClient()
  
  return {
    prefetchToken: (address: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.zora.token(address),
        queryFn: () => zoraService.getTokenByAddress(address),
        staleTime: 10 * 60 * 1000,
      })
    },
    prefetchTokens: (addresses: string[]) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.zora.tokens(addresses),
        queryFn: async () => {
          const requests = addresses.map(address => ({
            collectionAddress: address,
            chainId: 8453,
          }))
          return zoraService.getTokensByAddresses(requests)
        },
        staleTime: 10 * 60 * 1000,
      })
    },
  }
}

// Hook to get cached Zora data without refetching
export function useZoraTokenCache(address: string) {
  const queryClient = useQueryClient()
  return {
    getCachedToken: () => {
      return queryClient.getQueryData<ZoraToken>(queryKeys.zora.token(address))
    },
    getCachedTokens: (addresses: string[]) => {
      return queryClient.getQueryData<Record<string, ZoraToken>>(queryKeys.zora.tokens(addresses))
    },
  }
} 