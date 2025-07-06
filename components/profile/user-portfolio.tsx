"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { coinsService, type CoinData } from "@/lib/coins-service"
import { zoraService, type ZoraToken } from "@/lib/zora-service"
import Link from "next/link"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"

export function UserPortfolio() {
  const { address, isConnected } = useAccount()
  const [userCoins, setUserCoins] = useState<CoinData[]>([])
  const [zoraData, setZoraData] = useState<Record<string, ZoraToken>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchUserCoins() {
      if (!address) return
      try {
        setLoading(true)
        // from their wallet or from a subgraph
        const { coins } = await coinsService.getAllCoins(10, 0, "success")
        setUserCoins(coins.slice(0, 3)) // Show first 3 for demo
        // Fetch Zora data for these coins
        const coinsWithAddresses = coins.filter((coin) => coin.contract_address)
        if (coinsWithAddresses.length > 0) {
          const requests = coinsWithAddresses.map((coin) => ({
            collectionAddress: coin.contract_address!,
            chainId: 8453,
          }))

          const zoraTokens = await zoraService.getTokensByAddresses(requests)
          const zoraRecord: Record<string, ZoraToken> = {}
          zoraTokens.forEach((token) => {
            zoraRecord[token.address.toLowerCase()] = token
          })
          setZoraData(zoraRecord)
        }
      } finally {
        setLoading(false)
      }
    }

    if (isConnected) {
      fetchUserCoins()
    }
  }, [address, isConnected])

  if (!isConnected) {
    return (
      <Card
        className={getMetalClassName('pearl', 'static')}
        style={getMetalStyle('pearl')}
      >
        <CardContent className="p-6 text-center">
          <Wallet className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Connect your wallet to view portfolio</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card
        className={getMetalClassName('pearl', 'static')}
        style={getMetalStyle('pearl')}
      >
        <CardHeader>
          <CardTitle>Your Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-grow">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={getMetalClassName('pearl', 'static')}
      style={getMetalStyle('pearl')}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Coin</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {userCoins.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-2">No tokens in portfolio</p>
            <p className="text-sm text-gray-400">Start trading to build your portfolio</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userCoins.map((coin) => {
              const zora = coin.contract_address ? zoraData[coin.contract_address.toLowerCase()] : undefined
              const priceChange = zora?.priceData?.priceChange24h || 0

              return (
                <Link key={coin.id} href={`/token/${coin.creator_username || coin.id}`}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      {coin.image_url ? (
                        <img
                          src={coin.image_url || "/placeholder.svg"}
                          alt={coin.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `<span class="text-white font-bold text-sm">${coin.symbol.charAt(0)}</span>`
                            }
                          }}
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">{coin.symbol.charAt(0)}</span>
                      )}
                    </div>

                    <div className="flex-grow">
                      <div>
                        <h3 className="font-medium">
                          {coin.name.length > 10 ? coin.name.slice(0, 10) + "..." : coin.name}
                        </h3>
                        <span className="text-gray-500 text-sm block">
                          ${coin.symbol.length > 10 ? coin.symbol.slice(0, 10) + "..." : coin.symbol}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {zora?.priceData?.price && `${Number.parseFloat(zora.priceData.price).toFixed(6)} ETH`}
                      </p>
                    </div>

                    <div className="text-right">
                      <Badge
                        variant={priceChange >= 0 ? "default" : "destructive"}
                        className={priceChange >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {priceChange >= 0 ? (
                          <TrendingUp className="h-3 w-4" />
                        ) : (
                          <TrendingDown className="h-3 w-4" />
                        )}
                      </Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
