import { Metadata } from 'next'
import { coinsService } from '@/lib/coins-service'
import { zoraService } from '@/lib/zora-service'
import { generateTokenMetadata } from '@/lib/og-utils'

interface TokenLayoutProps {
  children: React.ReactNode
  params: { username: string }
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  try {
    // Fetch token data for metadata
    const tokenData = await coinsService.getCoinByUsername(params.username)
    
    if (!tokenData) {
      return {
        title: 'Token Not Found - Farcoins',
        description: 'The token you are looking for could not be found.',
      }
    }

    // Try to get Zora data if available
    let zoraData = null
    if (tokenData.contract_address) {
      try {
        zoraData = await zoraService.getTokenByAddress(tokenData.contract_address)
      } catch (error) {
      }
    }

    // Generate metadata with OG image and Farcaster frame
    const baseUrl = 'https://farcoins.xyz'
    const currentUrl = `${baseUrl}/token/${params.username}`
    return generateTokenMetadata({
      tokenName: zoraData?.name || tokenData.name,
      tokenSymbol: zoraData?.symbol || tokenData.symbol,
      description: zoraData?.metadata?.description || tokenData.description,
      username: params.username,
      currentUrl,
    })
  } catch (error) {
    return {
      title: 'Farcoins - Tokens',
      description: 'Trade Profile token on Farcoins - The premier memecoin trading platform.',
    }
  }
}

export default function TokenLayout({ children }: TokenLayoutProps) {
  return <>{children}</>
} 