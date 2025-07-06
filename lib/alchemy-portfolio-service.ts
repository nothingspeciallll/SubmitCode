import { Alchemy, Network,TokenBalance } from "alchemy-sdk"
import { supabase } from "./supabase"

// Configure Alchemy for Base network
const settings = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!,
  network: Network.BASE_MAINNET, // Using Base network as specified
}

const alchemy = new Alchemy(settings)

export interface TokenWithBalance {
  contractAddress: string
  tokenBalance: string
  metadata: {
    name?: string
    symbol?: string
    decimals?: number
    logo?: string
  }
  // Supabase coin data if exists
  coinData?: {
    id: number
    name: string
    symbol: string
    creator_username: string
    creator_display_name?: string
    image_url?: string
    description?: string
    deployment_status: string
    contract_address: string
    created_at: string
  }
  formattedBalance?: string
  isInSupabase: boolean
}

export interface PortfolioData {
  tokens: TokenWithBalance[]
  totalTokens: number
  supabaseTokens: number
  lastUpdated: string
}

class AlchemyPortfolioService {
  private readonly CACHE_KEY_PREFIX = "portfolio_"
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  /**
   * Get cached portfolio data if available and not expired
   */
  private getCachedPortfolio(address: string): PortfolioData | null {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${address.toLowerCase()}`
      const cached = localStorage.getItem(cacheKey)
      
      if (!cached) return null
      
      const data = JSON.parse(cached)
      const now = Date.now()
      
      if (now - data.timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(cacheKey)
        return null
      }
      
      return data.portfolio
    } catch (error) {
      console.error("Error reading cache:", error)
      return null
    }
  }

  /**
   * Cache portfolio data
   */
  private setCachedPortfolio(address: string, portfolio: PortfolioData): void {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${address.toLowerCase()}`
      const cacheData = {
        portfolio,
        timestamp: Date.now()
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error setting cache:", error)
    }
  }

  /**
   * Get Supabase contract addresses (up to 200) for comparison
   */
  private async getSupabaseContractAddresses(): Promise<Set<string>> {
    try {
      const { data: coins, error } = await supabase
        .from('coins')
        .select('contract_address')
        .eq('deployment_status', 'success')
        .limit(200)

      if (error) {
        return new Set()
      }
      
      // Create set of normalized contract addresses
      const addressSet = new Set<string>()
      coins?.forEach(coin => {
        if (coin.contract_address) {
          const normalizedAddress = coin.contract_address.toLowerCase()
          addressSet.add(normalizedAddress)
        }
      })
      return addressSet
    } catch (error) {
      return new Set()
    }
  }

  /**
   * Get detailed Supabase coin data for matched addresses
   */
  private async getSupabaseCoinDetails(contractAddresses: string[]): Promise<Record<string, any>> {
    try {
      if (contractAddresses.length === 0) {
        return {}
      }

      const { data: coins, error } = await supabase
        .from('coins')
        .select('*')
        .in('contract_address', contractAddresses)
        .eq('deployment_status', 'success')

      if (error) {
        return {}
      }

      // Create lookup map by contract address
      const coinMap: Record<string, any> = {}
      coins?.forEach(coin => {
        if (coin.contract_address) {
          const normalizedAddress = coin.contract_address.toLowerCase()
          coinMap[normalizedAddress] = coin
        }
      })
      return coinMap
    } catch (error) {
      return {}
    }
  }

  /**
   * Format token balance for display
   */
  private formatTokenBalance(balance: string, decimals: number): string {
    try {
      const balanceNumber = parseInt(balance) / Math.pow(10, decimals)
      if (balanceNumber === 0) return "0"
      if (balanceNumber < 0.001) return "< 0.001"
      if (balanceNumber < 1) return balanceNumber.toFixed(6)
      if (balanceNumber < 1000) return balanceNumber.toFixed(2)
      if (balanceNumber < 1000000) return `${(balanceNumber / 1000).toFixed(1)}K`
      return `${(balanceNumber / 1000000).toFixed(1)}M`
    } catch (error) {
      return "0"
    }
  }

  /**
   * Filter tokens by name and symbol (hide tokens with domains or long names)
   */
  private shouldFilterToken(symbol: string | undefined): boolean {
    // Check symbol
    if (symbol) {
      const lowerSymbol = symbol.toLowerCase()
      // Filter out tokens with domain extensions in symbol
      const symbolHasDomain = ['.xyz', '.com', '.io', '.org', '.net', '.co'].some(domain => 
        lowerSymbol.includes(domain)
      )      
      // Filter out tokens with symbols longer than 10 characters
      const symbolIsTooLong = symbol.length > 10
      if (symbolHasDomain || symbolIsTooLong) return true
    }
    return false
  }

