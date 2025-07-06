"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { neynarService, type NeynarUser } from "@/lib/neynar"
import { useFarcasterContext } from "@/components/farcaster-provider"

// Cache refresh interval (10 days in milliseconds)
const NEYNAR_CACHE_DURATION = 10 * 24 * 60 * 60 * 1000 // 10 days


export type FarcasterUser = {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
  custodyAddress?: string
  bio?: string
  followerCount?: number
  followingCount?: number
  powerBadge?: boolean
  neynarScore?: number
  verifiedAddresses?: any
  verifiedAccounts?: any
  location?: {
    city?: string
    state?: string
    country?: string
  }
  lastNeynarSync?: string
}

// Utility functions for data conversion
function safeParseInt(value: any, defaultValue = 0): number {
  if (value === null || value === undefined) return defaultValue
  if (typeof value === "number") return Math.floor(value)
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return isNaN(parsed) ? defaultValue : Math.floor(parsed)
  }
  return defaultValue
}

function safeParseString(value: any): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === "string") return value.trim() || undefined
  return String(value).trim() || undefined
}

function safeParseBoolean(value: any): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "string") return value.toLowerCase() === "true"
  return Boolean(value)
}

// Validation function to ensure user data is valid
function validateUserData(userData: any): userData is FarcasterUser {
  return (
    userData &&
    typeof userData === "object" &&
    typeof userData.fid === "number" &&
    userData.fid > 0 &&
    (userData.username === undefined || typeof userData.username === "string") &&
    (userData.displayName === undefined || typeof userData.displayName === "string") &&
    (userData.pfpUrl === undefined || typeof userData.pfpUrl === "string")
  )
}

function mapNeynarUserToFarcasterUser(neynarUser: NeynarUser): FarcasterUser {
  return {
    fid: safeParseInt(neynarUser.fid),
    username: safeParseString(neynarUser.username),
    displayName: safeParseString(neynarUser.display_name),
    pfpUrl: safeParseString(neynarUser.pfp_url),
    custodyAddress: safeParseString(neynarUser.custody_address),
    bio: safeParseString(neynarUser.profile?.bio?.text),
    followerCount: safeParseInt(neynarUser.follower_count),
    followingCount: safeParseInt(neynarUser.following_count),
    powerBadge: safeParseBoolean(neynarUser.power_badge),
    neynarScore: safeParseInt(neynarUser.experimental?.neynar_user_score),
    verifiedAddresses: neynarUser.verified_addresses,
    verifiedAccounts: neynarUser.verified_accounts,
    location: {
      city: safeParseString(neynarUser.profile?.location?.address?.city),
      state: safeParseString(neynarUser.profile?.location?.address?.state),
      country: safeParseString(neynarUser.profile?.location?.address?.country),
    },
  }
}

function mapSupabaseUserToFarcasterUser(dbUser: any): FarcasterUser {
  return {
    fid: dbUser.fid,
    username: dbUser.username,
    displayName: dbUser.display_name,
    pfpUrl: dbUser.pfp_url,
    custodyAddress: dbUser.custody_address,
    bio: dbUser.bio,
    followerCount: dbUser.follower_count,
    followingCount: dbUser.following_count,
    powerBadge: dbUser.power_badge,
    neynarScore: dbUser.neynar_score,
    verifiedAddresses: dbUser.verified_addresses ? JSON.parse(dbUser.verified_addresses) : null,
    verifiedAccounts: dbUser.verified_accounts ? JSON.parse(dbUser.verified_accounts) : null,
    location: {
      city: dbUser.location_city,
      state: dbUser.location_state,
      country: dbUser.location_country,
    },
    lastNeynarSync: dbUser.last_neynar_sync,
  }
}

