"use client"

import { useMemo } from "react"
import { TokenCard } from "@/components/home/token-card"
import { useInfiniteCoins } from "@/hooks/use-coins"
import { useZoraTokensForCoins } from "@/hooks/use-zora"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { queryKeys } from "@/lib/react-query-config"
import { Loader2 } from "lucide-react"

interface TokenGridProps {
  sortBy: string
  filterBy: string
}

export function TokenGrid({ sortBy, filterBy }: TokenGridProps) {
  const { 
    data,
    isLoading: coinsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteCoins({
    sortBy,
    filterBy,
    limit: 6, // Load 6 coins per page
  })

  // Flatten coins infinite query
  const coins = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page.coins)
  }, [data])

  // Fetch Zora data for coins caching
  const { 
    data: zoraTokens = {}, 
    isLoading: zoraLoading 
  } = useZoraTokensForCoins(coins)

  // Fetch creator followers caching
  const creatorFids = useMemo(() => {
    return [...new Set(coins.map(coin => coin.creator_fid || coin.fid).filter(Boolean))]
  }, [coins])

  const { data: creatorFollowers = {} } = useQuery({
    queryKey: [...queryKeys.user.all, 'followers', creatorFids.sort()],
    queryFn: async () => {
      if (creatorFids.length === 0) return {}

      const { data, error } = await supabase
        .from("users")
        .select("fid, follower_count")
        .in("fid", creatorFids)

      if (error) {
        console.error("Error fetching creator followers:", error)
        return {}
      }

      // Convert to record for easy lookup
      const followersRecord: Record<number, number> = {}
      data?.forEach((user) => {
        followersRecord[user.fid] = user.follower_count || 0
      })

      return followersRecord
    },
    enabled: creatorFids.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Process and sort coins caching
  const processedCoins = useMemo(() => {
    return coins
      .filter((coin) => {
        // Apply filters
        switch (filterBy) {
          case "trending":
            return coin.deployment_status === "success"
          case "new":
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
            return new Date(coin.created_at || "") > oneDayAgo
          case "hot":
            return coin.deployment_status === "success"
          default:
            return true
        }
      })
      .sort((a, b) => {
        // Apply sorts
        switch (sortBy) {
          case "oldest":
            return new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime()
          case "volume":
            const aVolume =
              a.contract_address && zoraTokens[a.contract_address.toLowerCase()]?.stats?.volume
                ? Number.parseFloat(zoraTokens[a.contract_address.toLowerCase()].stats.volume)
                : 0
            const bVolume =
              b.contract_address && zoraTokens[b.contract_address.toLowerCase()]?.stats?.volume
                ? Number.parseFloat(zoraTokens[b.contract_address.toLowerCase()].stats.volume)
                : 0
            return bVolume - aVolume
          case "market-cap":
            const aMcap =
              a.contract_address && zoraTokens[a.contract_address.toLowerCase()]?.stats?.marketCap
                ? Number.parseFloat(zoraTokens[a.contract_address.toLowerCase()].stats.marketCap)
                : 0
            const bMcap =
              b.contract_address && zoraTokens[b.contract_address.toLowerCase()]?.stats?.marketCap
                ? Number.parseFloat(zoraTokens[b.contract_address.toLowerCase()].stats.marketCap)
                : 0
            return bMcap - aMcap
          case "newest":
          default:
            return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
        }
      })
  }, [coins, filterBy, sortBy, zoraTokens])

  // Convert processed coins to display format
  const tokensForDisplay = useMemo(() => {
    return processedCoins.map((coin) => {
    // Get Zora data if available
    const zoraData = coin.contract_address ? zoraTokens[coin.contract_address.toLowerCase()] : undefined
    
    // Get creator follower count from Supabase
    const creatorFid = coin.creator_fid || coin.fid
    const followerCount = creatorFollowers[creatorFid] || 0

    return {
      id: coin.id?.toString() || "",
      name: coin.name,
      symbol: coin.symbol,
      image: zoraData?.metadata?.image || coin.image_url || "/placeholder.svg",
      creator:
        zoraData?.creator?.username ||
        zoraData?.creator?.displayName ||
        coin.creator_username ||
        coin.creator_display_name ||
        "Unknown",
      followers: followerCount,
      mcap: zoraData?.stats?.marketCap
        ? formatCurrency(zoraData.stats.marketCap)
        : coin.deployment_status === "success"
          ? "26.5k"
          : "--",
      volume24h: zoraData?.stats?.volume ? formatCurrency(zoraData.stats.volume) : "--",
      change24h: zoraData?.priceData?.priceChange24h
        ? `${zoraData.priceData.priceChange24h > 0 ? "+" : ""}${zoraData.priceData.priceChange24h.toFixed(2)}%`
        : "0.0%",
      timeAgo: formatTimeAgo(coin.created_at || ""),
      contract_address: coin.contract_address,
      hasZoraData: !!zoraData,
      username: coin.creator_username,
    }
    })
  }, [processedCoins, zoraTokens, creatorFollowers])

  function formatCurrency(value: string): string {
    try {
      const num = Number.parseFloat(value)
      if (isNaN(num)) return "--"

      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`
      } else {
        return num.toFixed(2)
      }
    } catch {
      return "--"
    }
  }

  function formatTimeAgo(dateString: string): string {
    if (!dateString) return "Unknown"

    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  const isLoading = coinsLoading || zoraLoading

  // Only show skeleton on initial load when we have no coins yet
  const isInitialLoading = isLoading && coins.length === 0

  if (isInitialLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <Card 
              className={getMetalClassName('pearl', 'static', 'p-0')}
              style={getMetalStyle('pearl')}
            >
              <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="mb-4">
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="h-3 bg-gray-200 rounded w-8 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
                <div>
                  <div className="h-3 bg-gray-200 rounded w-10 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                </div>
                <div>
                  <div className="h-3 bg-gray-200 rounded w-8 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-10"></div>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tokensForDisplay.map((token) => (
          <TokenCard key={token.id} token={token} />
        ))}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className={getMetalClassName('gold', 'animated', 'px-8 py-3')}
            style={getMetalStyle('gold')}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Coins'
            )}
          </Button>
        </div>
      )}

      {/* Show message when no more coins */}
      {!hasNextPage && tokensForDisplay.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            You&apos;ve reached the end! No more coins to load.
          </p>
        </div>
      )}
    </div>
  )
}
