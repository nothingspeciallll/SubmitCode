"use client"

import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"

interface TokenZoraButtonProps {
  contractAddress: string
  size?: "default" | "sm" | "lg"
}

export function TokenZoraButton({
  contractAddress,
  size = "sm"
}: TokenZoraButtonProps) {
  if (!contractAddress) return null
  
  return (
    <Button 
      variant="outline" 
      size={size}
      className={getMetalClassName('gold', 'static')}
      style={getMetalStyle('gold')}
      asChild
    >
      <Link 
        href={`https://zora.co/coin/base:${contractAddress.toLowerCase()}`}
        target="_blank"
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        View on Zora
      </Link>
    </Button>
  )
}
