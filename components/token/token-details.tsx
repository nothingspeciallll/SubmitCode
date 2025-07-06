"use client"

import Image from "next/image"
import { Copy, ExternalLink, TrendingUp, Users, Activity } from "lucide-react"
import type { ZoraToken } from "@/lib/zora-service"
import { TokenShareButton } from "./token-share-button"
import { TokenZoraButton } from "./token-zora-button"
import { Card, CardContent } from "@/components/ui/card"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { sdk } from '@farcaster/frame-sdk'

interface TokenDetailsProps {
  token: any
  zoraData?: ZoraToken | null
}

export function TokenDetails({ token, zoraData }: TokenDetailsProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const openUrl = async (url: string) => {
    await sdk.actions.openUrl(url)
  }

  const formatNumber = (num?: number | string) => {
    if (!num) return "0"
    const value = typeof num === "string" ? Number.parseFloat(num) : num
    if (isNaN(value)) return "0"

    if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`
    return value.toLocaleString()
  }

  const formatSupply = (supply?: string, decimals?: number) => {
    if (!supply || !decimals) return "N/A"
    try {
      const value = Number.parseFloat(supply) / Math.pow(10, decimals)
      return formatNumber(value)
    } catch {
      return "N/A"
    }
  }

  const formatPrice = (price?: string) => {
    if (!price) return "N/A"
    try {
      const value = Number.parseFloat(price)
      if (value === 0) return "0"
      if (value < 0.000001) return `${value.toExponential(3)} ETH`
      if (value < 0.01) return `${value.toFixed(6)} ETH`
      return `${value.toFixed(4)} ETH`
    } catch {
      return "N/A"
    }
  }

  return (
    <Card
      className={getMetalClassName('pearl', 'static')}
      style={getMetalStyle('pearl')}
    >
      <CardContent className="p-6">
        <div className={`flex flex-row gap-4 p-4 rounded-xl ${getMetalClassName('pearl', 'static')}`} style={getMetalStyle('pearl')}>
          {/* Token Image */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {typeof token.image === "string" && token.image ? (
                <Image
                  src={token.image || "/placeholder.svg"}
                  alt={token.name}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `<span class="text-5xl font-bold text-gray-600">${token.symbol.charAt(0)}</span>`
                    }
                  }}
                />
              ) : (
                <span className="text-5xl font-bold text-gray-600">{token.symbol.charAt(0)}</span>
              )}
            </div>
          </div>

          {/* Token Info */}
          <div className="flex-grow flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-bold">{token.name}</h1>
            <span className="text-lg sm:text-xl text-gray-500 mb-1">${token.symbol}</span>
            
            {/* Creator Info */}
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 text-gray-500" />
              <span className="text-sm text-gray-600">
                Created by <span 
                  onClick={() => openUrl(`https://farcaster.xyz/${token.username}`)} 
                  className="font-medium hover:text-blue-500 cursor-pointer"
                >
                  @{token.username || token.creator}
                </span>
              </span>
            </div>
          </div>
        </div>


        {/* Description */}
        {token.description && (
          <p className="text-gray-700 mb-4 text-sm leading-relaxed mt-4">{token.description}</p>
        )}

        {/* Contract Information */}
        <div className="space-y-3 mb-6 mt-4">
          {token.contract_address && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Contract:</span>
              <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-md text-sm">
                <span className="font-mono">{`${token.contract_address.slice(0, 6)}...${token.contract_address.slice(-4)}`}</span>
                <ExternalLink 
                  className="h-3 w-3 hover:text-blue-500 cursor-pointer ml-1" 
                  onClick={() => openUrl(`https://basescan.org/address/${token.contract_address}`)}
                />
              </div>
            </div>
          )}

          {zoraData?.creator?.address && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Creator:</span>
              <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-md text-sm">
                <span className="font-mono">{`${zoraData.creator.address.slice(0, 6)}...${zoraData.creator.address.slice(-4)}`}</span>
                <Copy 
                  className="h-3 w-3 cursor-pointer hover:text-blue-500" 
                  onClick={() => copyToClipboard(zoraData.creator.address)} 
                />
                <ExternalLink 
                  className="h-3 w-3 hover:text-blue-500 cursor-pointer ml-1" 
                  onClick={() => openUrl(`https://basescan.org/address/${zoraData.creator.address}`)}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-4 mb-4 justify-center">
          <TokenShareButton
            tokenName={token.name}
            tokenSymbol={token.symbol}
            username={token.username || ''}
            marketCap={zoraData?.stats?.volume ? zoraData.stats.volume.toString() : undefined}
            priceChange24h={zoraData?.priceData?.priceChange24h ? `${zoraData.priceData.priceChange24h}%` : undefined}
          />
          
          {token.contract_address && (
            <TokenZoraButton contractAddress={token.contract_address} />
          )}
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <p className="text-gray-500 text-sm">Price</p>
            </div>
            <p className="font-bold text-lg">
              {formatPrice(zoraData?.priceData?.price)}
            </p>
            {zoraData?.priceData?.priceChange24h !== undefined && (
              <p className={`text-xs ${zoraData.priceData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {zoraData.priceData.priceChange24h >= 0 ? '+' : ''}{zoraData.priceData.priceChange24h.toFixed(2)}%
              </p>
            )}
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-gray-500" />
              <p className="text-gray-500 text-sm">Holders</p>
            </div>
            <p className="font-bold text-lg">{formatNumber(zoraData?.stats?.holders || 0)}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-4 w-4 text-gray-500" />
              <p className="text-gray-500 text-sm">Market Cap</p>
            </div>
            <p className="font-bold text-lg">
              {zoraData?.stats?.marketCap ? `${formatNumber(zoraData.stats.marketCap)} ETH` : "N/A"}
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm mb-1">Total Supply</p>
            <p className="font-bold text-lg">
              {formatSupply(zoraData?.totalSupply, zoraData?.decimals)}
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        {zoraData && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-1">Volume (24h)</p>
              <p className="font-semibold">
                {zoraData.stats?.volume ? `${formatNumber(zoraData.stats.volume)} ETH` : "N/A"}
              </p>
            </div>

            <div className="text-center">
              <p className="text-gray-500 text-sm mb-1">Transactions</p>
              <p className="font-semibold">{formatNumber(zoraData.stats?.transactions || 0)}</p>
            </div>

            <div className="text-center hidden md:block">
              <p className="text-gray-500 text-sm mb-1">Floor Price</p>
              <p className="font-semibold">
                {zoraData.stats?.floorPrice ? `${formatNumber(zoraData.stats.floorPrice)} ETH` : "N/A"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
