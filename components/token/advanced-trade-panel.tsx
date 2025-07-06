"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount, useWalletClient, usePublicClient, useBalance } from "wagmi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Info, Settings } from "lucide-react"
import { formatEther, parseEther, type Address } from "viem"
import { zoraService, type ZoraToken } from "@/lib/zora-service"
import { zoraTradingService, type TradeSimulation } from "@/lib/zora-trading-service"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"

interface AdvancedTradePanelProps {
  token?: {
    contract_address?: string
    symbol?: string
    name?: string
    deployment_status?: string
  } | null
}

export function AdvancedTradePanel({ token }: AdvancedTradePanelProps) {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  // Zora data state
  const [zoraData, setZoraData] = useState<ZoraToken | null>(null)
  const [, setIsLoadingZoraData] = useState(false)

  // Trading state
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [amount, setAmount] = useState("")
  const [slippage, setSlippage] = useState("1") // 1% default slippage
  const [showSlippageSettings, setShowSlippageSettings] = useState(false)
  const [simulation, setSimulation] = useState<TradeSimulation | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isTrading, setIsTrading] = useState(false)
  const [simulationError, setSimulationError] = useState<string | null>(null)

  // Fetch Zora data when token changes
  useEffect(() => {
    async function fetchZoraData() {
      if (!token?.contract_address) {
        setZoraData(null)
        return
      }
      try {
        setIsLoadingZoraData(true)
        const data = await zoraService.getTokenByAddress(token.contract_address)
        setZoraData(data)
      } catch (error) {
        setZoraData(null)
      } finally {
        setIsLoadingZoraData(false)
      }
    }

    fetchZoraData()
  }, [token?.contract_address])

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  })

  // Get token balance (if available)
  const { data: tokenBalance } = useBalance({
    address: address,
    token: token?.contract_address as Address,
  })

  // Auto-simulate when amount changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (amount && token?.contract_address && publicClient && Number.parseFloat(amount) > 0) {
        simulateTrade()
      } else {
        setSimulation(null)
        setSimulationError(null)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [amount, activeTab, token?.contract_address])

  const simulateTrade = useCallback(async () => {
    if (!token?.contract_address || !publicClient || !amount) return

    try {
      setIsSimulating(true)
      setSimulationError(null)
      let result: TradeSimulation | null = null
      if (activeTab === "buy") {
        result = await zoraTradingService.simulateBuyCoins(token.contract_address as Address, amount, publicClient)
      } else {
        result = await zoraTradingService.simulateSellCoins(token.contract_address as Address, amount, publicClient)
      }
      if (result) {  
        setSimulation(result)
      } 
    } catch (error) {
      setSimulation(null)
    } finally {
      setIsSimulating(false)
    }
  }, [token?.contract_address, publicClient, amount, activeTab])

  const executeTrade = async () => {
    if (!token?.contract_address || !walletClient || !publicClient || !address || !amount) {
      return
    }

    try {
      setIsTrading(true)
      const slippageTolerance = Number.parseFloat(slippage)
      let result
      if (activeTab === "buy") {
        result = await zoraTradingService.buyCoins(
          token.contract_address as Address,
          amount,
          address,
          walletClient,
          publicClient,
          { slippageTolerance },
        )
      } else {
        result = await zoraTradingService.sellCoins(
          token.contract_address as Address,
          amount,
          address,
          walletClient,
          publicClient,
          { slippageTolerance },
        )
      }
      if (result) {
        // Reset form
        setAmount("")
        setSimulation(null)
      }
    } finally {
      setIsTrading(false)
    }
  }

  const handleQuickAmount = (value: string) => {
    setAmount(value)
  }

  const handleMaxAmount = () => {
    if (activeTab === "buy" && ethBalance) {
      // Leave some ETH for gas
      const maxEth = ethBalance.value - parseEther("0.01")
      if (maxEth > 0) {
        setAmount(formatEther(maxEth))
      }
    } else if (activeTab === "sell" && tokenBalance) {
      setAmount(formatEther(tokenBalance.value))
    }
  }

  const hasInsufficientBalance =
    activeTab === "buy"
      ? ethBalance && amount && parseEther(amount) > ethBalance.value
      : tokenBalance && amount && parseEther(amount) > tokenBalance.value

  const priceImpact = simulation?.priceImpact || 0
  const isHighPriceImpact = Math.abs(priceImpact) > 5 // 5% threshold

  if (!token?.contract_address || token.deployment_status !== "success") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Trading not available</p>
            <p className="text-sm">
              {!token?.contract_address ? "Token not deployed yet" : "Token deployment failed"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={getMetalClassName('pearl', 'static', 'border shadow-md')}
      style={getMetalStyle('pearl')}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trade {token.symbol || token.name}</span>
          <div className="flex items-center gap-2">
            {zoraData?.priceData?.priceChange24h !== undefined && (
              <Badge
                variant={zoraData.priceData.priceChange24h >= 0 ? "default" : "destructive"}
                className={
                  zoraData.priceData.priceChange24h >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }
              >
                {zoraData.priceData.priceChange24h >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {zoraData.priceData.priceChange24h.toFixed(2)}%
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSlippageSettings(!showSlippageSettings)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isConnected && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>Connect your wallet to trade this token.</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "buy" | "sell")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="text-green-600">
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell" className="text-red-600">
              Sell
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buy-amount">Amount (ETH)</Label>
              <div className="flex gap-2">
                <Input
                  id="buy-amount"
                  type="number"
                  step="0.0001"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleMaxAmount}>
                  Max
                </Button>
              </div>
              <div className="flex gap-1 flex-wrap">
                {["0.01", "0.05", "0.1"].map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(value)}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    {value} ETH
                  </Button>
                ))}
              </div>
              {ethBalance && (
                <p className="text-xs text-gray-500">Balance: {formatEther(ethBalance.value).slice(0, 8)} ETH</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sell-amount">Amount ({token.symbol})</Label>
              <div className="flex gap-2">
                <Input
                  id="sell-amount"
                  type="number"
                  step="0.0001"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleMaxAmount}>
                  Max
                </Button>
              </div>
              {tokenBalance && (
                <p className="text-xs text-gray-500">
                  Balance: {formatEther(tokenBalance.value).slice(0, 8)} {token.symbol}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Slippage Settings */}
        {showSlippageSettings && (
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <Label htmlFor="slippage" className="text-sm font-medium">Slippage Tolerance (%)</Label>
              <span className="text-xs text-gray-500">Current: {slippage}%</span>
            </div>
            <div className="flex gap-2">
              <Input
                id="slippage"
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="flex-1 h-8 text-sm"
              />
              <div className="flex gap-1">
                {["0.5", "1", "3"].map((value) => (
                  <Button
                    key={value}
                    variant={slippage === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSlippage(value)}
                    className="text-xs px-2 py-1 h-8"
                  >
                    {value}%
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trade Simulation */}
        {amount && simulation && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>You will receive:</span>
              <span className="font-medium">
                {formatEther(simulation.amountOut).slice(0, 8)}{" "}
                {activeTab === "buy" ? token.symbol : "ETH"}
              </span>
            </div>
            {simulation.priceImpact !== undefined && (
              <div className="flex justify-between text-sm">
                <span>Price Impact:</span>
                <span className={`font-medium ${isHighPriceImpact ? "text-red-600" : "text-gray-600"}`}>
                  {simulation.priceImpact.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}

        {isSimulating && (
          <div className="text-center py-2">
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            <p className="text-xs text-gray-500 mt-1">Simulating trade...</p>
          </div>
        )}

        {simulationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{simulationError}</AlertDescription>
          </Alert>
        )}

        {isHighPriceImpact && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              High price impact ({Math.abs(priceImpact).toFixed(2)}%). Consider reducing your trade size.
            </AlertDescription>
          </Alert>
        )}

        {hasInsufficientBalance && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Insufficient {activeTab === "buy" ? "ETH" : token.symbol} balance for this trade.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={executeTrade}
          disabled={
            !isConnected ||
            isTrading ||
            isSimulating ||
            !amount ||
            hasInsufficientBalance ||
            !!simulationError ||
            !simulation
          }
          className={getMetalClassName(
            activeTab === "buy" ? 'emerald' : 'ruby',
            'animated',
            'w-full'
          )}
          style={getMetalStyle(activeTab === "buy" ? 'emerald' : 'ruby')}
          size="lg"
        >
          {isTrading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {activeTab === "buy" ? "Buying..." : "Selling..."}
            </>
          ) : (
            `${activeTab === "buy" ? "Buy" : "Sell"} ${token.symbol || token.name}`
          )}
        </Button>
        {/* Warning: TradeCoin is not fully functional */}
        <div className="mt-4">
          <Alert variant="default" className="flex items-start gap-2 bg-yellow-50 border-yellow-300 text-yellow-900">
            <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-500" />
            <AlertDescription>
              <strong>TradeCoin is not fully functional yet.</strong> Transactions may <span className="font-semibold">fail</span>. Please wait for the Zora team to upgrade the SDK to support <span className="font-semibold">Uniswap v4</span>.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  )
}
