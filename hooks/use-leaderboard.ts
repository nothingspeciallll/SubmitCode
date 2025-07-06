import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { leaderboardService } from '@/lib/leaderboard-service'
import { queryKeys } from '@/lib/react-query-config'

// Hook to fetch leaderboard with pagination
export function useLeaderboard(page: number = 1, pageSize: number = 20, timeframe: string = 'all-time') {
  return useQuery({
    queryKey: queryKeys.leaderboard.list(page, timeframe),
    queryFn: async () => {
      const { entries, total } = await leaderboardService.getLeaderboard(page, pageSize)
      return { entries, total, totalPages: Math.ceil(total / pageSize) }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for leaderboard
    retry: 2, 
  })
}

// Hook to fetch user rank
export function useUserRank(fid: number) {
  return useQuery({
    queryKey: queryKeys.leaderboard.userRank(fid),
    queryFn: () => leaderboardService.getUserRank(fid),
    enabled: !!fid && fid > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes for user rank
    retry: 2,
  })
}

// Hook to infinite scroll leaderboard
export function useInfiniteLeaderboard(pageSize: number = 20, timeframe: string = 'all-time') {
  return useInfiniteQuery({
    queryKey: queryKeys.leaderboard.list(1, timeframe),
    queryFn: async ({ pageParam = 1 }) => {
      const { entries, total } = await leaderboardService.getLeaderboard(pageParam, pageSize)
      return {
        entries,
        total,
        nextPage: pageParam + 1,
        hasMore: pageParam * pageSize < total
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Hook to get leaderboard statistics
export function useLeaderboardStats() {
  return useQuery({
    queryKey: [...queryKeys.leaderboard.all, 'stats'],
    queryFn: async () => {
      // Get basic stats from first page
      const { entries, total } = await leaderboardService.getLeaderboard(1, 3)
      const topThree = entries.slice(0, 3)
      
      return {
        totalCreators: total,
        topThree,
        averageScore: topThree.length > 0 
          ? Math.round(topThree.reduce((sum, entry) => sum + entry.rank_score, 0) / topThree.length)
          : 0
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for stats
  })
}

// Hook to prefetch leaderboard pages
export function usePrefetchLeaderboard() {
  const queryClient = useQueryClient()
  
  return {
    prefetchPage: (page: number, timeframe: string = 'all-time') => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.leaderboard.list(page, timeframe),
        queryFn: () => leaderboardService.getLeaderboard(page, 20),
        staleTime: 2 * 60 * 1000,
      })
    },
    prefetchUserRank: (fid: number) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.leaderboard.userRank(fid),
        queryFn: () => leaderboardService.getUserRank(fid),
        staleTime: 5 * 60 * 1000,
      })
    },
  }
} 