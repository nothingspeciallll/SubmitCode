"use client"

import { useState, useEffect, useRef } from "react"
import { createPublicClient, http } from "viem"
import { base } from "viem/chains"
import { getOnchainCoinDetails } from "@zoralabs/coins-sdk"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"

interface PriceChartProps {
  tokenAddress?: string
}

export function PriceChart({ tokenAddress }: PriceChartProps) {
  const [poolAddress, setPoolAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    let isMounted = true
    isUnmountedRef.current = false

    async function fetchPoolAddress() {
      if (!tokenAddress) {
        if (isMounted && !isUnmountedRef.current) {
          setLoading(false)
        }
        return
      }

      try {
        if (isMounted && !isUnmountedRef.current) {
          setLoading(true)
        }
        
        // Set up viem public client for Base network
        const publicClient = createPublicClient({
          chain: base,
          transport: http("https://mainnet.base.org"),
        })
        
        // Get onchain coin details including pool address
        const details = await getOnchainCoinDetails({
          coin: tokenAddress as `0x${string}`,
          publicClient,
        })
        if (details.pool && isMounted && !isUnmountedRef.current) {
          setPoolAddress(details.pool)
        } 
      } catch (err) {
        console.error("Error fetching pool address:", err)
      } finally {
        if (isMounted && !isUnmountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchPoolAddress()

    return () => {
      isMounted = false
      isUnmountedRef.current = true
    }
  }, [tokenAddress])

  // Cleanup iframe on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
      
      // Force cleanup iframe
      if (iframeRef.current) {
        try {
          // Remove src to stop any ongoing loading
          iframeRef.current.src = 'about:blank'
          
          // Remove from DOM if still attached
          if (iframeRef.current.parentNode) {
            iframeRef.current.parentNode.removeChild(iframeRef.current)
          }
        } catch (error) {
          console.warn('Error cleaning up iframe:', error)
        } finally {
          iframeRef.current = null
        }
      }
    }
  }, [])

  // Handle iframe load errors
  const handleIframeError = () => {
    console.warn('Chart iframe failed to load')
  }

  if (loading) {
    return (
      <div 
        ref={containerRef}
        className={`relative bg-[#131722] text-white ${getMetalClassName('pearl', 'static', 'rounded-lg shadow-md')}`}
        style={{ height: "400px", ...getMetalStyle('pearl') }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading chart...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!poolAddress) {
    return (
      <div 
        ref={containerRef}
        className={`relative ${getMetalClassName('pearl', 'static', 'rounded-lg shadow-md')}`}
        style={{ height: "400px", ...getMetalStyle('pearl') }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-400">No chart data available</p>
          </div>
        </div>
      </div>
    )
  }

  // GeckoTerminal embed URL with the pool address
  const embedUrl = `https://www.geckoterminal.com/base/pools/${poolAddress}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0&chart_type=price&resolution=15m`
  return (
    <div 
      ref={containerRef}
      className={`relative ${getMetalClassName('pearl', 'static', 'rounded-lg shadow-md')}`}
      style={{ height: "400px", ...getMetalStyle('pearl') }}
    >
      {!isUnmountedRef.current && (
        <iframe
          ref={iframeRef}
          height="100%"
          width="100%"
          src={embedUrl}
          title="GeckoTerminal Chart"
          frameBorder="0"
          allow="clipboard-write"
          allowFullScreen
          className="rounded-lg"
          onError={handleIframeError}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      )}
    </div>
  )
}
