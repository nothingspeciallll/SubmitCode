"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Share2, Loader2 } from "lucide-react"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { sdk } from '@farcaster/frame-sdk'
import { useToast } from "@/components/ui/toast"
import { supabase } from "@/lib/supabase"

interface TokenShareButtonProps {
  tokenName: string
  tokenSymbol: string
  username: string
  marketCap?: string
  priceChange24h?: string
}

export function TokenShareButton({
  tokenName,
  tokenSymbol,
  username,
  priceChange24h,
}: TokenShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { addToast } = useToast()
  const [randomUsernames, setRandomUsernames] = useState<string[]>([])
  useEffect(() => {
    async function fetchUsernames() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('username')
          .not('username', 'is', null)
          .limit(20)
        
        if (error) {
          return
        }
        
        const usernames = data
          .map(user => user.username)
          .filter(username => username) as string[]
          
        if (usernames.length > 0) {
          setRandomUsernames(usernames)
        } 
      } catch (err) {
      }
    }
    
    fetchUsernames()
  }, [])

  const handleShare = async () => {
    try {
      setIsSharing(true)
      
      const changeText = priceChange24h && priceChange24h !== '0.0%' 
        ? ` (${priceChange24h} 24h)` 
        : ''
      
      // Get a random username to tag
      const randomUsername = randomUsernames[Math.floor(Math.random() * randomUsernames.length)]
      
      // Array of 10 different share text templates
      const shareTextOptions = [
    `🚀 Check out my profile coin #${tokenName} ($${tokenSymbol})${changeText} on Farcoins!\nAirdrop is live – join my community and claim yours!\n\n@${randomUsername} get your own coin too!\n\npowered by @Zora x @gmonchain.eth`,
    `🪙 I just launched #${tokenName} ($${tokenSymbol})${changeText} on Farcoins!\nClaim the airdrop and join the movement.\n\n@${randomUsername} you should mint your coin!\n\npowered by @Zora x @gmonchain.eth`,
    `💎 My official coin #${tokenName} ($${tokenSymbol})${changeText} is now live on Farcoins!\nAirdrop available for early supporters.\n\n@${randomUsername} let's build together!\n\npowered by @Zora x @gmonchain.eth`,
    `🔥 Just dropped my Farcoins profile token: #${tokenName} ($${tokenSymbol})${changeText}!\nClaim your airdrop and join my web3 community.\n\n@${randomUsername} make your own coin!\n\npowered by @Zora x @gmonchain.eth`,
    `🌊 Making waves with #${tokenName} ($${tokenSymbol})${changeText} on Farcoins!\nAirdrop open now – don't miss out.\n\n@${randomUsername} have you joined Farcoins yet?\n\npowered by @Zora x @gmonchain.eth`,
    `⚡️ Launch alert: #${tokenName} ($${tokenSymbol})${changeText} is now on Farcoins!\nClaim the airdrop and be part of the future.\n\n@${randomUsername} you should launch your coin too!\n\npowered by @Zora x @gmonchain.eth`,
    `🧠 Smart move! #${tokenName} ($${tokenSymbol})${changeText} is my new Farcoins token.\nAirdrop is live – join the revolution!\n\n@${randomUsername} let's coin your profile!\n\npowered by @Zora x @gmonchain.eth`,
    `✨ The future of social tokens: #${tokenName} ($${tokenSymbol})${changeText} on Farcoins!\nAirdrop happening now.\n\n@${randomUsername} claim yours and create your own!\n\npowered by @Zora x @gmonchain.eth`,
    `💫 Just minted my official coin #${tokenName} ($${tokenSymbol})${changeText} on Farcoins!\nAirdrop for my community is open.\n\n@${randomUsername} you should mint your own!\n\npowered by @Zora x @gmonchain.eth`,
    `🌐 Farcoins profile coin live: #${tokenName} ($${tokenSymbol})${changeText}!\nClaim the airdrop and join the social token movement.\n\n@${randomUsername} let's build web3 together!\n\npowered by @Zora x @gmonchain.eth`
  ]
      
      // Randomly select one of the share text options
      const suggestedText = shareTextOptions[Math.floor(Math.random() * shareTextOptions.length)]

      // Get current URL or construct it
      const embedUrl = `https://farcoins.xyz/token/${username}`
      
      // Compose cast with Farcaster SDK
      await sdk.actions.composeCast({
        text: `${suggestedText}\n${embedUrl}`,
        embeds: [embedUrl] as [string],
      })
    } catch (error) {
      await handleFallbackShare()
    } finally {
      setIsSharing(false)
    }
  }

  const handleFallbackShare = async () => {
    const shareUrl = `https://farcoins.xyz/token/${username}`
    const shareText = `Check out ${tokenName} ($${tokenSymbol}) on Farcoins!`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tokenName} - Farcoins`,
          text: shareText,
          url: shareUrl,
        })
      } catch (err) {
      }
    } else {
      // Copy to clipboard as fallback
      try {
        await navigator.clipboard.writeText(shareUrl)
        addToast({
          type: 'info',
          title: 'URL copied to clipboard',
          description: 'You can paste and share the token link manually.',
        })
      } catch (err) {
      }
    }
  }

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing}
      size="sm"
      className={`${getMetalClassName('emerald', 'animated')} flex items-center gap-2`}
      style={getMetalStyle('emerald')}
    >
      {isSharing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Share2 className="w-4 h-4" />
      )}
      {isSharing ? 'Sharing...' : 'Share Token'}
    </Button>
  )
} 