import { getCoin, getCoins, setApiKey, createCoin, createCoinCall, DeployCurrency, validateMetadataURIContent, getCoinCreateFromLogs } from "@zoralabs/coins-sdk"
import { Address, createWalletClient, createPublicClient, http, Hex } from "viem"
import { base } from "viem/chains"
import { FARCOINS_PLATFORM_REFERRER, DEFAULT_CHAIN_ID, DEFAULT_GAS_MULTIPLIER } from "./constants"

// Set API key
setApiKey(process.env.ZORA_API_KEY!)

// - ETH: Available on all chains, recommended default
// - ZORA: Only available on Base mainnet, not supported on Base Sepolia
export { DeployCurrency }

export interface CreateZoraCoinParams {
  name: string
  symbol: string
  uri: string
  payoutRecipient: Address
  platformReferrer?: Address
  chainId?: number
  currency?: DeployCurrency
  owners?: Address[]
}

export interface ZoraCoinCreationResult {
  hash: string
  address: string
  deployment: {
    coin: Address
    factory: Address
    chainId: number
  }
}

export interface ZoraToken {
  address: string
  chainId: number
  name: string
  symbol: string
  creator: {
    address: string
    displayName?: string
    username?: string
    profileImage?: string
  }
  totalSupply: string
  decimals: number
  metadata: {
    description?: string
    image?: string
    animationUrl?: string
    externalUrl?: string
  }
  stats: {
    holders: number
    transactions: number
    sales: number
    volume: string
    floorPrice?: string
    marketCap: string
  }
  priceData?: {
    price?: string
    priceChange24h?: number
    priceChange7d?: number
    priceChange30d?: number
  }
  createdAt: string
  updatedAt: string
}

export interface ZoraComment {
  id: string
  content: string
  author: {
    address: string
    displayName?: string
    username?: string
    profileImage?: string
  }
  createdAt: string
}

class ZoraService {
  // Get a single coin by address
  async getTokenByAddress(address: string, chainId: number = DEFAULT_CHAIN_ID): Promise<ZoraToken | null> {
    try {
      // Normalize address to lowercase
      const normalizedAddress = address.toLowerCase()
      const response = await getCoin({
        address: normalizedAddress,
        chain: chainId,
      })

      // Log the full response for debugging
      console.log("=== Zora getCoin Response ===")
      console.log("Full response:", JSON.stringify(response, null, 2))

      if (!response || !response.data?.zora20Token) {
        console.log("No token data found in response")
        return null
      }

      const token = response.data.zora20Token

      // Log detailed coin information like in the example
      if (token) {
        console.log("=== Coin Details from Zora ===")
        console.log("- Name:", token.name)
        console.log("- Symbol:", token.symbol)
        console.log("- Description:", token.description)
        console.log("- Total Supply:", token.totalSupply)
        console.log("- Market Cap:", token.marketCap)
        console.log("- 24h Volume:", token.volume24h)
        console.log("- Market Cap Delta 24h:", token.marketCapDelta24h)
        console.log("- Total Volume:", token.totalVolume)
        console.log("- Creator Address:", token.creatorAddress)
        console.log("- Created At:", token.createdAt)
        console.log("- Unique Holders:", token.uniqueHolders)
        console.log("- Chain ID:", token.chainId)
        console.log("- Address:", token.address)
        
        // // Access media if available
        // if (token.mediaContent?.previewImage) {
        //   console.log("- Preview Image:", token.mediaContent.previewImage)
        // }
        // if (token.mediaContent?.originalUri) {
        //   console.log("- Original URI:", token.mediaContent.originalUri)
        // }
        
        // // Check creator profile
        // if (token.creatorProfile) {
        //   console.log("- Creator Profile:", token.creatorProfile)
        // }
        
        // console.log("- All token keys:", Object.keys(token))
        // console.log("====================")
      }

      // Check if token object is empty or lacks essential data
      if (!token.address && !token.name && Object.keys(token).length === 0) {
        console.log("Token object is empty or lacks essential data")
        return null
      }

      // Transform the response to our interface
      return {
        address: token.address,
        chainId: token.chainId,
        name: token.name,
        symbol: token.symbol,
        creator: {
          address: token.creatorAddress || '',
          displayName: token.creatorProfile?.handle || undefined,
          username: token.creatorProfile?.handle || undefined,
          profileImage: token.creatorProfile?.avatar?.previewImage?.medium || undefined,
        },
        totalSupply: token.totalSupply,
        decimals: 18, // Default for ERC-20 tokens, use 18 as standard
        metadata: {
          description: token.description,
          image: token.mediaContent?.originalUri || token.mediaContent?.previewImage?.medium || undefined,
          animationUrl: undefined, // Not available in single token response
          externalUrl: undefined, // Not available in single token response
        },
        stats: {
          holders: token.uniqueHolders || 0,
          transactions: 0, // Not available in single token response
          sales: 0, // Not available in single token response
          volume: token.totalVolume || '0',
          floorPrice: undefined, // Not available in single token response
          marketCap: token.marketCap || '0',
        },
        priceData: {
          price: undefined, // Not directly available in single token response
          priceChange24h: parseFloat(token.marketCapDelta24h || '0'),
          priceChange7d: undefined,
          priceChange30d: undefined,
        },
        createdAt: token.createdAt || '',
        updatedAt: token.createdAt || '', // Use createdAt as fallback since updatedAt not available
      }
    } catch (error) {
      console.error(`Error fetching token from Zora:`, error)
      return null
    }
  }

