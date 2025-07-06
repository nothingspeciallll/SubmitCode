"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { useFarcaster } from "@/hooks/use-farcaster"
import { useTokenBalance } from "@/hooks/use-token-balance"
import { coinsService, type CoinData } from "@/lib/coins-service"
import { DepositTokenModal } from "@/components/deposit-token-modal"
import { Wallet, Plus, Coins, ExternalLink } from "lucide-react"
import { Address, formatUnits } from "viem"
import Link from "next/link"

export function DepositCard() {
  const { user: farcasterUser, isLoading: isFarcasterLoading } = useFarcaster()
  const [userToken, setUserToken] = useState<CoinData | null>(null)
  const [, setIsLoadingToken] = useState(false)
  
  // Get token balance if user has deployed token
  const { balance, isLoading: isLoadingBalance, isError: isBalanceError } = useTokenBalance(
    userToken?.contract_address as Address
  )

  // Fetch user's token from Supabase
  useEffect(() => {
    async function fetchUserToken() {
      if (!farcasterUser?.fid) {
        setUserToken(null)
        return
      }
      try {
        setIsLoadingToken(true)
        const tokenData = await coinsService.getUserCoinByFid(farcasterUser.fid)
        setUserToken(tokenData)
      } finally {
        setIsLoadingToken(false)
      }
    }

    if (farcasterUser && !isFarcasterLoading) {
      fetchUserToken()
    }
  }, [farcasterUser, isFarcasterLoading])

  // Format balance for display
  const formatBalance = (balance: bigint, decimals: number = 18) => {
    try {
      if (balance === BigInt(0)) return "0"
      const formatted = formatUnits(balance, decimals)
      const num = parseFloat(formatted)
      if (num < 0.001) return "< 0.001"
      if (num < 1) return num.toFixed(6)
      if (num < 1000) return num.toFixed(3)
      if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
      return `${(num / 1000000).toFixed(1)}M`
    } catch {
      return "0"
    }
  }

  // User has not created a token yet
  if (!userToken) {
    return (
      <Card
        className={getMetalClassName('pearl', 'static')}
        style={getMetalStyle('pearl')}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className={getMetalClassName('gold', 'animated', 'w-8 h-8 rounded-lg flex items-center justify-center')} style={getMetalStyle('gold')}>
              <Wallet className="w-4 h-4 text-black" />
            </div>
            <span>Token Deposit</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600 mb-4">You haven't created a token yet</p>
          </div>
          
          <Link href="/create">
            <Button 
              className={getMetalClassName('gold', 'animated')}
              style={getMetalStyle('gold')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Coin Profile
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // User has a token but it's not deployed yet
  if (userToken.deployment_status !== "success" || !userToken.contract_address) {
    return (
      <Card
        className={getMetalClassName('pearl', 'static')}
        style={getMetalStyle('pearl')}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className={getMetalClassName('gold', 'animated', 'w-8 h-8 rounded-lg flex items-center justify-center')} style={getMetalStyle('gold')}>
              <Wallet className="w-4 h-4 text-black" />
            </div>
            <span>Token Deposit</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className={getMetalClassName('silver', 'static', 'w-10 h-10 rounded-lg flex items-center justify-center')} style={getMetalStyle('silver')}>
              {userToken.image_url ? (
                <img src={userToken.image_url} alt={userToken.name} className="w-6 h-6 rounded" />
              ) : (
                <Coins className="w-5 h-5 text-black" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{userToken.name}</h3>
              <p className="text-sm text-gray-600">{userToken.symbol}</p>
            </div>
            <Badge 
              variant="outline" 
              className={
                userToken.deployment_status === "pending" ? "border-yellow-400 text-yellow-600" :
                userToken.deployment_status === "failed" ? "border-red-400 text-red-600" :
                "border-gray-400 text-gray-600"
              }
            >
              {userToken.deployment_status}
            </Badge>
          </div>

          <div className="text-center space-y-2">
            <p className="text-gray-600">
              {userToken.deployment_status === "pending" 
                ? "Your token is being deployed..." 
                : "Your token needs to be deployed before you can deposit"}
            </p>
            
            <Link href="/create">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Coin Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // User has a successfully deployed token
  return (
    <Card
      className={getMetalClassName('pearl', 'static')}
      style={getMetalStyle('pearl')}
    >
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className={getMetalClassName('gold', 'animated', 'w-8 h-8 rounded-lg flex items-center justify-center')} style={getMetalStyle('gold')}>
            <Wallet className="w-4 h-4 text-black" />
          </div>
          <span>Token Deposit</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Info */}
        <div className="flex items-center space-x-3">
          {userToken.image_url ? (
            <img src={userToken.image_url} alt={userToken.name} className="w-10 h-10 rounded" />
          ) : (
            <Coins className="w-5 h-5 text-black" />
          )}
          
          <div className="flex-1">
            <h3 className="font-semibold">{userToken.name}</h3>
            <p className="text-sm text-gray-600">${userToken.symbol}</p>
          </div>
          <Badge variant="outline" className="border-green-400 text-green-600">
            Deployed
          </Badge>
        </div>

        {/* Token Balance */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Your Balance:</span>
            <span className="font-semibold">
              {isLoadingBalance ? (
                "Loading..."
              ) : isBalanceError ? (
                "Unable to fetch"
              ) : (
                `${formatBalance(balance || BigInt(0))} ${userToken.symbol}`
              )}
            </span>
          </div>
        </div>

        {/* Deposit Button */}
        <DepositTokenModal
          tokenAddress={userToken.contract_address as Address}
          tokenName={userToken.name}
          tokenSymbol={userToken.symbol}
          tokenImage={userToken.image_url}
          tokenDecimals={18}
          isUserToken={true}
          trigger={
            <Button 
              className={`w-full ${getMetalClassName('gold', 'animated')}`}
              style={getMetalStyle('gold')}
              disabled={isLoadingBalance || isBalanceError || balance === BigInt(0)}
            >
              <Coins className="w-4 h-4 mr-2" />
              Deposit Tokens
            </Button>
          }
        />

        {/* Helper text */}
        <p className="text-xs text-gray-500 text-center">
          Deposit your tokens to create an airdrop pool for the community and Marketing your self.
        </p>
      </CardContent>
    </Card>
  )
} 