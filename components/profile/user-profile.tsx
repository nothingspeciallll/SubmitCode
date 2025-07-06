"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy } from "lucide-react"
import { useFarcaster } from "@/hooks/use-farcaster"
import { coinsService } from "@/lib/coins-service"

export function UserProfile() {
  const { user: farcasterUser, isLoading } = useFarcaster()
  const [userCoin, setUserCoin] = useState<any>(null)
  const [loadingCoin, setLoadingCoin] = useState(false)

  useEffect(() => {
    async function fetchUserCoin() {
      if (!farcasterUser?.fid) return
      try {
        setLoadingCoin(true)
        const coin = await coinsService.getUserCoinByFid(farcasterUser.fid)
        setUserCoin(coin)
      } finally {
        setLoadingCoin(false)
      }
    }

    if (farcasterUser && !isLoading) {
      fetchUserCoin()
    }
  }, [farcasterUser, isLoading])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (isLoading || loadingCoin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!farcasterUser) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <img
            src={
              typeof farcasterUser.pfpUrl === "string" && farcasterUser.pfpUrl
                ? farcasterUser.pfpUrl
                : "/placeholder.svg"
            }
            alt={farcasterUser.displayName || "User"}
            className="w-16 h-16 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg"
            }}
          />
          <div>
            <h3 className="font-semibold text-lg">{farcasterUser.displayName}</h3>
            <p className="text-gray-500">@{farcasterUser.username}</p>
            <Badge variant="secondary" className="mt-1">
              FID: {farcasterUser.fid}
            </Badge>
          </div>
        </div>

        {userCoin ? (
          <div className="space-y-2">
            <h4 className="font-medium">Your Coin Profile</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  {userCoin.image_url ? (
                    <img
                      src={userCoin.image_url || "/placeholder.svg"}
                      alt={userCoin.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `<span class="text-white font-bold text-sm">${userCoin.symbol.charAt(0)}</span>`
                        }
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">{userCoin.symbol.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold">{userCoin.name}</h3>
                  <p className="text-gray-500 text-sm">${userCoin.symbol}</p>
                </div>
                <Badge
                  variant={
                    userCoin.deployment_status === "success"
                      ? "default"
                      : userCoin.deployment_status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {userCoin.deployment_status}
                </Badge>
              </div>

              {userCoin.contract_address && (
                <div className="flex items-center justify-between bg-white p-2 rounded text-xs">
                  <span className="font-mono">{userCoin.contract_address}</span>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(userCoin.contract_address)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(`https://basescan.org/address/${userCoin.contract_address}`, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-2">You haven't created your coin profile yet</p>
            <Button className="bg-cyan-400 hover:bg-cyan-500 text-black">Create Your Coin Profile</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
