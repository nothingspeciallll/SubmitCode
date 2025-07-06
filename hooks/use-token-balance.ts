"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { type Address } from "viem"
import { AlchemyService } from "@/lib/alchemy-service"

export function useTokenBalance(tokenAddress?: Address) {
  const { address } = useAccount()
  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const fetchBalance = async () => {
    if (!address || !tokenAddress) {
      setBalance(BigInt(0))
      setIsError(false)
      return
    }

    setIsLoading(true)
    setIsError(false)
    
    try {
      const tokenBalance = await AlchemyService.getTokenBalance(address, tokenAddress)
      setBalance(tokenBalance)
    } catch (error) {
      console.error('Error fetching token balance:', error)
      setIsError(true)
      setBalance(BigInt(0)) // Set to 0 but don't fail completely
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = () => {
    fetchBalance()
  }

  useEffect(() => {
    fetchBalance()
  }, [address, tokenAddress])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!address || !tokenAddress) return

    const interval = setInterval(() => {
      fetchBalance()
    }, 30000)

    return () => clearInterval(interval)
  }, [address, tokenAddress])

  return {
    balance,
    isError,
    isLoading,
    refetch,
  }
}
