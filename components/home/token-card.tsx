"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"

interface Token {
  id: string
  name: string
  symbol: string
  image: string
  creator: string
  followers: number
  mcap: string
  volume24h: string
  change24h: string
  timeAgo: string
  contract_address?: string
  hasZoraData?: boolean
  username?: string
}

interface TokenCardProps {
  token: Token
}

export function TokenCard({ token }: TokenCardProps) {
  const isPositive = !token.change24h.includes("-")

  return (
    <Link href={token.username ? `/token/${token.username}` : `/token/${token.id}`}>
      <Card 
        className={getMetalClassName('pearl', 'static', 'hover:shadow-lg transition-shadow cursor-pointer')}
        style={getMetalStyle('pearl')}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {typeof token.image === "string" && token.image ? (
                  <Image
                    src={token.image || "/placeholder.svg"}
                    alt={token.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                      target.nextElementSibling?.classList.remove("hidden")
                    }}
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-600">{token.symbol.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{token.name}</h3>
                </div>
                <p className="text-sm text-gray-500">${token.symbol}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {token.timeAgo}
            </Badge>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              @{token.creator} ({token.followers.toLocaleString()} followers)
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">MCAP</p>
              <p className="font-semibold">{token.mcap}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">24h Vol</p>
              <p className="font-semibold">{token.volume24h}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">24h Δ</p>
              <p className={`font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>{token.change24h}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
