import { Address } from 'viem'

const ALCHEMY_API_URL = process.env.NEXT_PUBLIC_ALCHEMY_API_URL!

export interface AlchemyTokenBalance {
  contractAddress: string
  tokenBalance: string
  error?: string
}

export interface AlchemyTokenBalancesResponse {
  address: string
  tokenBalances: AlchemyTokenBalance[]
}

export class AlchemyService {
  private static async makeRequest(method: string, params: any[]) {
    try {
      const response = await fetch(ALCHEMY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method,
          params,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message || 'Alchemy API error')
      }

      return data.result
    } catch (error) {
      console.error('Alchemy API request failed:', error)
      throw error
    }
  }

  static async getTokenBalance(walletAddress: Address, tokenAddress: Address): Promise<bigint> {
    try {
      const result = await this.makeRequest('alchemy_getTokenBalances', [
        walletAddress,
        [tokenAddress]
      ])

      if (!result || !result.tokenBalances || result.tokenBalances.length === 0) {
        return BigInt(0)
      }

      const tokenBalance = result.tokenBalances[0]
      
      if (tokenBalance.error) {
        console.error('Token balance error:', tokenBalance.error)
        return BigInt(0)
      }

      // Convert hex string to bigint
      const balance = tokenBalance.tokenBalance
      if (!balance || balance === '0x') {
        return BigInt(0)
      }

      return BigInt(balance)
    } catch (error) {
      console.error('Failed to get token balance from Alchemy:', error)
      return BigInt(0) // Return 0 instead of throwing error
    }
  }

  static async getTokenBalances(walletAddress: Address, tokenAddresses: Address[]): Promise<Record<string, bigint>> {
    try {
      const result = await this.makeRequest('alchemy_getTokenBalances', [
        walletAddress,
        tokenAddresses
      ])

      const balances: Record<string, bigint> = {}

      if (!result || !result.tokenBalances) {
        return balances
      }

      result.tokenBalances.forEach((tokenBalance: AlchemyTokenBalance, index: number) => {
        const tokenAddress = tokenAddresses[index]
        
        if (tokenBalance.error) {
          console.error(`Token balance error for ${tokenAddress}:`, tokenBalance.error)
          balances[tokenAddress] = BigInt(0)
          return
        }

        const balance = tokenBalance.tokenBalance
        if (!balance || balance === '0x') {
          balances[tokenAddress] = BigInt(0)
        } else {
          balances[tokenAddress] = BigInt(balance)
        }
      })

      return balances
    } catch (error) {
      console.error('Failed to get token balances from Alchemy:', error)
      return {}
    }
  }

  static async getEthBalance(walletAddress: Address): Promise<bigint> {
    try {
      const result = await this.makeRequest('eth_getBalance', [
        walletAddress,
        'latest'
      ])

      if (!result || result === '0x') {
        return BigInt(0)
      }

      return BigInt(result)
    } catch (error) {
      console.error('Failed to get ETH balance from Alchemy:', error)
      return BigInt(0)
    }
  }
} 