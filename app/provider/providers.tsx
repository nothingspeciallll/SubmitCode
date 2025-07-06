"use client"

import type React from "react"
import { WagmiProvider } from "wagmi"
import { QueryClientProvider } from "@tanstack/react-query"
import { config } from "@/lib/wagmi-config"
import { createQueryClient } from "@/lib/react-query-config"
import { useState } from "react"
import { FarcasterProvider } from "@/components/farcaster-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient())

  return (
    <FarcasterProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </FarcasterProvider>
  )
}
