"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import type { ZoraToken } from "@/lib/zora-service"
import { Badge } from "@/components/ui/badge"

interface TradePanelProps {
  zoraData?: ZoraToken | null
}

export function TradePanel({ zoraData }: TradePanelProps) {
  const [amount, setAmount] = useState("")

  const handleQuickAmount = (value: string) => {
    setAmount(value)
  }

  const currentPrice = zoraData?.priceData?.price ? Number.parseFloat(zoraData.priceData.price) : 0

  const estimatedTokens = amount && currentPrice > 0 ? (Number.parseFloat(amount) / currentPrice).toFixed(2) : "0"

  return (
    <div className="space-y-6">
      {zoraData && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Current Price</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{currentPrice.toFixed(6)} ETH</span>
            {zoraData.priceData?.priceChange24h && (
              <Badge
                variant={zoraData.priceData.priceChange24h >= 0 ? "default" : "destructive"}
                className={
                  zoraData.priceData.priceChange24h >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }
              >
                {zoraData.priceData.priceChange24h >= 0 ? "+" : ""}
                {zoraData.priceData.priceChange24h.toFixed(2)}%
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Input
            type="text"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-right"
          />
          <span className="ml-2 text-gray-600">ETH</span>
        </div>

        <div className="flex justify-between gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={getMetalClassName('silver', 'static', 'flex-1')}
            style={getMetalStyle('silver')}
            onClick={() => handleQuickAmount("0.01")}
          >
            0.01 ETH
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={getMetalClassName('silver', 'static', 'flex-1')}
            style={getMetalStyle('silver')}
            onClick={() => handleQuickAmount("0.05")}
          >
            0.05 ETH
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={getMetalClassName('silver', 'static', 'flex-1')}
            style={getMetalStyle('silver')}
            onClick={() => handleQuickAmount("0.1")}
          >
            0.1 ETH
          </Button>
        </div>
      </div>

      {currentPrice > 0 && (
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Estimated tokens:</span>
            <span className="font-medium">
              {estimatedTokens} ${zoraData?.symbol}
            </span>
          </div>
        </div>
      )}

      <Button 
        className={getMetalClassName('gold', 'animated', 'w-full')}
        style={getMetalStyle('gold')}
      >
        Place Trade
      </Button>
    </div>
  )
}
