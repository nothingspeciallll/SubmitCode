"use client"

import { useFarcasterContext } from "@/components/farcaster-provider"
import type { Context } from "@farcaster/frame-sdk"

export type FarcasterUser = {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
  location?: {
    placeId?: string
    description?: string
  }
}

export type FarcasterClient = {
  clientFid: number
  added: boolean
  safeAreaInsets?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  notificationDetails?: {
    url: string
    token: string
  }
}

export type FarcasterLocation = Context.LocationContext

// Hook to get the current Farcaster user from context
export function useFarcasterUser(): {
  user: FarcasterUser | null
  isLoading: boolean
  isInFarcaster: boolean
  error: string | null
} {
  const { context, isSDKReady, error, isInFarcaster } = useFarcasterContext()

  const user: FarcasterUser | null = context?.user ? {
    fid: context.user.fid,
    username: context.user.username,
    displayName: context.user.displayName,
    pfpUrl: context.user.pfpUrl,
    location: context.user.location ? {
      placeId: context.user.location.placeId,
      description: context.user.location.description,
    } : undefined,
  } : null

  return {
    user,
    isLoading: !isSDKReady,
    isInFarcaster,
    error,
  }
}

// Hook to get client information
export function useFarcasterClient(): {
  client: FarcasterClient | null
  isLoading: boolean
  isInFarcaster: boolean
} {
  const { context, isSDKReady, isInFarcaster } = useFarcasterContext()

  const client: FarcasterClient | null = context?.client ? {
    clientFid: context.client.clientFid,
    added: context.client.added,
    safeAreaInsets: context.client.safeAreaInsets,
    notificationDetails: context.client.notificationDetails,
  } : null

  return {
    client,
    isLoading: !isSDKReady,
    isInFarcaster,
  }
}

// Hook to get location context (where the app was launched from)
export function useFarcasterLocation(): {
  location: FarcasterLocation | null
  isLoading: boolean
  isInFarcaster: boolean
} {
  const { context, isSDKReady, isInFarcaster } = useFarcasterContext()

  return {
    location: context?.location || null,
    isLoading: !isSDKReady,
    isInFarcaster,
  }
}

// Main hook that provides all context data
export function useFarcaster() {
  const { context, isSDKReady, error, isInFarcaster } = useFarcasterContext()
  
  return {
    // User data
    user: context?.user ? {
      fid: context.user.fid,
      username: context.user.username,
      displayName: context.user.displayName,
      pfpUrl: context.user.pfpUrl,
      location: context.user.location,
    } : null,
    
    // Client data
    client: context?.client ? {
      clientFid: context.client.clientFid,
      added: context.client.added,
      safeAreaInsets: context.client.safeAreaInsets,
      notificationDetails: context.client.notificationDetails,
    } : null,
    
    // Location context
    location: context?.location || null,
    
    // Full context
    context,
    
    // State
    isLoading: !isSDKReady,
    isInFarcaster,
    error,
  }
} 