  // Get multiple coins by addresses
  async getTokensByAddresses(tokens: { collectionAddress: string; chainId: number }[]): Promise<ZoraToken[]> {
    try {
      // Normalize all addresses to lowercase
      const normalizedTokens = tokens.map(token => ({
        collectionAddress: token.collectionAddress.toLowerCase(),
        chainId: token.chainId
      }))

      const response = await getCoins({
        coins: normalizedTokens,
      })

      // // Log the full response for debugging
      // console.log("=== Zora getCoins Response ===")
      // console.log("Requested tokens:", normalizedTokens)
      // console.log("Full response:", JSON.stringify(response, null, 2))

      if (!response || !response.data?.zora20Tokens || response.data.zora20Tokens.length === 0) {
        console.warn("No tokens found in batch request")
        return []
      }

      // console.log(`Found ${response.data.zora20Tokens.length} tokens in batch response`)
      
      // // Log each token in the response
      // response.data.zora20Tokens.forEach((token: any, index: number) => {
      //   console.log(`=== Token ${index + 1} ===`)
      //   if (token) {
      //     console.log("- Address:", token.address)
      //     console.log("- Name:", token.name)
      //     console.log("- Symbol:", token.symbol)
      //     console.log("- Creator:", token.creator)
      //     console.log("- Stats:", token.stats)
      //     console.log("- Price Data:", token.priceData)
      //     console.log("- All keys:", Object.keys(token))
      //   } else {
      //     console.log("- Token is null/undefined")
      //   }
      // })

      // Transform the response to our interface, filtering out empty objects
      return response.data.zora20Tokens
        .filter((token: any) => token && token.address && token.name && Object.keys(token).length > 0)
        .map((token: any) => ({
          address: token.address,
          chainId: token.chainId,
          name: token.name,
          symbol: token.symbol,
          creator: {
            address: token.creator?.address || '',
            displayName: token.creator?.displayName || undefined,
            username: token.creator?.username || undefined,
            profileImage: token.creator?.profileImage || undefined,
          },
          totalSupply: token.totalSupply,
          decimals: token.decimals || 18,
          metadata: {
            description: token.metadata?.description,
            image: token.metadata?.image,
            animationUrl: token.metadata?.animationUrl,
            externalUrl: token.metadata?.externalUrl,
          },
          stats: {
            holders: token.stats?.holders || 0,
            transactions: token.stats?.transactions || 0,
            sales: token.stats?.sales || 0,
            volume: token.stats?.volume || '0',
            floorPrice: token.stats?.floorPrice || undefined,
            marketCap: token.stats?.marketCap || '0',
          },
          priceData: token.priceData
            ? {
                price: token.priceData.price,
                priceChange24h: token.priceData.priceChange24h,
                priceChange7d: token.priceData.priceChange7d,
                priceChange30d: token.priceData.priceChange30d,
              }
            : undefined,
          createdAt: token.createdAt || '',
          updatedAt: token.updatedAt || '',
        }))
    } catch (error) {
      console.error(`Error fetching tokens from Zora:`, error)
      return []
    }
  }

