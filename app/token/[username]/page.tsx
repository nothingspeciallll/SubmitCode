"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { TokenDetails } from "@/components/token/token-details"
import { AdvancedTradePanel } from "@/components/token/advanced-trade-panel"
import { PriceChart } from "@/components/price-chart"
import { coinsService, type CoinData } from "@/lib/coins-service"
import { zoraService, type ZoraToken } from "@/lib/zora-service"
import { UserPortfolio } from "@/components/profile/user-portfolio"
import { TokenFrameMeta } from "@/components/token/token-frame-meta"

export default function TokenPage() {
  const { username } = useParams()
  const [token, setToken] = useState<CoinData | null>(null)
  const [zoraData, setZoraData] = useState<ZoraToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isUnmountedRef = useRef(false)

  // Fetch token data from Supabase and Zora by username
  useEffect(() => {
    let isMounted = true
    isUnmountedRef.current = false

    async function fetchToken() {
      if (!username || typeof username !== 'string') return

      try {
        if (isMounted && !isUnmountedRef.current) {
          setLoading(true)
          setError(null)
        }

        // Find token by username
        const tokenData = await coinsService.getCoinByUsername(username)
        if (tokenData && isMounted && !isUnmountedRef.current) {
          setToken(tokenData)
          
          // If we have a contract address, fetch Zora data
          if (tokenData.contract_address) {
            try {
              const zoraTokenData = await zoraService.getTokenByAddress(tokenData.contract_address)
              if (zoraTokenData && isMounted && !isUnmountedRef.current) {
                setZoraData(zoraTokenData)
              } 
            } catch (zoraError) {
              console.warn('Error fetching Zora data:', zoraError)
            }
          }
        } else if (isMounted && !isUnmountedRef.current) {
          setError("Token not found")
        }
      } catch {
        if (isMounted && !isUnmountedRef.current) {
          setError("Error loading token data")
        }
      } finally {
        if (isMounted && !isUnmountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchToken()

    return () => {
      isMounted = false
      isUnmountedRef.current = true
    }
  }, [username])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  // Convert CoinData and ZoraToken to token format for components
  const tokenForDisplay = token
    ? {
        id: token.id?.toString() || "",
        name: token.name,
        symbol: token.symbol,
        image: zoraData?.metadata?.image || token.image_url || "/placeholder.svg",
        creator:
          zoraData?.creator?.username ||
          zoraData?.creator?.displayName ||
          token.creator_username ||
          token.creator_display_name ||
          "Unknown",
        followers: zoraData?.stats?.holders || 0,
        mcap: zoraData?.stats?.marketCap
          ? formatCurrency(zoraData.stats.marketCap)
          : token.deployment_status === "success"
            ? "26.5k"
            : "--",
        volume24h: zoraData?.stats?.volume ? formatCurrency(zoraData.stats.volume) : "--",
        change24h: zoraData?.priceData?.priceChange24h
          ? `${zoraData.priceData.priceChange24h > 0 ? "+" : ""}${zoraData.priceData.priceChange24h.toFixed(2)}%`
          : "0.0%",
        timeAgo: zoraData?.createdAt ? formatTimeAgo(zoraData.createdAt) : formatTimeAgo(token.created_at || ""),
        description: zoraData?.metadata?.description || token.description,
        contract_address: zoraData?.address || token.contract_address,
        deployment_status: token.deployment_status,
        currency: token.currency,
        price: zoraData?.priceData?.price,
        holders: zoraData?.stats?.holders,
        transactions: zoraData?.stats?.transactions,
        creatorAddress: zoraData?.creator?.address,
        totalSupply: zoraData?.totalSupply,
        decimals: zoraData?.decimals,
        username: token.creator_username,
      }
    : null

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="flex justify-between mb-6">
              <div className="h-10 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                    <div className="flex-grow space-y-4">
                      <div className="h-8 bg-gray-200 rounded w-48"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-64"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="h-40 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !tokenForDisplay) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Token Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || "The token you're looking for doesn't exist or may have been removed."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button 
                  variant="outline" 
                  className={`${getMetalClassName('pearl', 'static')} flex items-center gap-2`}
                  style={getMetalStyle('pearl')}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/create">
                <Button className="bg-cyan-400 hover:bg-cyan-500 text-black">Create Your Coin</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Farcaster Frame Meta Tag */}
      {tokenForDisplay && (
        <TokenFrameMeta
          tokenName={tokenForDisplay.name}
          tokenSymbol={tokenForDisplay.symbol}
          username={username as string}
          tokenAddress={tokenForDisplay.contract_address}
          metal="silver"
        />
      )}
      
      <Header />
      <main className="container mx-auto px-4 py-6">
        {/* Back Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/">
            <Button 
              variant="outline" 
              size="sm" 
              className={`${getMetalClassName('pearl', 'static')} flex items-center gap-2`}
              style={getMetalStyle('pearl')}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Token Details and Chart */}
          <div className="lg:col-span-2 space-y-6">
            <TokenDetails token={tokenForDisplay} zoraData={zoraData} />
            <PriceChart tokenAddress={tokenForDisplay.contract_address} />
          </div>

          {/* Right Column - Trading Panel and Portfolio */}
          <div className="lg:col-span-1 space-y-6">
            <AdvancedTradePanel token={tokenForDisplay} />
            <UserPortfolio />
          </div>
        </div>
      </main>
    </div>
  )
}