"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { useFarcaster } from "@/hooks/use-farcaster"
import { useUserPortfolio, useUserStats, useUserPromotion } from "@/hooks/use-profile"
import { ProfileContent } from "@/components/profile/profile-content"

export default function ProfilePage() {
  const { user: farcasterUser, isLoading: isFarcasterLoading} = useFarcaster()

  const [activeTab, setActiveTab] = useState("portfolio")

  // Use React Query hooks
  const { 
    userCoin, 
    zoraData, 
    isLoading: portfolioLoading 
  } = useUserPortfolio(farcasterUser?.fid || 0)

  // Fetch promotion data for user's coin
  const {
    data: promotion,
    isLoading: promotionLoading
  } = useUserPromotion(userCoin?.id)

  const { 
    isLoading: statsLoading 
  } = useUserStats(farcasterUser?.fid || 0)

  // Memoize loading state
  const loading = useMemo(() => {
    return isFarcasterLoading || portfolioLoading || statsLoading || promotionLoading
  }, [isFarcasterLoading, portfolioLoading, statsLoading, promotionLoading])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatNumber = (num?: number) => {
    if (!num) return "0"
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTimeAgo = (dateString: string) => {
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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "bg-gray-100 text-gray-800"
      case "Rare":
        return "bg-blue-100 text-blue-800"
      case "Epic":
        return "bg-purple-100 text-purple-800"
      case "Legendary":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isFarcasterLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-6">
          {/* Profile Header Skeleton */}
          <div className="animate-pulse mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          
          {/* Profile Content Skeleton */}
          <div className="animate-pulse">
            {/* User Profile Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-center">
  <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
</div>
                <div className="flex-grow space-y-3">
                </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            
            {/* Portfolio Tab Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="aspect-square bg-gray-200 rounded mb-3"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!farcasterUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
      </div>
    )
  }

  return (
    <ProfileContent
      farcasterUser={farcasterUser}
      formatNumber={formatNumber}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      userCoin={userCoin}
      zoraData={zoraData || null}
      promotion={promotion || null}
      formatTimeAgo={formatTimeAgo}
      formatDate={formatDate}
      getRarityColor={getRarityColor}
      copyToClipboard={copyToClipboard}
    />
  )
}
