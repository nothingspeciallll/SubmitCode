"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { type LeaderboardEntry } from "@/lib/leaderboard-service"
import { useFarcaster } from "@/hooks/use-farcaster"
import { useLeaderboard, useUserRank } from "@/hooks/use-leaderboard"
import { LeaderboardContent } from "@/components/leaderboard/leaderboard-content"

export default function LeaderboardPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [timeframe, setTimeframe] = useState("all-time")
  const { user: farcasterUser } = useFarcaster()
  const pageSize = 20
  const router = useRouter()
  
  // Use React Query hooks
  const { 
    data: leaderboardData, 
    isLoading: loading, 
  } = useLeaderboard(currentPage, pageSize, timeframe)

  const { 
    data: userRank, 
  } = useUserRank(farcasterUser?.fid || 0)

  // Memoize computed values
  const { leaderboard, totalPages } = useMemo(() => {
    if (!leaderboardData) {
      return { leaderboard: [], totalEntries: 0, totalPages: 0 }
    }
    return {
      leaderboard: leaderboardData.entries,
      totalEntries: leaderboardData.total,
      totalPages: leaderboardData.totalPages
    }
  }, [leaderboardData])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }



  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-300 to-yellow-500 text-white"
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
      case 3:
        return "bg-gradient-to-r from-amber-600 to-amber-800 text-white"
      default:
        return "bg-white"
    }
  }

  const formatNumber = (num?: number) => {
    if (!num) return "0"
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Navigate to token/username route if username exists
  const handleProfileClick = (entry: LeaderboardEntry) => {
      router.push(`/token/${entry.username}`)
  }

  return (
    <LeaderboardContent
      timeframe={timeframe}
      setTimeframe={setTimeframe}
      userRank={userRank}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      pageSize={pageSize}
      leaderboard={leaderboard}
      handleProfileClick={handleProfileClick}
      loading={loading}
      totalPages={totalPages}
      handlePageChange={handlePageChange}
      farcasterUser={farcasterUser}
      formatNumber={formatNumber}
      getRankClass={getRankClass}
    />
  )
}
