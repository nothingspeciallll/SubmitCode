import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import { alchemyPortfolioService, type PortfolioData } from "@/lib/alchemy-portfolio-service"

export function usePortfolio(forceRefresh = false) {
  const { address, isConnected } = useAccount()

  const {
    data: portfolio,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['portfolio', address, forceRefresh],
    queryFn: async (): Promise<PortfolioData> => {
      if (!address) {
        throw new Error("No wallet address available")
      }
      return alchemyPortfolioService.getUserPortfolio(address, forceRefresh)
    },
    enabled: !!address && isConnected,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const clearCache = () => {
    if (address) {
      alchemyPortfolioService.clearCache(address)
      refetch()
    }
  }

  const refreshPortfolio = () => {
    refetch()
  }

  return {
    portfolio,
    isLoading,
    error,
    isConnected,
    address,
    clearCache,
    refreshPortfolio
  }
} 