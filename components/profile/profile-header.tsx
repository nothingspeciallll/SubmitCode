"use client"

import { Card, CardContent } from "@/components/ui/card"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { 
  Users, 
  UserCheck, 
  MapPin,
} from "lucide-react"

interface ProfileHeaderProps {
  farcasterUser: {
    pfpUrl?: string
    displayName?: string
    username?: string
    bio?: string
    followerCount?: number
    followingCount?: number
    fid?: number
    location?: {
      city?: string
    }
    verifiedAddresses?: {
      eth_addresses?: string[]
    }
  }
  formatNumber: (num: number) => string
}

export function ProfileHeader({ farcasterUser, formatNumber }: ProfileHeaderProps) {
  return (
    <Card 
      className={`mb-6 overflow-hidden border-0 shadow-lg ${getMetalClassName('pearl', 'static')}`}
      style={getMetalStyle('pearl')}
    >

      {/* Background gradient */}
      {(() => {
        const metals = ['gold', 'silver', 'chrome', 'platinum', 'pearl'] as const;
        const randomMetal = metals[Math.floor(Math.random() * metals.length)];
        return (
          <div className={getMetalClassName(randomMetal, 'animated', 'h-24 w-full')} style={getMetalStyle(randomMetal)} />
        );
      })()}

      <CardContent className="relative p-6 -mt-12">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative">
              <img
                src={farcasterUser.pfpUrl || "/placeholder.svg"}
                alt={farcasterUser.displayName || "User"}
                className="w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-white shadow-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-grow space-y-4">
            {/* Name and Badge */}
            <div className="text-center lg:text-left">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {farcasterUser.displayName || farcasterUser.username}
                </h1>
              </div>
            </div>

            {/* Bio */}
            {farcasterUser.bio && (
              <div className="text-center lg:text-left">
                <p className="text-gray-700 leading-relaxed max-w-2xl">{farcasterUser.bio}</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <div className={`${getMetalClassName('pearl', 'static')} rounded-lg p-4 border border-gray-100 transition-shadow flex flex-col items-center`} style={getMetalStyle('pearl')}>
    <div className="flex items-center gap-2 text-blue-600 mb-1">
      <Users className="h-4 w-4" />
      <span className="text-xs font-medium uppercase tracking-wide">Followers</span>
    </div>
    <p className="text-xl font-bold text-gray-900">
      {formatNumber(farcasterUser.followerCount || 0)}
    </p>
  </div>

  <div className={`${getMetalClassName('pearl', 'static')} rounded-lg p-4 border border-gray-100 transition-shadow flex flex-col items-center`} style={getMetalStyle('pearl')}>
    <div className="flex items-center gap-2 text-green-600 mb-1">
      <UserCheck className="h-4 w-4" />
      <span className="text-xs font-medium uppercase tracking-wide">Following</span>
    </div>
    <p className="text-xl font-bold text-gray-900">
      {formatNumber(farcasterUser.followingCount || 0)}
    </p>
  </div>

  {farcasterUser.location?.city && (
    <div className={`${getMetalClassName('pearl', 'static')} rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center`} style={getMetalStyle('pearl')}>
      <div className="flex items-center gap-2 text-purple-600 mb-1">
        <MapPin className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">Location</span>
      </div>
      <p className="text-sm font-semibold text-gray-900 truncate">
        {farcasterUser.location.city}
      </p>
    </div>
  )}
          </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 