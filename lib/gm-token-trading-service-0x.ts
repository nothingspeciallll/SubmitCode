import { type Address, parseEther, formatEther, maxUint256 } from "viem"
import type { WalletClient, PublicClient } from "viem"
import { base } from "wagmi/chains"

export interface GMTradeSimulation {
  orderSize: bigint
  amountOut: bigint
  priceImpact?: number
  estimatedGas?: bigint
  method: 'exact' | 'estimated'
  minAmountOut: bigint
  route?: any
  fees?: any
}

export interface TransactionCallbacks {
  onStepChange?: (step: "preparing" | "approval" | "signing" | "broadcasting" | "confirming" | "success" | "error") => void
  onError?: (error: string) => void
  onSuccess?: (txHash: string) => void
}

export interface GMTradeResult {
  hash: string
  trade: {
    direction: "buy" | "sell"
    orderSize: bigint
    amountOut: bigint
    recipient: Address
  }
}


// Contract addresses on Base
const GM_TOKEN_ADDRESS = "0x3cC0D3ECC81bA57ABF3494abc8D4cb0a43410b07" as Address
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as Address
const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address

// ERC20 ABI for token operations
const ERC20_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

class GMTokenTradingService0x {
  private apiKey: string

  constructor(apiKey?: string) {
    // Use your API key directly for now
    this.apiKey = apiKey || "55d66996-2220-4bea-a3bf-cf5bc162f048" || process.env.ZERO_EX_API_KEY || ""
    if (!this.apiKey) {
      console.warn("⚠️  No 0x API key provided. Some functionality may be limited.")
    } else {
    }
  }

  /**
   * Get request headers for local API proxy calls
   */
  private getHeaders(): Headers {
    const headers = new Headers({
      "Content-Type": "application/json",
    })
    
    // No need to add 0x headers since we're using local proxy
    return headers
  }

  /**
   * Build API URL for price or quote endpoints - using local proxy to avoid CORS
   */
  private buildApiUrl(endpoint: 'price' | 'quote', params: Record<string, string>): string {
    const searchParams = new URLSearchParams({
      ...params,
      endpoint
    })
    return `/api/0x-proxy?${searchParams.toString()}`
  }

  /**
   * Calculate random volume with variation
   */
  private calculateRandomVolume(baseVolume: number, variationPercent: number = 20): number {
    if (variationPercent === 0) {
      return baseVolume
    }
    
    const randomVariation = (Math.random() * 2 - 1) * variationPercent / 100
    const adjustedVolume = baseVolume * (1 + randomVariation)
    const finalVolume = Math.max(Math.min(adjustedVolume, 1.0), 0.001)
    return finalVolume
  }