export function useFarcaster() {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Use context from FarcasterProvider
  const { context, isSDKReady, isInFarcaster } = useFarcasterContext()
  
  // Refs to prevent duplicate calls and track state
  const initializationRef = useRef<boolean>(false)
  const currentFidRef = useRef<number | null>(null)
  const lastLoggedFidRef = useRef<number | null>(null)

  // Check if user data needs refresh from Neynar
  const needsNeynarRefresh = (lastSync: string | null | undefined): boolean => {
    if (!lastSync) return true // No sync date means we need to fetch

    const lastSyncDate = new Date(lastSync)
    const now = new Date()
    const timeDiff = now.getTime() - lastSyncDate.getTime()

    return timeDiff > NEYNAR_CACHE_DURATION
  }

  // Get user from Supabase database with reduced logging - only when valid context exists
  const getUserFromDatabase = async (fid: number): Promise<FarcasterUser | null> => {
    // Check if we have a valid context before database call
    if (!context?.user || !fid || fid <= 0) {
      return null
    }
    
    try {
      // Only log if FID has changed to reduce spam
      if (currentFidRef.current !== fid) {
        currentFidRef.current = fid
      }

      const { data, error } = await supabase.from("users").select("*").eq("fid", fid).single()

      if (error) {
        if (error.code === "PGRST116") {
          // Only log if this is a different FID
          if (lastLoggedFidRef.current !== fid) {
            lastLoggedFidRef.current = fid
          }
          return null
        }
        throw error
      }

      if (data) {
        // Only log if this is a new user or significant change
        if (!user || user.fid !== data.fid || lastLoggedFidRef.current !== fid) {
          lastLoggedFidRef.current = fid
        }
        return mapSupabaseUserToFarcasterUser(data)
      }

      return null
    } catch (error) {
      return null
    }
  }

  // Get user data with smart caching - only when valid context exists
  const getUserData = async (fid: number): Promise<FarcasterUser | null> => {
    // Validate that we have a valid FID
    if (!fid || fid <= 0 || !context?.user) {
      return null
    }
    
    try {
      // First, check if user exists in database
      const dbUser = await getUserFromDatabase(fid)

      if (dbUser) {
        // User exists in database, check if we need to refresh from Neynar
        if (needsNeynarRefresh(dbUser.lastNeynarSync)) {
          // Fetch fresh data from Neynar
          const neynarUser = await neynarService.getUserByFid(fid)

          if (neynarUser) {
            const updatedUser = mapNeynarUserToFarcasterUser(neynarUser)

            // Update database with fresh data
            await upsertUserToSupabase(updatedUser)
            return updatedUser
          } else {
            return dbUser
          }
        } else {
          return dbUser
        }
      } else {
        // User doesn't exist in database, fetch from Neynar

        const neynarUser = await neynarService.getUserByFid(fid)

        if (neynarUser) {
          const newUser = mapNeynarUserToFarcasterUser(neynarUser)

          // Save to database
          await upsertUserToSupabase(newUser)
          return newUser
        } else {
          return null
        }
      }
    } catch (error) {
      return null
    }
  }

  useEffect(() => {
    async function initializeFarcaster() {
      try {
        // Prevent duplicate initialization
        if (initializationRef.current) {
          return
        }

        // Wait for SDK to be ready
        if (!isSDKReady) {
          return
        }

        initializationRef.current = true

        // Only proceed if we have valid Farcaster context
        if (context?.user && context.user.fid && context.user.fid > 0) {
          
          // Get user data with smart caching using the REAL FID
          const userData = await getUserData(context.user.fid)

          if (userData) {
            setUser(userData)
          } else {
            // Fallback to context data if database/Neynar fails
            const farcasterUser: FarcasterUser = {
              fid: context.user.fid, // Use real FID from context
              username: safeParseString(context.user.username),
              displayName: safeParseString(context.user.displayName),
              pfpUrl: safeParseString(context.user.pfpUrl),
            }
            setUser(farcasterUser)
            await upsertUserToSupabase(farcasterUser)
          }
        } else {
          // No valid Farcaster context, just set user to null
          setUser(null)
          setError("No Farcaster context available")
        }
      } catch (err) {
        setUser(null)
        setError("Error initializing Farcaster")
      } finally {
        setIsLoading(false)
        initializationRef.current = false
      }
    }

    initializeFarcaster()
  }, [context, isSDKReady, isInFarcaster]) // React to context changes

  const upsertUserToSupabase = async (userData: FarcasterUser) => {
    // Validate data and context before attempting database operation
    if (!validateUserData(userData) || !context?.user) {
      setError("Invalid user data or no Farcaster context")
      return
    }

    try {
      
      // Prepare data with proper type conversion
      const dbData = {
        fid: safeParseInt(userData.fid),
        username: userData.username || null,
        display_name: userData.displayName || null,
        pfp_url: userData.pfpUrl || null,
        custody_address: userData.custodyAddress || null,
        bio: userData.bio || null,
        location_city: userData.location?.city || null,
        location_state: userData.location?.state || null,
        location_country: userData.location?.country || null,
        follower_count: safeParseInt(userData.followerCount, 0),
        following_count: safeParseInt(userData.followingCount, 0),
        verifications: userData.verifiedAddresses ? JSON.stringify(userData.verifiedAddresses) : null,
        verified_addresses: userData.verifiedAddresses ? JSON.stringify(userData.verifiedAddresses) : null,
        verified_accounts: userData.verifiedAccounts ? JSON.stringify(userData.verifiedAccounts) : null,
        power_badge: safeParseBoolean(userData.powerBadge),
        neynar_score: safeParseInt(userData.neynarScore, 0),
        last_neynar_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Validate that integer fields are actually integers
      if (!Number.isInteger(dbData.fid) || dbData.fid <= 0) {
        throw new Error(`Invalid FID: ${dbData.fid}`)
      }
      if (!Number.isInteger(dbData.follower_count)) {
        throw new Error(`Invalid follower_count: ${dbData.follower_count}`)
      }
      if (!Number.isInteger(dbData.following_count)) {
        throw new Error(`Invalid following_count: ${dbData.following_count}`)
      }
      if (!Number.isInteger(dbData.neynar_score)) {
        throw new Error(`Invalid neynar_score: ${dbData.neynar_score}`)
      }
      const { data, error } = await supabase.from("users").upsert(dbData, {
        onConflict: "fid",
      })
      if (error) {
        setError(error.message)
      } 
    } catch (err) {
      setError("Failed to save user data")
    }
  }

  const updateTokenAddress = async (tokenAddr: string) => {
    if (!user || !validateUserData(user)) {
      return
    }

    if (!tokenAddr || typeof tokenAddr !== "string") {
      return
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({
          token_addr: tokenAddr || null,
          updated_at: new Date().toISOString(),
        })
        .eq("fid", user.fid)

      if (error) {
        throw error
      }
    } catch (err) {
      throw err
    }
  }

  const refreshUserData = async (forceRefresh = false) => {
    if (!user?.fid) return

    setIsLoading(true)
    try {
      if (forceRefresh) {
        // Force refresh from Neynar regardless of cache
        const neynarUser = await neynarService.getUserByFid(user.fid)
        if (neynarUser) {
          const updatedUser = mapNeynarUserToFarcasterUser(neynarUser)
          setUser(updatedUser)
          await upsertUserToSupabase(updatedUser)
        }
      } else {
        // Use smart caching
        const userData = await getUserData(user.fid)
        if (userData) {
          setUser(userData)
        }
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  // Function to check cache status
  const getCacheStatus = () => {
    if (!user?.lastNeynarSync) {
      return { status: "no_sync", message: "No sync data available" }
    }

    const lastSyncDate = new Date(user.lastNeynarSync)
    const now = new Date()
    const timeDiff = now.getTime() - lastSyncDate.getTime()
    const daysAgo = Math.floor(timeDiff / (24 * 60 * 60 * 1000))

    if (timeDiff > NEYNAR_CACHE_DURATION) {
      return { status: "stale", message: `Data is ${daysAgo} days old (needs refresh)` }
    } else {
      const daysUntilRefresh = 10 - daysAgo
      return { status: "fresh", message: `Data is ${daysAgo} days old (refresh in ${daysUntilRefresh} days)` }
    }
  }

  return {
    user,
    isLoading,
    error,
    updateTokenAddress,
    refreshUserData,
    getCacheStatus,
    getUserFromDatabase,
    needsNeynarRefresh,
    isInFarcaster,
    context,
  }
}
