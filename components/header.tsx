"use client"

import { WalletConnect } from "./wallet-connect"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { useMobile } from "@/hooks/use-mobile"
import { useAccount } from "wagmi"

export function Header() {
  const isMobile = useMobile()
  const { isConnected } = useAccount()

  // Hide header on mobile when wallet is connected
  if (isMobile && isConnected) {
    return null
  }

  return ( 
    <header 
      className={`sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 ${getMetalClassName('pearl', 'static')}`}
      style={getMetalStyle('pearl')}
    >
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          {!isMobile && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
              FarCoins.xyz
            </h1>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <WalletConnect />
        </div>
      </div>
    </header>
  )
}
