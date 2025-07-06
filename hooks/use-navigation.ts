import { useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query-config'
import { useFarcaster } from '@/hooks/use-farcaster'

export function useNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { user: farcasterUser } = useFarcaster()
  const isUnmountedRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  // Prefetch data for common routes
  const prefetchRoute = useCallback((route: string) => {
    if (isUnmountedRef.current) return

    try {
      switch (route) {
        case '/':
          
          // Prefetch coins data
          queryClient.prefetchQuery({
            queryKey: queryKeys.coins.list(),
            staleTime: 2 * 60 * 1000,
          })
          break
        
        case '/profile':
          if (farcasterUser?.fid) {
            // Prefetch user data
            queryClient.prefetchQuery({
              queryKey: queryKeys.user.coin(farcasterUser.fid),
              staleTime: 3 * 60 * 1000,
            })
            queryClient.prefetchQuery({
              queryKey: queryKeys.user.claimHistory(farcasterUser.fid),
              staleTime: 2 * 60 * 1000,
            })
          }
          break
        
        case '/leaderboard':
          // Prefetch leaderboard data
          queryClient.prefetchQuery({
            queryKey: queryKeys.leaderboard.list(1, 'all-time'),
            staleTime: 2 * 60 * 1000,
          })
          if (farcasterUser?.fid) {
            queryClient.prefetchQuery({
              queryKey: queryKeys.leaderboard.userRank(farcasterUser.fid),
              staleTime: 5 * 60 * 1000,
            })
          }
          break

        case '/airdrop':
          // Prefetch user coin data for airdrop
          if (farcasterUser?.fid) {
            queryClient.prefetchQuery({
              queryKey: queryKeys.user.coin(farcasterUser.fid),
              staleTime: 2 * 60 * 1000,
            })
          }
          break
      }
    } catch (error) {
      console.warn('Error prefetching route data:', error)
    }
  }, [queryClient, farcasterUser])

  // Navigate with prefetching and safety checks
  const navigateTo = useCallback((href: string) => {
    if (isUnmountedRef.current) return

    try {
      // Prefetch before navigation
      prefetchRoute(href)
      
      // Add a small delay to ensure prefetch starts
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          router.push(href)
        }
      }, 10)
    } catch (error) {
      console.error('Navigation error:', error)
      // Fallback to immediate navigation
      if (!isUnmountedRef.current) {
        router.push(href)
      }
    }
  }, [router, prefetchRoute])

  // Navigation items with active state
  const navItems = useMemo(() => [
    {
      id: "home",
      label: "Home",
      href: "/",
      active: pathname === "/",
    },
    {
      id: "profile", 
      label: "Profile",
      href: "/profile",
      active: pathname === "/profile",
    },
    {
      id: "leaderboard",
      label: "Leaderboard", 
      href: "/leaderboard",
      active: pathname === "/leaderboard",
    },
  ], [pathname])

  return {
    pathname,
    navItems,
    navigateTo,
    prefetchRoute,
  }
} 