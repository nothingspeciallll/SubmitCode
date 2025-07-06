import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { persistQueryClient } from '@tanstack/react-query-persist-client'

// Tạo persister cho local storage
const localStoragePersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'farcoins-query-cache',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
})

export const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Keep data in cache for 10 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        // Retry failed requests 3 times
        retry: 3,
        // Don't refetch on window focus for performance
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect by default
        refetchOnReconnect: 'always',
        // Use network-only for critical data, cache-first for others
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        networkMode: 'online',
      },
    },
  })

  // Persist query client nếu có local storage
  if (typeof window !== 'undefined') {
    persistQueryClient({
      queryClient,
      persister: localStoragePersister,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      // Remove hydrateOptions with invalid staleTime property
      // React Query v5 doesn't accept staleTime directly in hydrateOptions
    })

    // Instead, set default stale time for hydrated queries using onSuccess
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 60 * 60 * 1000, // 1 hour for hydrated queries
      },
    })
  }

  return queryClient
}

export const queryKeys = {
  // User related queries
  user: {
    all: ['user'] as const,
    profile: (fid: number) => [...queryKeys.user.all, 'profile', fid] as const,
    coin: (fid: number) => [...queryKeys.user.all, 'coin', fid] as const,
    portfolio: (address: string) => [...queryKeys.user.all, 'portfolio', address] as const,
    claimHistory: (fid: number) => [...queryKeys.user.all, 'claims', fid] as const,
  },
  
  // Coins related queries
  coins: {
    all: ['coins'] as const,
    list: (params?: { sortBy?: string; filterBy?: string; page?: number }) => 
      [...queryKeys.coins.all, 'list', params] as const,
    detail: (id: string | number) => [...queryKeys.coins.all, 'detail', id] as const,
    byUsername: (username: string) => [...queryKeys.coins.all, 'byUsername', username] as const,
  },

  // Zora related queries
  zora: {
    all: ['zora'] as const,
    token: (address: string) => [...queryKeys.zora.all, 'token', address] as const,
    tokens: (addresses: string[]) => [...queryKeys.zora.all, 'tokens', addresses.sort()] as const,
  },

  // Leaderboard queries
  leaderboard: {
    all: ['leaderboard'] as const,
    list: (page: number, timeframe?: string) => [...queryKeys.leaderboard.all, 'list', page, timeframe] as const,
    userRank: (fid: number) => [...queryKeys.leaderboard.all, 'userRank', fid] as const,
  },

  // Promotions
  promotions: {
    all: ['promotions'] as const,
    list: () => [...queryKeys.promotions.all, 'list'] as const,
  },
} 