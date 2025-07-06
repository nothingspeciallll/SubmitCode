"use client"

import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, Address } from 'viem'

const TOKEN_CLAIM_CONTRACT_ADDRESS = '0xf4ffed6a067c28df5ca40203694e5a144cd884c6' as Address

const TOKEN_CLAIM_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      }
    ],
    "name": "claimToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "depositToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getNextClaimTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      }
    ],
    "name": "getPoolInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalPool",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TokenClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "depositor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TokenDeposited",
    "type": "event"
  }
] as const

export interface PoolInfo {
  totalPool: bigint
  tokenAddress: Address
}

export function useTokenClaimContract() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Claim token function
  const claimToken = async (tokenAddress: Address) => {
    if (!address) {
      return
    }

    try {
      await writeContract({
        address: TOKEN_CLAIM_CONTRACT_ADDRESS,
        abi: TOKEN_CLAIM_ABI,
        functionName: 'claimToken',
        args: [tokenAddress],
      })
    } catch (error) {
      console.error('Error claiming token:', error)
    }
  }

  // Deposit token function
  const depositToken = async (tokenAddress: Address, amount: string, decimals: number = 18) => {
    if (!address) {
      return
    }

    try {
      const amountBigInt = parseUnits(amount, decimals)
      await writeContract({
        address: TOKEN_CLAIM_CONTRACT_ADDRESS,
        abi: TOKEN_CLAIM_ABI,
        functionName: 'depositToken',
        args: [tokenAddress, amountBigInt],
      })
    } catch (error) {
      console.error('Error depositing token:', error)
    }
  }

  return {
    claimToken,
    depositToken,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  }
}

// Hook to get pool information
export function usePoolInfo(tokenAddress?: Address) {
  const { data: poolInfo, isLoading, refetch } = useReadContract({
    address: TOKEN_CLAIM_CONTRACT_ADDRESS,
    abi: TOKEN_CLAIM_ABI,
    functionName: 'getPoolInfo',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  }) as { data: [bigint, Address] | undefined, isLoading: boolean, refetch: () => void }

  const formattedPoolInfo: PoolInfo | null = poolInfo ? {
    totalPool: poolInfo[0],
    tokenAddress: poolInfo[1]
  } : null

  return {
    poolInfo: formattedPoolInfo,
    isLoading,
    refetch,
  }
}

// Hook to check when user can claim next
export function useNextClaimTime(tokenAddress?: Address) {
  const { address } = useAccount()
  
  const { data: nextClaimTime, isLoading, refetch } = useReadContract({
    address: TOKEN_CLAIM_CONTRACT_ADDRESS,
    abi: TOKEN_CLAIM_ABI,
    functionName: 'getNextClaimTime',
    args: tokenAddress && address ? [tokenAddress, address] : undefined,
    query: {
      enabled: !!(tokenAddress && address),
      refetchInterval: 60000, // Refetch every minute
    },
  }) as { data: bigint | undefined, isLoading: boolean, refetch: () => void }

  const canClaim = nextClaimTime ? Number(nextClaimTime) <= Math.floor(Date.now() / 1000) : false
  const nextClaimDate = nextClaimTime ? new Date(Number(nextClaimTime) * 1000) : null

  return {
    nextClaimTime: nextClaimDate,
    canClaim,
    isLoading,
    refetch,
  }
} 