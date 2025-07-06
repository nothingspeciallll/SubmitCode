const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!
const NEYNAR_BASE_URL = process.env.NEYNAR_BASE_URL!

export interface NeynarUser {
  object: string
  fid: number
  username: string
  display_name: string
  custody_address: string
  pfp_url: string
  profile: {
    bio: {
      text: string
      mentioned_profiles?: any[]
      mentioned_channels?: any[]
    }
    location?: {
      latitude: number
      longitude: number
      address: {
        city: string
        state: string
        state_code: string
        country: string
        country_code: string
      }
    }
  }
  follower_count: number
  following_count: number
  verifications: string[]
  verified_addresses: {
    eth_addresses: string[]
    sol_addresses: string[]
    primary: {
      eth_address: string
      sol_address: string
    }
  }
  verified_accounts: Array<{
    platform: string
    username: string
  }>
  power_badge: boolean
  experimental: {
    neynar_user_score: number
  }
  score: number
}

export interface NeynarResponse {
  result: {
    users: NeynarUser[]
    next?: {
      cursor: string
    }
  }
}

class NeynarService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = NEYNAR_API_KEY
    this.baseUrl = NEYNAR_BASE_URL
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const options = {
      method: "GET",
      headers: {
        "x-api-key": this.apiKey,
        "x-neynar-experimental": "false",
      },
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options)

      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Neynar API request failed:", error)
      throw error
    }
  }

  private sanitizeUserData(user: any): NeynarUser | null {
    try {
      // Ensure required fields exist and have correct types
      if (!user || typeof user.fid !== "number" || user.fid <= 0) {
        console.warn("Invalid user data from Neynar:", user)
        return null
      }

      return {
        object: user.object || "user",
        fid: Math.floor(user.fid), // Ensure integer
        username: user.username || "",
        display_name: user.display_name || "",
        custody_address: user.custody_address || "",
        pfp_url: user.pfp_url || "",
        profile: {
          bio: {
            text: user.profile?.bio?.text || "",
            mentioned_profiles: user.profile?.bio?.mentioned_profiles || [],
            mentioned_channels: user.profile?.bio?.mentioned_channels || [],
          },
          location: user.profile?.location
            ? {
                latitude: user.profile.location.latitude || 0,
                longitude: user.profile.location.longitude || 0,
                address: {
                  city: user.profile.location.address?.city || "",
                  state: user.profile.location.address?.state || "",
                  state_code: user.profile.location.address?.state_code || "",
                  country: user.profile.location.address?.country || "",
                  country_code: user.profile.location.address?.country_code || "",
                },
              }
            : undefined,
        },
        follower_count: Math.floor(user.follower_count || 0), // Ensure integer
        following_count: Math.floor(user.following_count || 0), // Ensure integer
        verifications: user.verifications || [],
        verified_addresses: {
          eth_addresses: user.verified_addresses?.eth_addresses || [],
          sol_addresses: user.verified_addresses?.sol_addresses || [],
          primary: {
            eth_address: user.verified_addresses?.primary?.eth_address || "",
            sol_address: user.verified_addresses?.primary?.sol_address || "",
          },
        },
        verified_accounts: user.verified_accounts || [],
        power_badge: Boolean(user.power_badge),
        experimental: {
          neynar_user_score: Math.floor(user.experimental?.neynar_user_score || 0), // Ensure integer
        },
        score: Math.floor(user.score || 0), // Ensure integer
      }
    } catch (error) {
      console.error("Error sanitizing user data:", error)
      return null
    }
  }

  async getUserByFid(fid: number): Promise<NeynarUser | null> {
    try {
      const response = await this.makeRequest(`/user/bulk?fids=${fid}`)
      const user = response.users?.[0]
      return user ? this.sanitizeUserData(user) : null
    } catch (error) {
      console.error(`Failed to fetch user with FID ${fid}:`, error)
      return null
    }
  }

  async getUserByUsername(username: string): Promise<NeynarUser | null> {
    try {
      const response = await this.makeRequest(`/user/search?q=${encodeURIComponent(username)}&limit=1`)
      const user = response.result?.users?.[0]
      return user ? this.sanitizeUserData(user) : null
    } catch (error) {
      console.error(`Failed to fetch user with username ${username}:`, error)
      return null
    }
  }

}

export const neynarService = new NeynarService()