  // Combine Supabase and Zora data
  async enrichTokenWithZoraData(contractAddress: string, chainId: number = DEFAULT_CHAIN_ID) {
    try {
      const zoraData = await this.getTokenByAddress(contractAddress, chainId)
      return zoraData
    } catch (error) {
      console.error(`Error enriching token with Zora data:`, error)
      return null
    }
  }

  // Create a new coin on Zora
  async createCoin(
    params: CreateZoraCoinParams,
    walletClient: any,
    publicClient: any,
    options?: {
      gasMultiplier?: number
      account?: Address
    }
  ): Promise<ZoraCoinCreationResult> {
    try {
      // Create the coin using Zora SDK
      const result = await createCoin(
        {
          name: params.name,
          symbol: params.symbol,
          uri: params.uri,
          payoutRecipient: params.payoutRecipient,
          platformReferrer: params.platformReferrer || FARCOINS_PLATFORM_REFERRER,
          chainId: params.chainId || base.id,
          currency: params.currency || DeployCurrency.ETH,
          owners: params.owners || [params.payoutRecipient],
        },
        walletClient,
        publicClient,
        {
          gasMultiplier: options?.gasMultiplier || DEFAULT_GAS_MULTIPLIER,
          account: options?.account,
        }
      )
      return result
    } catch (error) {
      console.error('Error creating coin on Zora:', error)
      throw error
    }
  }

  // Get coin creation call parameters for use with WAGMI
  async getCoinCreationCall(params: CreateZoraCoinParams) {
    try {
      // Validate metadata URI content if provided
      if (params.uri) {
        try {
          // Type assertion to ensure URI is recognized as ValidMetadataURI
          const validUri = params.uri as `https://${string}` | `ipfs://${string}` | `ar://${string}` | `data:${string}`
          await validateMetadataURIContent(validUri)
        } catch (error) {
          console.warn('Metadata URI validation warning:', error)
        }
      }

      const contractCallParams = await createCoinCall({
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
        payoutRecipient: params.payoutRecipient,
        platformReferrer: params.platformReferrer || FARCOINS_PLATFORM_REFERRER,
        chainId: params.chainId || base.id,
        currency: params.currency || DeployCurrency.ETH,
        owners: params.owners || [params.payoutRecipient],
      })

      return contractCallParams
    } catch (error) {
      console.error('Error getting coin creation call parameters:', error)
      throw error
    }
  }

  // Helper function to create metadata JSON for IPFS upload
  createMetadataObject(params: {
    name: string
    description?: string
    image?: string
    external_url?: string
    animation_url?: string
    attributes?: Array<{
      trait_type: string
      value: string | number
    }>
  }) {
    const metadata: any = {
      name: params.name,
      description: params.description || '',
      attributes: params.attributes || [],
    }

    // Only include image if it's a valid URL
    if (params.image && params.image.startsWith('http')) {
      metadata.image = params.image
    }

    // Only include external_url if it's a valid URL
    if (params.external_url && params.external_url.startsWith('http')) {
      metadata.external_url = params.external_url
    }

    // Only include animation_url if it's a valid URL
    if (params.animation_url && params.animation_url.startsWith('http')) {
      metadata.animation_url = params.animation_url
    }

    return metadata
  }

  // Helper function to setup viem clients
  setupViemClients(rpcUrl: string, privateKey: string, chainConfig = base) {
    const publicClient = createPublicClient({
      chain: chainConfig,
      transport: http(rpcUrl),
    })

    const walletClient = createWalletClient({
      account: privateKey as Hex,
      chain: chainConfig,
      transport: http(rpcUrl),
    })

    return { publicClient, walletClient }
  }

  // Extract coin address from transaction receipt
  getCoinAddressFromReceipt(receipt: any) {
    try {
      const coinDeployment = getCoinCreateFromLogs(receipt)
      return coinDeployment
    } catch (error) {
      console.error('Error extracting coin address from receipt:', error)
      return null
    }
  }
}

export const zoraService = new ZoraService()
