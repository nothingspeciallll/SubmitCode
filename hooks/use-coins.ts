import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coinsService, type CoinData } from '@/lib/coins-service'
import { queryKeys } from '@/lib/react-query-config'

// Hook to fetch all coins with pagination
export function useCoins(options?: {
  search?: string
  sortBy?: string
  filterBy?: string
  page?: number
  limit?: number
}) {
  const { search, sortBy = 'newest', filterBy = 'all', page = 1, limit = 50 } = options || {}
  
  return useQuery({
    queryKey: queryKeys.coins.list({ sortBy, filterBy, page }),
    queryFn: async () => {
      if (search?.trim()) {
        return coinsService.searchCoins(search, limit)
      }
      const { coins } = await coinsService.getAllCoins(limit, (page - 1) * limit)
      return coins
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for coins list
    enabled: true,
  })
}



// Hook to fetch coin by username
export function useCoinByUsername(username: string) {
  return useQuery({
    queryKey: queryKeys.coins.byUsername(username),
    queryFn: () => coinsService.getCoinByUsername(username),
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch coin by ID
export function useCoinById(id: string | number) {
  return useQuery({
    queryKey: queryKeys.coins.detail(id),
    queryFn: () => coinsService.getCoinById(Number(id)),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch user coin
export function useUserCoin(fid: number) {
  return useQuery({
    queryKey: queryKeys.user.coin(fid),
    queryFn: () => coinsService.getUserCoinByFid(fid),
    enabled: !!fid && fid > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to create coin with mutation
export function useCreateCoin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: coinsService.createCoin,
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.coins.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.coin(variables.fid) })
    },
  })
}

// Hook to update coin
export function useUpdateCoin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CoinData> }) =>
      coinsService.updateCoin(id, data),
    onSuccess: (data, variables) => {
      // Update cache với data mới
      queryClient.setQueryData(queryKeys.coins.detail(variables.id), data)
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.coins.all })
    },
  })
}

// Hook to infinite scroll coins
export function useInfiniteCoins(options?: {
  sortBy?: string
  filterBy?: string
  limit?: number
}) {
  const { sortBy = 'newest', filterBy = 'all', limit = 20 } = options || {}
  
  return useInfiniteQuery({
    queryKey: queryKeys.coins.list({ sortBy, filterBy }),
    queryFn: async ({ pageParam = 0 }) => {
      const { coins, total } = await coinsService.getAllCoins(limit, pageParam * limit)
      return { coins, total, nextPage: pageParam + 1 }
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((sum, page) => sum + page.coins.length, 0)
      return totalFetched < lastPage.total ? allPages.length : undefined
    },
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Hook to prefetch coin data
export function usePrefetchCoin() {
  const queryClient = useQueryClient()
  
  return {
    prefetchCoin: (id: number) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.coins.detail(id),
        queryFn: () => coinsService.getCoinById(id),
        staleTime: 5 * 60 * 1000,
      })
    },
    prefetchUserCoin: (fid: number) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.coin(fid),
        queryFn: () => coinsService.getUserCoinByFid(fid),
        staleTime: 5 * 60 * 1000,
      })
    },
  }
} 