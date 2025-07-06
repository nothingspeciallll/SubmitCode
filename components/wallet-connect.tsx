"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Wallet, LogOut } from "lucide-react"
import { useFarcaster } from "@/hooks/use-farcaster-context"
import { useFarcasterSDK } from "@/components/farcaster-provider"
import { useEffect } from "react"

export function WalletConnect() {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { user: farcasterUser, isInFarcaster } = useFarcaster()
  const { isReady: isSDKReady } = useFarcasterSDK()

  // Find Farcaster Frame connector
  const farcasterConnector = connectors.find(
    (connector) => connector.name === "Farcaster Frame"
  )

  // Auto-connect to Farcaster wallet if available and SDK is ready
  useEffect(() => {
    if (isSDKReady && !isConnected && farcasterConnector && isInFarcaster) {
      // Automatically try to connect to Farcaster wallet when in Farcaster
      connect({ connector: farcasterConnector })
    }
  }, [isSDKReady, isConnected, farcasterConnector, connect, isInFarcaster])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleConnect = (selectedConnector: any) => {
    connect({ connector: selectedConnector })
  }

  // Prioritize Farcaster connector, then others
  const sortedConnectors = [...connectors].sort((a, b) => {
    if (a.name === "Farcaster Frame") return -1
    if (b.name === "Farcaster Frame") return 1
    return 0
  })


  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={getMetalClassName('silver', 'animated', 'flex items-center space-x-2')}
            style={getMetalStyle('silver')}
          >
            {farcasterUser?.pfpUrl ? (
              <img
                src={farcasterUser.pfpUrl || "/placeholder.svg"}
                alt={farcasterUser.displayName || "User"}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-medium text-black">
              {(farcasterUser?.displayName || "User").slice(0, 8)}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1 text-xs text-gray-500">
            Connected via {connector?.name || "Unknown"}
            {isInFarcaster && <span className="text-orange-600 ml-1">🎭</span>}
          </div>
          <DropdownMenuItem onClick={() => disconnect()}>
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={getMetalClassName('silver', 'animated', 'flex items-center space-x-2')}
          style={getMetalStyle('silver')}
        >
          <Wallet className="w-4 h-4 hidden sm:inline" />
          <span>Connect Wallet</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sortedConnectors.map((connector) => (
          <DropdownMenuItem 
            key={connector.uid} 
            onClick={() => handleConnect(connector)}
            className={connector.name === "Farcaster Frame" ? "font-medium text-orange-600" : ""}
          >
            {connector.name === "Farcaster Frame" && "⭐ "}
            {connector.name}
          </DropdownMenuItem>
        ))}
        {!isSDKReady && (
          <div className="px-2 py-1 text-xs text-yellow-600">
            Farcaster SDK loading...
          </div>
        )}
        {isInFarcaster && (
          <div className="px-2 py-1 text-xs text-green-600">
            🎭 Running in Farcaster
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
