import { parseEther, type Address } from "viem"
import type { WalletClient, PublicClient } from "viem"
import { supabase } from "@/lib/supabase"

// Promotion payment configuration
const PROMOTION_CONFIG = {
  // Payment address
  paymentAddress: "0xb8f71C567758780bceb8501915E59734B8984435" as Address,
  // Fee amount in USD (will be converted based on currency)
  feeUSD: 4,
  // Supported currencies
  supportedCurrencies: {
    ETH: {
      address: null, // Native ETH
      decimals: 18,
      // Approximate USD price - in production, fetch from oracle
      usdPrice: 3000, // $3000 per ETH (approximate)
    },
    USDC: {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address, // USDC on Base
      decimals: 6,
      usdPrice: 1, // $1 per USDC
    },
  },
} as const

export type PromotionPayment = {
  currency: "ETH" | "USDC"
  amount: string
  transactionHash: string
}

export type PromotionData = {
  id?: number
  coin_id: number
  fid: number
  start_date?: string
  end_date?: string
  status?: string
  priority?: number
  created_at?: string
  updated_at?: string
  payment_hash?: string
  payment_currency?: string
  payment_amount?: string
}

// ERC20 ABI for USDC transfers
const ERC20_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
] as const

class PromotionService {
  // Calculate payment amount for specified currency
  calculatePaymentAmount(currency: "ETH" | "USDC"): bigint {
    const currencyConfig = PROMOTION_CONFIG.supportedCurrencies[currency]
    const amountInCurrency = PROMOTION_CONFIG.feeUSD / currencyConfig.usdPrice
    
    if (currency === "ETH") {
      // Convert to wei (18 decimals)
      return parseEther(amountInCurrency.toString())
    } else {
      // USDC has 6 decimals
      return BigInt(Math.floor(amountInCurrency * 10 ** currencyConfig.decimals))
    }
  }

  // Check user balance for specified currency
  async checkBalance(
    userAddress: Address,
    currency: "ETH" | "USDC",
    publicClient: PublicClient
  ): Promise<{ hasEnoughBalance: boolean; balance: bigint; required: bigint }> {
    const required = this.calculatePaymentAmount(currency)
    
    let balance: bigint
    
    if (currency === "ETH") {
      balance = await publicClient.getBalance({ address: userAddress })
    } else {
      // Get USDC balance
      const usdcAddress = PROMOTION_CONFIG.supportedCurrencies.USDC.address
      balance = await publicClient.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      }) as bigint
    }
    
    return {
      hasEnoughBalance: balance >= required,
      balance,
      required,
    }
  }

  // Execute payment transaction
  async executePayment(
    currency: "ETH" | "USDC",
    userAddress: Address,
    walletClient: WalletClient,
    publicClient: PublicClient
  ): Promise<{ transactionHash: string; amount: bigint }> {
    const amount = this.calculatePaymentAmount(currency)
    const paymentAddress = PROMOTION_CONFIG.paymentAddress
    
    let transactionHash: string
    
    if (currency === "ETH") {
      // Send ETH directly
      transactionHash = await walletClient.sendTransaction({
        to: paymentAddress,
        value: amount,
        account: userAddress,
        chain: null
      })
    } else {
      // Send USDC using ERC20 transfer
      const usdcAddress = PROMOTION_CONFIG.supportedCurrencies.USDC.address
      transactionHash = await walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [paymentAddress, amount],
        account: userAddress,
        chain: null
      })
    }
    
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: transactionHash as `0x${string}` 
    })
    
    if (receipt.status !== "success") {
      throw new Error("Payment transaction failed")
    }
    
    return {
      transactionHash,
      amount,
    }
  }

  // Create promotion record in Supabase after successful payment
  async createPromotion(promotionData: {
    coin_id: number
    fid: number
    payment_hash: string
    payment_currency: string
    payment_amount: string
  }): Promise<PromotionData> {
    try {
      const { data, error } = await supabase
        .from("promotions")
        .insert({
          coin_id: promotionData.coin_id,
          fid: promotionData.fid,
          payment_hash: promotionData.payment_hash,
          payment_currency: promotionData.payment_currency,
          payment_amount: promotionData.payment_amount,
          status: "active",
          priority: 0,
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase error creating promotion:", error)
        throw new Error(`Failed to create promotion: ${error.message}`)
      }
      return data
    } catch (error) {
      console.error("Error creating promotion:", error)
      throw error
    }
  }

  // Check if user already has a promotion for the coin
  async hasExistingPromotion(coinId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("id")
        .eq("coin_id", coinId)
        .eq("status", "active")
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      return !!data
    } catch (error) {
      console.error("Error checking existing promotion:", error)
      return false
    }
  }

  // Get promotion by coin ID
  async getPromotionByCoinId(coinId: number): Promise<PromotionData | null> {
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("coin_id", coinId)
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error getting promotion:", error)
      return null
    }
  }

  // Complete promotion process: payment + database record
  async promoteWithPayment(
    coinId: number,
    fid: number,
    currency: "ETH" | "USDC",
    userAddress: Address,
    walletClient: WalletClient,
    publicClient: PublicClient
  ): Promise<PromotionData> {
    // Step 1: Check if promotion already exists
    const existingPromotion = await this.hasExistingPromotion(coinId)
    if (existingPromotion) {
      throw new Error("This coin already has an active promotion")
    }

    // Step 2: Check balance
    const balanceCheck = await this.checkBalance(userAddress, currency, publicClient)
    if (!balanceCheck.hasEnoughBalance) {
      throw new Error(`Insufficient ${currency} balance. Required: ${balanceCheck.required.toString()}, Available: ${balanceCheck.balance.toString()}`)
    }

    // Step 3: Execute payment
    const paymentResult = await this.executePayment(currency, userAddress, walletClient, publicClient)

    // Step 4: Create promotion record in database
    try {
      const promotion = await this.createPromotion({
        coin_id: coinId,
        fid: fid,
        payment_hash: paymentResult.transactionHash,
        payment_currency: currency,
        payment_amount: paymentResult.amount.toString(),
      })

      return promotion
    } catch (dbError) {
      // If database insertion fails after successful payment, log the error
      // In production, you might want to implement a recovery mechanism
      console.error("Payment successful but database insertion failed:", {
        transactionHash: paymentResult.transactionHash,
        error: dbError,
      })
      throw new Error("Payment successful but failed to create promotion record. Please contact support with transaction hash: " + paymentResult.transactionHash)
    }
  }
}

export const promotionService = new PromotionService()
export { PROMOTION_CONFIG } 