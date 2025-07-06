/**
 * Utility functions for Open Graph image generation
 */

export interface TokenOGOptions {
  username: string
}

/**
 * Generate OG image URL for a token
 */
export function generateTokenOGUrl(options: TokenOGOptions): string {
  const params = new URLSearchParams()
  
  if (options.username) {
    params.set('username', options.username)
  }
  return `https://farcoins.xyz/api/og/token?${params.toString()}`
}

/**
 * Generate Farcaster Frame embed data for token
 */
export function generateTokenFrameEmbed(options: {
  tokenName: string
  tokenSymbol: string
  username: string
  currentUrl?: string
}) {
  const ogImageUrl = generateTokenOGUrl({
    username: options.username
  })
  
  const frameEmbed = {
    version: "next",
    imageUrl: ogImageUrl,
    button: {
      title: `🪙 Trade $${options.tokenSymbol}`,
      action: {
        type: "launch_frame",
        url: `https://farcoins.xyz/token/${options.username}`,
        name: "Farcoins",
        splashImageUrl: "https://farcoins.xyz/logo.png",
        splashBackgroundColor: "#f8fafc"
      }
    }
  }
  
  return frameEmbed
}

/**
 * Generate metadata for a token page with Farcaster Mini App support
 */
export function generateTokenMetadata(options: {
  tokenName: string
  tokenSymbol: string
  description?: string
  username: string
  currentUrl?: string
}) {
  const ogImageUrl = generateTokenOGUrl({
    username: options.username
  })
  
  const title = `${options.tokenName} (${options.tokenSymbol}) - Farcoins`
  const description = options.description || 
    `Trade ${options.tokenName} (${options.tokenSymbol}) on Farcoins - The premier memecoin trading platform on Base blockchain.`
  
  // Generate Farcaster Frame embed
  const frameEmbed = generateTokenFrameEmbed({
    tokenName: options.tokenName,
    tokenSymbol: options.tokenSymbol,
    username: options.username,
    currentUrl: options.currentUrl
  })
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl,
        },
      ],
      type: 'website',
      siteName: 'Farcoins',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: '@farcoins',
    },
    other: {
      'fc:frame': JSON.stringify(frameEmbed),
    },
  }
} 