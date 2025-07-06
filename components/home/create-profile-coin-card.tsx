"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { useFarcaster } from "@/hooks/use-farcaster"
import { coinsService } from "@/lib/coins-service"
import { useRouter } from "next/navigation"
import { Plus, User, TrendingUp, Star } from "lucide-react"

export function CreateProfileCoinCard() {
  const router = useRouter()
  const { user: farcasterUser, isLoading: isFarcasterLoading } = useFarcaster()
  const [hasCreatedCoin, setHasCreatedCoin] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkUserCoin() {
      if (!farcasterUser?.fid || isFarcasterLoading) {
        setIsChecking(false)
        return
      }
      
      // Create a unique localStorage key for this user's coin status
      const localStorageKey = `farcoins_user_has_coin_${farcasterUser.fid}`
      
      // First check localStorage to avoid unnecessary API calls
      const storedHasCoin = localStorage.getItem(localStorageKey)
      
      if (storedHasCoin === 'true') {
        // If we already know from localStorage that user has a coin
        setHasCreatedCoin(true)
        setIsChecking(false)
        return
      }
      try {
        
        // If not in localStorage, check with the API
        const hasCoin = await coinsService.hasUserCreatedCoin(farcasterUser.fid)
        setHasCreatedCoin(hasCoin)
  
        // Store the result in localStorage for future page loads
        if (hasCoin) {
          localStorage.setItem(localStorageKey, 'true')
        }
      } catch (error) {
        setHasCreatedCoin(false)
      } finally {
        setIsChecking(false)
      }
    }

    // Use try-catch block to handle localStorage errors in private browsing mode
    try {
      checkUserCoin()
    } catch (error) {
      setIsChecking(false)
    }
  }, [farcasterUser?.fid, isFarcasterLoading])

  // Don't show if user has already created a coin
  if (hasCreatedCoin || isChecking || isFarcasterLoading || !farcasterUser) {
    return null
  }

  return (
    <Card 
      className={getMetalClassName('gold', 'animated', 'border-2 border-dashed border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 transition-all duration-300 mb-4')}
      style={{
        ...getMetalStyle('gold'),
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      }}
    >
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Icon */}
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className={getMetalClassName('platinum', 'animated', 'w-16 h-16 rounded-full flex items-center justify-center')} style={getMetalStyle('platinum')}>
              <User className="w-8 h-8 text-black" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-900">
              Create Your Profile Coin
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Turn your Farcaster profile into a tradeable social token and join the creator economy!
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span>Monetize your social influence</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Star className="w-3 h-3 text-yellow-600" />
              <span>Build your personal brand</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => router.push("/create")}
            className={getMetalClassName('platinum', 'animated', 'w-full')}
            style={getMetalStyle('platinum')}
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create My Coin
          </Button>

          {/* Subtitle */}
          <p className="text-xs text-gray-500">
            Free to create • One coin per profile
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 