  /**
   * Fetch price from 0x API
   */
  private async fetchPrice(
    sellToken: Address,
    buyToken: Address,
    sellAmount: bigint,
    taker: Address
  ): Promise<any> {
    const params = {
      chainId: base.id.toString(),
      sellToken,
      buyToken,
      sellAmount: sellAmount.toString(),
      taker,
    }

    const url = this.buildApiUrl('price', params)

    const response = await fetch(url, { headers: this.getHeaders() })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`0x API price request failed: ${response.status} - ${errorText}`)
    }

    const priceData = await response.json()    
    return priceData
  }

  /**
   * Fetch quote from 0x API
   */
  private async fetchQuote(
    sellToken: Address,
    buyToken: Address,
    sellAmount: bigint,
    taker: Address
  ): Promise<any> {
    const params = {
      chainId: base.id.toString(),
      sellToken,
      buyToken,
      sellAmount: sellAmount.toString(),
      taker,
    }

    const url = this.buildApiUrl('quote', params)

    const response = await fetch(url, { headers: this.getHeaders() })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`0x API quote request failed: ${response.status} - ${errorText}`)
    }

    const quoteData = await response.json()
    
    return quoteData
  }

  /**
   * Simulate buying GM tokens with ETH using 0x API
   */
  async simulateBuyCoins(
    _tokenAddress: Address,
    ethAmount: string,
    _publicClient: PublicClient,
    taker?: Address
  ): Promise<GMTradeSimulation | null> {
    try {      
      const orderSize = parseEther(ethAmount)
      const takerAddress = taker || "0xe6e6C0ddF053822bbbC1F39218F30EA25FCA58dD" as Address

      // Fetch price from 0x API
      const priceData = await this.fetchPrice(
        ETH_ADDRESS, // Sell ETH
        GM_TOKEN_ADDRESS, // Buy GM tokens
        orderSize,
        takerAddress
      )

      if (!priceData || !priceData.buyAmount) {
        throw new Error("Invalid price response from 0x API")
      }

      const amountOut = BigInt(priceData.buyAmount)
      const minAmountOut = BigInt(priceData.minBuyAmount || priceData.buyAmount)
      const estimatedGas = priceData.gas ? BigInt(priceData.gas) : BigInt(300000)
      
      // Calculate price impact if available
      let priceImpact = 0
      if (priceData.route && priceData.route.fills) {
        // Extract price impact from route data if available
        priceImpact = 0.5 // Default 0.5% impact, could be calculated from route
      }

      return {
        orderSize,
        amountOut,
        minAmountOut,
        priceImpact,
        estimatedGas,
        method: 'exact',
        route: priceData.route,
        fees: priceData.fees
      }
    } catch (error) {
      console.error("❌ Error simulating buy with 0x API:", error)
      return null
    }
  }

  /**
   * Simulate selling GM tokens for ETH using 0x API
   */
  async simulateSellCoins(
    _tokenAddress: Address,
    tokenAmount: string,
    _publicClient: PublicClient,
    taker?: Address
  ): Promise<GMTradeSimulation | null> {
    try {
      const orderSize = parseEther(tokenAmount)
      const takerAddress = taker || "0xe6e6C0ddF053822bbbC1F39218F30EA25FCA58dD" as Address

      // Fetch price from 0x API
      const priceData = await this.fetchPrice(
        GM_TOKEN_ADDRESS, // Sell GM tokens
        ETH_ADDRESS, // Buy ETH
        orderSize,
        takerAddress
      )

      if (!priceData || !priceData.buyAmount) {
        throw new Error("Invalid price response from 0x API")
      }

      const amountOut = BigInt(priceData.buyAmount)
      const minAmountOut = BigInt(priceData.minBuyAmount || priceData.buyAmount)
      const estimatedGas = priceData.gas ? BigInt(priceData.gas) : BigInt(300000)

      return {
        orderSize,
        amountOut,
        minAmountOut,
        priceImpact: 2.5,
        estimatedGas,
        method: 'exact',
        route: priceData.route,
        fees: priceData.fees
      }
    } catch (error) {
        return null
    }
  }

  /**
   * Execute buy trade using 0x API - REAL TRANSACTION
   */
  async buyCoins(
    _tokenAddress: Address,
    ethAmount: string,
    recipient: Address,
    walletClient: WalletClient,
    publicClient: PublicClient,
    callbacks?: TransactionCallbacks
  ): Promise<GMTradeResult | null> {
    try {
      const orderSize = parseEther(ethAmount)
      
      // Notify preparation step
      callbacks?.onStepChange?.("preparing")
      try {
        await walletClient.switchChain({ id: base.id })
      } catch (switchError) {
        try {
          await walletClient.addChain({ chain: base })
          await walletClient.switchChain({ id: base.id })
        } catch (addError) {
          throw new Error(`🌐 Please manually switch your wallet to Base network (Chain ID: 8453)`)
        }
      }

      // Check balance
      const balance = await publicClient.getBalance({ address: recipient })
      if (balance < orderSize) {
        throw new Error(`Insufficient ETH balance. Required: ${formatEther(orderSize)} ETH, Available: ${formatEther(balance)} ETH`)
      }

      // Get quote from 0x API
      const quote = await this.fetchQuote(
        ETH_ADDRESS, // Sell ETH
        GM_TOKEN_ADDRESS, // Buy GM tokens
        orderSize,
        recipient
      )

      if (!quote || !quote.transaction) {
        throw new Error("Invalid quote response from 0x API")
      }

      // Notify signing step
      callbacks?.onStepChange?.("signing")

      const hash = await walletClient.sendTransaction({
        account: recipient,
        chain: base,
        to: quote.transaction.to as Address,
        data: quote.transaction.data as `0x${string}`,
        value: BigInt(quote.transaction.value || orderSize),
        gas: quote.transaction.gas ? BigInt(quote.transaction.gas) : undefined,
        gasPrice: quote.transaction.gasPrice ? BigInt(quote.transaction.gasPrice) : undefined,
      })

      // Notify broadcasting step
      callbacks?.onStepChange?.("broadcasting")

      // Wait for transaction confirmation
      callbacks?.onStepChange?.("confirming")
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1 
      })

      if (receipt.status !== 'success') {
        callbacks?.onStepChange?.("error")
        callbacks?.onError?.("Transaction failed on-chain")
        throw new Error("Transaction failed on-chain")
      }

      // Notify success
      callbacks?.onStepChange?.("success")
      callbacks?.onSuccess?.(hash)

      return {
        hash,
        trade: {
          direction: "buy",
          orderSize,
          amountOut: BigInt(quote.buyAmount),
          recipient
        }
      }
    } catch (error) {
      console.error("❌ Error executing buy trade with 0x API:", error)
      
      // Notify error
      callbacks?.onStepChange?.("error")
      
      let errorMessage = "Unknown error occurred"
      if (error instanceof Error) {
        errorMessage = error.message
        if (error.message.includes("insufficient funds")) {
          errorMessage = "💸 Insufficient ETH balance for this transaction"
        } else if (error.message.includes("user rejected") || error.message.includes("User rejected")) {
          errorMessage = "🚫 Transaction was rejected by user"
        } else if (error.message.includes("network")) {
          errorMessage = "🌐 Network error: Please check your connection and try again"
        }
      }
      
      callbacks?.onError?.(errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * Execute sell trade using 0x API - REAL TRANSACTION
   */
  async sellCoins(
    _tokenAddress: Address,
    tokenAmount: string,
    recipient: Address,
    walletClient: WalletClient,
    publicClient: PublicClient,
    callbacks?: TransactionCallbacks
  ): Promise<GMTradeResult | null> {
    try {
      const orderSize = parseEther(tokenAmount)
      
      // Notify preparation step
      callbacks?.onStepChange?.("preparing")

      // Check balance
      const tokenBalance = await this.getTokenBalance(GM_TOKEN_ADDRESS, recipient, publicClient)
      if (tokenBalance < orderSize) {
        throw new Error(`Insufficient GM token balance. Required: ${formatEther(orderSize)}, Available: ${formatEther(tokenBalance)}`)
      }

      // Get quote from 0x API
      const quote = await this.fetchQuote(
        GM_TOKEN_ADDRESS, // Sell GM tokens
        ETH_ADDRESS, // Buy ETH
        orderSize,
        recipient
      )

      if (!quote || !quote.transaction) {
        throw new Error("Invalid quote response from 0x API")
      }

      // Check and handle token allowance if needed
      if (quote.issues && quote.issues.allowance !== null) {
        callbacks?.onStepChange?.("approval")
        await this.approveToken(GM_TOKEN_ADDRESS, walletClient, recipient)
        
        // Wait a moment for approval to be confirmed
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      // Handle Permit2 signature if required
      let transactionData = quote.transaction.data
      if (quote.permit2?.eip712) {
        callbacks?.onStepChange?.("signing")
        const signature = await walletClient.signTypedData(quote.permit2.eip712)
        
        // Append signature to transaction data
        const signatureLengthHex = (signature.length / 2 - 1).toString(16).padStart(64, '0')
        transactionData = `${transactionData}${signatureLengthHex}${signature.slice(2)}`
      } else {
        callbacks?.onStepChange?.("signing")
      }

      const hash = await walletClient.sendTransaction({
        account: recipient,
        chain: base,
        to: quote.transaction.to as Address,
        data: transactionData as `0x${string}`,
        value: BigInt(quote.transaction.value || 0),
        gas: quote.transaction.gas ? BigInt(quote.transaction.gas) : undefined,
        gasPrice: quote.transaction.gasPrice ? BigInt(quote.transaction.gasPrice) : undefined,
      })

      // Notify broadcasting and confirming steps
      callbacks?.onStepChange?.("broadcasting")
      callbacks?.onStepChange?.("confirming")

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status !== 'success') {
        callbacks?.onStepChange?.("error")
        callbacks?.onError?.("Sell transaction failed")
        throw new Error("Sell transaction failed")
      }

      // Notify success
      callbacks?.onStepChange?.("success")
      callbacks?.onSuccess?.(hash)

      return {
        hash,
        trade: {
          direction: "sell",
          orderSize,
          amountOut: BigInt(quote.buyAmount),
          recipient
        }
      }
    } catch (error) {      
      // Notify error
      callbacks?.onStepChange?.("error")
      
      let errorMessage = "Unknown error occurred"
      if (error instanceof Error) {
        errorMessage = error.message
        if (error.message.includes("insufficient funds") || error.message.includes("Insufficient")) {
          errorMessage = "💸 Insufficient GM token balance for this transaction"
        } else if (error.message.includes("user rejected") || error.message.includes("User rejected")) {
          errorMessage = "🚫 Transaction was rejected by user"
        } else if (error.message.includes("network")) {
          errorMessage = "🌐 Network error: Please check your connection and try again"
        }
      }
      
      callbacks?.onError?.(errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * Check token balance
   */
  async getTokenBalance(
    tokenAddress: Address,
    ownerAddress: Address,
    publicClient: PublicClient
  ): Promise<bigint> {
    try {
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [ownerAddress],
      })
      return balance as bigint
    } catch (error) {
      return BigInt(0)
    }
  }

  /**
   * Approve token spending - for Permit2 compatibility
   */
  async approveToken(
    tokenAddress: Address,
    walletClient: WalletClient,
    ownerAddress: Address,
    spender?: Address,
    amount?: bigint
  ): Promise<string | null> {
    try {
      // Default to max allowance for Permit2 contract
      const approvalAmount = amount || maxUint256
      const spenderAddress = spender || "0x000000000022D473030F116dDEE9F6B43aC78BA3" as Address // Permit2 contract on Base
      
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, approvalAmount],
        chain: base,
        account: ownerAddress,
      })
      return hash
    } catch (error) {
      throw error
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: bigint, _decimals = 18): string {
    return formatEther(amount)
  }

  /**
   * Calculate price impact
   */
  calculatePriceImpact(expectedAmount: bigint, actualAmount: bigint): number {
    if (expectedAmount === BigInt(0)) return 0
    const impact = Number((expectedAmount - actualAmount) * BigInt(10000) / expectedAmount) / 100
    return Math.abs(impact)
  }

  /**
   * Get supported tokens info
   */
  getSupportedTokens() {
    return {
      GM_TOKEN: GM_TOKEN_ADDRESS,
      WETH: WETH_ADDRESS,
      ETH: ETH_ADDRESS,
      USDC: USDC_ADDRESS
    }
  }
}

// Export singleton instance
export const gmTokenTradingService0x = new GMTokenTradingService0x() 