  /**
   * Batch fetch token metadata using Alchemy batch API
   */
  private async batchFetchTokenMetadata(contractAddresses: string[]): Promise<Record<string, any>> {
    const metadataMap: Record<string, any> = {}
    try {
      // Process in batches of 10 to avoid rate limits
      const batchSize = 10
      const batches = []
      for (let i = 0; i < contractAddresses.length; i += batchSize) {
        batches.push(contractAddresses.slice(i, i + batchSize))
      }      
      // Process batches with delay between them
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        
        const batchPromises = batch.map(async (address) => {
          try {
            const metadata = await alchemy.core.getTokenMetadata(address)
            return { address, metadata }
          } catch (error) {
            return { 
              address, 
              metadata: {
                name: "Unknown Token",
                symbol: "UNKNOWN",
                decimals: 18
              }
            }
          }
        })
        const batchResults = await Promise.allSettled(batchPromises)
        
        // Process batch results
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            metadataMap[result.value.address] = result.value.metadata
          }
        })
        
        // Add delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
        }
      }
      return metadataMap
    } catch (error) {
      return metadataMap
    }
  }

  /**
   * Get user's token portfolio from Alchemy
   */
  async getUserPortfolio(address: string, forceRefresh = false): Promise<PortfolioData> {
    try {
      if (!forceRefresh) {
        const cached = this.getCachedPortfolio(address)
        if (cached) {
          return cached
        }
      }

      // Get token balances from Alchemy
      const balances = await alchemy.core.getTokenBalances(address)
      
      if (!balances?.tokenBalances) {
        throw new Error("No token balances returned from Alchemy")
      }
      // Filter out zero balances and get non-null contract addresses
      const nonZeroBalances = balances.tokenBalances.filter((token: TokenBalance) => 
        token.contractAddress && 
        token.tokenBalance && 
        token.tokenBalance !== "0" &&
        token.tokenBalance !== "0x0"
      )

      // Get Supabase contract addresses for comparison (up to 200)
      const supabaseAddresses = await this.getSupabaseContractAddresses()

      // Extract contract addresses for batch metadata fetch
      const contractAddresses = nonZeroBalances.map(token => token.contractAddress!)
      
      // Find matching addresses with Supabase
      const matchedAddresses = contractAddresses.filter(addr => 
        supabaseAddresses.has(addr.toLowerCase())
      )
      
      // Fetch detailed Supabase data for matched addresses only
      const supabaseCoins = await this.getSupabaseCoinDetails(matchedAddresses)
      
      // Batch fetch all token metadata
      const metadataMap = await this.batchFetchTokenMetadata(contractAddresses)

      // Process tokens with metadata
      const tokensWithMetadata = nonZeroBalances.map((token: TokenBalance): TokenWithBalance | null => {
        try {
          const contractAddress = token.contractAddress!
          const metadata = metadataMap[contractAddress] || {
            name: "Unknown Token",
            symbol: "UNKNOWN",
            decimals: 18
          }
          
          // Filter out tokens with domains, long names, or unknown symbol
          if (this.shouldFilterToken(metadata.symbol) || metadata.symbol === 'UNKNOWN') {
            return null
          }
          
          // Check if token exists in Supabase
          const normalizedContractAddr = contractAddress.toLowerCase()
          const coinData = supabaseCoins[normalizedContractAddr]
          const isInSupabase = !!coinData

          // Format balance
          const decimals = metadata.decimals || 18
          const formattedBalance = this.formatTokenBalance(token.tokenBalance || "0", decimals)

          return {
            contractAddress,
            tokenBalance: token.tokenBalance || "0",
            metadata: {
              name: metadata.name || "Unknown Token",
              symbol: metadata.symbol || "UNKNOWN",
              decimals: metadata.decimals || 18,
              logo: metadata.logo || undefined
            },
            coinData,
            formattedBalance,
            isInSupabase
          }
        } catch (error) {
          return null
        }
      }).filter((token): token is TokenWithBalance => token !== null)

      // Sort tokens
      const tokens = tokensWithMetadata.sort((a: TokenWithBalance, b: TokenWithBalance) => {
        // Prioritize Supabase tokens
        if (a.isInSupabase && !b.isInSupabase) return -1
        if (!a.isInSupabase && b.isInSupabase) return 1
        
        // Then sort by balance (highest first)
        const balanceA = parseInt(a.tokenBalance)
        const balanceB = parseInt(b.tokenBalance)
        return balanceB - balanceA
      })

      const portfolio: PortfolioData = {
        tokens,
        totalTokens: tokens.length,
        supabaseTokens: tokens.filter((t: TokenWithBalance) => t.isInSupabase).length,
        lastUpdated: new Date().toISOString()
      }

      // Cache the result
      this.setCachedPortfolio(address, portfolio)
      return portfolio

    } catch (error) {
      throw new Error(`Failed to fetch portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Clear cache for a specific address
   */
  clearCache(address?: string): void {
    try {
      if (address) {
        const cacheKey = `${this.CACHE_KEY_PREFIX}${address.toLowerCase()}`
        localStorage.removeItem(cacheKey)
      } else {
        // Clear all portfolio caches
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith(this.CACHE_KEY_PREFIX)) {
            localStorage.removeItem(key)
          }
        })
      }
    } catch (error) {
    }
  }

  /**
   * Get token details by contract address
   */
  async getTokenDetails(contractAddress: string) {
    try {
      const metadata = await alchemy.core.getTokenMetadata(contractAddress)
      return metadata
    } catch (error) {
      throw error
    }
  }
}

export const alchemyPortfolioService = new AlchemyPortfolioService() 