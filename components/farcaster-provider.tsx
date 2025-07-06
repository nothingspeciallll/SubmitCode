"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { sdk } from "@farcaster/frame-sdk"
import type { Context } from "@farcaster/frame-sdk"

type FarcasterSDK = {
  context: Context.FrameContext
  wallet: {
    getEthereumProvider: () => any
  }
  actions: any
}

type FarcasterContextType = {
  isSDKReady: boolean
  sdk: FarcasterSDK | null
  context: Context.FrameContext | null
  error: string | null
  isInFarcaster: boolean
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKReady: false,
  sdk: null,
  context: null,
  error: null,
  isInFarcaster: false,
})

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isSDKReady, setIsSDKReady] = useState(false)
  const [sdkInstance, setSdkInstance] = useState<FarcasterSDK | null>(null)
  const [context, setContext] = useState<Context.FrameContext | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isInFarcaster, setIsInFarcaster] = useState(false)

  useEffect(() => {
    async function initializeSDK() {
      try {
        
        // Get context from SDK
        const sdkContext = await sdk.context

        if (sdkContext && sdkContext.user && sdkContext.user.fid) {
          // Real Farcaster context
          setContext(sdkContext)
          setIsInFarcaster(true)
        } else {
          setIsInFarcaster(false)
        }

        // Set SDK instance with context
        const sdkWithContext: FarcasterSDK = {
          context: sdkContext,
          wallet: {
            getEthereumProvider: () => sdk.wallet?.getEthereumProvider?.(),
          },
          actions: sdk.actions,
        }

        setSdkInstance(sdkWithContext)
        setIsSDKReady(true)
        // Notify SDK that app is ready
        sdk.actions.ready()

      } catch (err) {
        setIsInFarcaster(false)
        setError(err instanceof Error ? err.message : "Unknown error")
        setIsSDKReady(false)
      }
    }

    initializeSDK()
  }, [])

  return (
    <FarcasterContext.Provider value={{ 
      isSDKReady, 
      sdk: sdkInstance, 
      context, 
      error, 
      isInFarcaster 
    }}>
      {children}
    </FarcasterContext.Provider>
  )
}

export function useFarcasterContext() {
  return useContext(FarcasterContext)
}

export function useFarcasterSDK() {
  const { sdk, isSDKReady, error } = useContext(FarcasterContext)
  
  return {
    sdk,
    isReady: isSDKReady,
    error,
    getEthereumProvider: () => sdk?.wallet?.getEthereumProvider?.(),
  }
}
