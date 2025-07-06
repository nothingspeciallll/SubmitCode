"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { usePoolInfo, useNextClaimTime } from "@/hooks/use-token-claim-contract"
import { DepositTokenModal } from "@/components/deposit-token-modal"
import { useFarcaster } from "@/hooks/use-farcaster"
import { Address, formatUnits } from "viem"
import { Coins, Clock, Gift, Plus } from "lucide-react"
import { coinsService } from "@/lib/coins-service"

// In a real app, you might get this from events or a subgraph
export function AirdropTokenList() {
  const { user: farcasterUser } = useFarcaster()
  const [userTokens, setUserTokens] = useState<any[]>([])

  // Fetch user's created tokens to add to the list
  useEffect(() => {
    async function fetchUserTokens() {
      if (!farcasterUser?.fid) {
        setUserTokens([])
        return
      }

      try {
        const userCoin = await coinsService.getUserCoinByFid(farcasterUser.fid)
        if (userCoin && userCoin.contract_address && userCoin.deployment_status === "success") {
          setUserTokens([{
            address: userCoin.contract_address as Address,
            name: userCoin.name,
            symbol: userCoin.symbol,
            image: userCoin.image_url,
            decimals: 18,
            isUserToken: true,
          }])
        }
      } catch (error) {
        setUserTokens([])
      }
    }
    fetchUserTokens()
  }, [farcasterUser?.fid])

  // Combine known tokens with user tokens
  const allTokens = [...userTokens]

  return (
    <div className="space-y-4">
      {allTokens.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Coins className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">No tokens available yet</p>
          <p className="text-sm">Be the first to deposit tokens for the community!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {allTokens.map((token) => (
            <TokenPoolCard
              key={token.address}
              token={token}
            />
          ))}
        </div>
      )}

      {/* Add Token Pool Section */}
      {farcasterUser?.fid && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Add Your Token to Airdrop</h3>
              <p className="text-sm text-gray-600 mb-4">
                Deposit your token to create a community pool and increase awareness
              </p>
              {userTokens.length > 0 ? (
                <p className="text-xs text-green-600">
                  Your token is already listed above! Use the deposit button to add to its pool.
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Create your token first, then come back to add it to the airdrop pool.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TokenPoolCard({ token }: { token: any }) {
  const { poolInfo, isLoading: isLoadingPool, refetch: refetchPoolInfo } = usePoolInfo(token.address)
  const { canClaim, nextClaimTime } = useNextClaimTime(token.address)
  const { user: farcasterUser } = useFarcaster()

  const formatPoolBalance = (balance: bigint, decimals: number = 18) => {
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

  const getTimeUntilNextClaim = () => {
    if (!nextClaimTime) return null
    const now = new Date()
    const diff = nextClaimTime.getTime() - now.getTime()
    if (diff <= 0) return null
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const hasPool = poolInfo && poolInfo.totalPool > BigInt(0)
  const timeUntilClaim = getTimeUntilNextClaim()

  return (
    <Card className={`${hasPool ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Token Info */}
          <div className="flex items-center space-x-4">
            <div className={getMetalClassName('silver', 'static', 'w-12 h-12 rounded-lg flex items-center justify-center')} style={getMetalStyle('silver')}>
              {token.image ? (
                <img src={token.image} alt={token.name} className="w-8 h-8 rounded-lg" />
              ) : (
                <Coins className="w-6 h-6 text-black" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-lg">{token.name}</h3>
                <Badge variant="secondary">{token.symbol}</Badge>
                {token.isUserToken && (
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    Your Token
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {isLoadingPool ? (
                  <span>Loading pool info...</span>
                ) : hasPool ? (
                  <>
                    <div className="flex items-center space-x-1">
                      <Coins className="w-4 h-4" />
                      <span>Pool: {formatPoolBalance(poolInfo.totalPool, token.decimals)} {token.symbol}</span>
                    </div>
                    {timeUntilClaim && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Next claim: {timeUntilClaim}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500">No pool yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {hasPool && (
              <Button
                variant={canClaim ? "default" : "secondary"}
                size="sm"
                disabled={!canClaim || !farcasterUser?.fid}
                className={canClaim ? getMetalClassName('gold', 'animated') : ''}
                style={canClaim ? getMetalStyle('gold') : undefined}
              >
                {canClaim ? (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Claim
                  </>
                ) : (
                  "Claimed"
                )}
              </Button>
            )}

            {token.isUserToken && (
              <DepositTokenModal
                tokenAddress={token.address}
                tokenName={token.name}
                tokenSymbol={token.symbol}
                tokenImage={token.image}
                tokenDecimals={token.decimals}
                isUserToken={true}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Deposit
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {/* Pool Status */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Status: {hasPool ? 
                <span className="text-green-600 font-medium">Active Pool</span> : 
                <span className="text-gray-500">No Pool</span>
              }
            </span>
            {hasPool && (
              <span>
                Max claim: {formatPoolBalance(poolInfo.totalPool / BigInt(100), token.decimals)} {token.symbol}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 