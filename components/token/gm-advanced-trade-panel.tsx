"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount, useWalletClient, usePublicClient, useBalance } from "wagmi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, Info, Settings, ExternalLink } from "lucide-react"
import { formatEther, parseEther, type Address } from "viem"
import { gmTokenTradingService0x, type GMTradeSimulation } from "@/lib/gm-token-trading-service-0x"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"

interface GMAdvancedTradePanelProps {
  token?: {
    contract_address?: string
    symbol?: string
    name?: string
    deployment_status?: string
  } | null
}

export function GMAdvancedTradePanel({ token }: GMAdvancedTradePanelProps) {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  // Trading state
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [amount, setAmount] = useState("")
  const [slippage, setSlippage] = useState("1") // 1% default slippage
  const [showSlippageSettings, setShowSlippageSettings] = useState(false)
  const [simulation, setSimulation] = useState<GMTradeSimulation | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isTrading, setIsTrading] = useState(false)
  const [simulationError, setSimulationError] = useState<string | null>(null)
  
  // Transaction status
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'confirming' | 'success' | 'error'>('idle')
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [transactionError, setTransactionError] = useState<string | null>(null)

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  })

  // Get GM token balance
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
      let result: GMTradeSimulation | null = null

      if (activeTab === "buy") {
        result = await gmTokenTradingService0x.simulateBuyCoins(token.contract_address as Address, amount, publicClient, address)
      } else {
        result = await gmTokenTradingService0x.simulateSellCoins(token.contract_address as Address, amount, publicClient, address)
      }

      if (result) {
        setSimulation(result)
      } else {
        setSimulationError("Could not simulate trade. Please try a different amount.")
      }
    } catch (error) {
      setSimulation(null)
      setSimulationError("Error simulating trade: " + (error instanceof Error ? error.message : "Unknown error"))
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
      setTransactionStatus('confirming')
      setTransactionError(null)
      setTransactionHash(null)

      const slippageTolerance = Number.parseFloat(slippage)
      let result

      // Create callbacks for transaction progress
      const callbacks = {
        onStepChange: (step: string) => {
        },
        onError: (error: string) => {
          setTransactionError(error)
          setTransactionStatus('error')
        },
        onSuccess: (txHash: string) => {
          setTransactionHash(txHash)
          setTransactionStatus('success')
        }
      }

      if (activeTab === "buy") {
        result = await gmTokenTradingService0x.buyCoins(
          token.contract_address as Address,
          amount,
          address,
          walletClient,
          publicClient,
          { slippageTolerance },
          callbacks
        )
      } else {
        result = await gmTokenTradingService0x.sellCoins(
          token.contract_address as Address,
          amount,
          address,
          walletClient,
          publicClient,
          { slippageTolerance },
          callbacks
        )
      }

      if (result) {
        // Reset form
        setAmount("")
        setSimulation(null)
      }
    } catch (error) {
      setTransactionStatus('error')
      setTransactionError(error instanceof Error ? error.message : 'Unknown error occurred')
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

  // Debug button disable conditions
  const buttonDisabled = 
    !isConnected ||
    isTrading ||
    isSimulating ||
    !amount ||
    hasInsufficientBalance ||
    !!simulationError ||
    !simulation

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
    <>
    <Card 
      className={getMetalClassName('pearl', 'static', 'border shadow-md')}
      style={getMetalStyle('pearl')}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trade {token.symbol || token.name}</span>
          <div className="flex items-center gap-2">
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
            <div className="flex justify-between text-sm">
              <span>Method:</span>
              <span className="text-gray-600 capitalize">{simulation.method}</span>
            </div>
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
          onClick={() => {
            executeTrade()
          }}
          disabled={buttonDisabled}
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
      </CardContent>
    </Card>

    {/* Transaction Status */}
    {transactionStatus === 'confirming' && (
      <Alert className="bg-yellow-50 border-yellow-200 mt-4">
        <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Transaction confirming...
        </AlertDescription>
      </Alert>
    )}

    {transactionStatus === 'success' && transactionHash && (
      <Alert className="bg-green-50 border-green-200 mt-4">
        <Info className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Transaction Successful!</strong>
          {transactionHash && transactionHash !== 'success' && (
            <div className="mt-2">
              <a
                href={`https://basescan.org/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-green-700 hover:text-green-900 font-medium"
              >
                View Transaction <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </AlertDescription>
      </Alert>
    )}

    {transactionStatus === 'error' && transactionError && (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Transaction Failed:</strong> {transactionError}
        </AlertDescription>
      </Alert>
    )}
  </>
  )
} 