"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Coins, 
  Star, 
  Wallet,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { usePortfolio } from "@/hooks/use-portfolio"
import type { TokenWithBalance, PortfolioData } from "@/lib/alchemy-portfolio-service"

export function PortfolioTab() {
  const router = useRouter()
  const { portfolio, isLoading, isConnected} = usePortfolio()
  const handleTokenClick = (token: TokenWithBalance) => {
    if (token.isInSupabase && token.coinData?.creator_username) {
      // Navigate to token page using creator username
      router.push(`/token/${token.coinData.creator_username}`)
    } 
  }


  if (!isConnected) {
    return (
      <Card className={getMetalClassName('pearl', 'static')} style={getMetalStyle('pearl')}>
        <CardContent className="p-6">
          <div className="text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-500 mb-4">
              Connect your wallet to view your token portfolio on Base network
            </p>
            <p className="text-sm text-gray-400">
              We'll show all your tokens and highlight the ones from our platform
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className={getMetalClassName('pearl', 'static')} style={getMetalStyle('pearl')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Portfolio Overview
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const portfolioData = portfolio as PortfolioData
  if (!portfolioData || portfolioData.totalTokens === 0) {
    return (
      <Card className={getMetalClassName('pearl', 'static')} style={getMetalStyle('pearl')}>
        <CardContent className="p-6">
          <div className="text-center">
            <Coins className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Tokens Found</h3>
            <p className="text-gray-500 mb-4">
              No tokens found in your wallet on Base network
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/create">
                <Button className={getMetalClassName('gold', 'animated')} style={getMetalStyle('gold')}>
                  Create Your First Token
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card className={getMetalClassName('pearl', 'static')} style={getMetalStyle('pearl')}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-blue-500" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{portfolioData.totalTokens}</div>
              <div className="text-sm text-gray-500">Total Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{portfolioData.supabaseTokens}</div>
              <div className="text-sm text-gray-500">Farcoins</div>
            </div>
          </div>
          
          {portfolioData.lastUpdated && (
            <div className="text-xs text-gray-400 text-center mt-4">
              Last updated: {new Date(portfolioData.lastUpdated).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tokens List */}
      <div className="space-y-3">
        {portfolioData.tokens.map((token: TokenWithBalance) => (
          <Card  
            key={token.contractAddress}
            className={`cursor-pointer transition-all hover:shadow-md ${
              token.isInSupabase 
                ? getMetalClassName('gold', 'static', 'border-2 border-yellow-200') 
                : 'hover:border-gray-300'
            }`}
            style={token.isInSupabase ? getMetalStyle('gold') : undefined}
            onClick={() => handleTokenClick(token)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  
                  {/* Token Logo */}
                  <div className="relative">
                    {token.metadata.logo ? (
                      <img 
                        src={token.metadata.logo} 
                        alt={token.metadata.name}
                        className="h-12 w-12 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {token.metadata.symbol?.charAt(0) || '?'}
                      </div>
                    )}
                    
                    {token.isInSupabase && (
                      <Star className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500 fill-current" />
                    )}
                  </div>

                  {/* Token Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {token.isInSupabase ? token.coinData?.name : token.metadata.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {token.metadata.symbol}
                      </Badge>
                      {token.isInSupabase && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Farcoin
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500 mt-1">
                      {token.isInSupabase && token.coinData?.creator_username && (
                        <span>by @{token.coinData.creator_username}</span>
                      )}
                      {!token.isInSupabase && (
                        <span>Balance: {token.formattedBalance}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Balance & Action */}
                <div className="text-right">
                  <div className="font-semibold">
                    {token.formattedBalance} {token.metadata.symbol}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {token.isInSupabase ? (
                      <Button size="sm" variant="outline">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Trade
                      </Button>
                    ) : null} 
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 