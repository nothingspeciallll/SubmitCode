"use client"

import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address, parseUnits, maxUint256, erc20Abi } from 'viem'

const TOKEN_CLAIM_CONTRACT_ADDRESS = '0xf4ffed6a067c28df5ca40203694e5a144cd884c6' as Address

export function useTokenApproval(tokenAddress?: Address) {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && tokenAddress ? [address, TOKEN_CLAIM_CONTRACT_ADDRESS] : undefined,
    query: {
      enabled: !!(address && tokenAddress),
    },
  }) as { data: bigint | undefined, refetch: () => void }

  // Check if approval is needed for a specific amount
  const needsApproval = (amount: string, decimals: number = 18): boolean => {
    if (!allowance) return true
    try {
      const amountBigInt = parseUnits(amount, decimals)
      return allowance < amountBigInt
    } catch {
      return true
    }
  }

  // Approve token spending
  const approveToken = async (amount?: string, decimals: number = 18) => {
    if (!address || !tokenAddress) {
      return
    }

    try {
      // Use max approval for better UX (user won't need to approve again)
      const approvalAmount = amount ? parseUnits(amount, decimals) : maxUint256

      await writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [TOKEN_CLAIM_CONTRACT_ADDRESS, approvalAmount],
      })

    } catch (error) {
      console.error('Error approving token:', error)
    }
  }

  return {
    allowance,
    needsApproval,
    approveToken,
    isPending,
    isConfirming,
    isConfirmed,
    refetchAllowance,
  }
}