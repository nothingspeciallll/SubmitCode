"use client"

import { ArrowLeft, ExternalLink, Copy, Coins, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TokenShareButton } from "@/components/token/token-share-button"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import { ProfileHeader } from "@/components/profile/profile-header"
import { type ZoraToken } from "@/lib/zora-service"
import { type PromotionData } from "@/lib/promotion-service"
import { DepositTokenModal } from "@/components/deposit-token-modal"
import { PortfolioTab } from "@/components/profile/portfolio-tab"
import { Address } from "viem"

interface ProfileContentProps {
  farcasterUser: {
    neynarScore?: number
    pfpUrl?: string
    displayName?: string
    username?: string
    bio?: string
    powerBadge?: boolean
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
  formatNumber: (num?: number) => string
  activeTab: string
  setActiveTab: (tab: string) => void
  userCoin: any
  zoraData: ZoraToken | null
  promotion?: PromotionData | null
  formatTimeAgo: (dateString: string) => string
  formatDate: (dateString?: string) => string
  getRarityColor: (rarity: string) => string
  copyToClipboard: (text: string, label: string) => void
}

export function ProfileContent({
  farcasterUser,
  formatNumber,
  activeTab,
  setActiveTab,
  userCoin,
  zoraData,
  promotion,
  formatDate,
  copyToClipboard
}: ProfileContentProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-[130vh] overflow-y-auto">
        <div className="flex justify-between mb-6">
          <Link href="/">
            <Button 
              variant="outline" 
              className={`${getMetalClassName('pearl', 'static')} flex items-center gap-2`}
              style={getMetalStyle('pearl')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        
          {/* Main Profile Content */}
          <div className="lg:col-span-2">
            {/* Profile Header */}
            <ProfileHeader 
              farcasterUser={farcasterUser}
              formatNumber={formatNumber}
            />

            {/* Tabs Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="coin">Coin Profile</TabsTrigger>
                <TabsTrigger value="portfolio">
                  Portfolio
                </TabsTrigger>
                <TabsTrigger value="promotions">Promotions</TabsTrigger>
              </TabsList>

              <TabsContent value="portfolio" className="space-y-6">
                <PortfolioTab />
              </TabsContent>

              <TabsContent value="promotions" className="space-y-6">
                <Card
                  className={getMetalClassName('pearl', 'static')}
                  style={getMetalStyle('pearl')}
                >
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-blue-500" />
                        <span>Promotion Status</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {promotion ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="text-sm text-gray-500">Status</div>
                            <div className="flex items-center mt-1">
                              <Badge
                                className={promotion.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}
                              >
                                {promotion.status || 'unknown'}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="text-sm text-gray-500">Priority</div>
                            <div className="font-medium mt-1">{promotion.priority || 0}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="text-sm text-gray-500">Start Date</div>
                            <div className="flex items-center mt-1 space-x-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span>{promotion.start_date ? formatDate(promotion.start_date) : 'N/A'}</span>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="text-sm text-gray-500">End Date</div>
                            <div className="flex items-center mt-1 space-x-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span>{promotion.end_date ? formatDate(promotion.end_date) : 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg">
                          <div className="text-sm text-gray-500 mb-2">Payment Details</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-xs text-gray-500">Currency</div>
                              <div className="font-medium">{promotion.payment_currency || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Transaction</div>
                              <div className="font-medium truncate">
                                {promotion.payment_hash ? (
                                  <button 
                                    className="text-blue-500 hover:underline truncate max-w-[120px] inline-block"
                                    onClick={() => copyToClipboard(promotion.payment_hash || '', 'Transaction hash')}
                                  >
                                    {`${promotion.payment_hash.substring(0, 6)}...${promotion.payment_hash.substring(promotion.payment_hash.length - 4)}`}
                                  </button>
                                ) : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : userCoin ? (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No active promotion found for your coin.</p>
                        <p className="text-sm text-gray-400 mt-1">Promote your coin to get more visibility!</p>
                        <Link href="/promote">
                          <Button 
                            className={`mt-4 ${getMetalClassName('gold', 'animated')}`}
                            style={getMetalStyle('gold')}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Promote My Coin
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">You need to create a coin first.</p>
                        <p className="text-sm text-gray-400 mt-1">Create your coin to access promotions!</p>
                        <Link href="/create">
                          <Button 
                            className={`mt-4 ${getMetalClassName('silver', 'animated')}`}
                            style={getMetalStyle('silver')}
                          >
                            <Coins className="w-4 h-4 mr-2" />
                            Create Coin
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="coin" className="space-y-6">
                <Card
                  className={getMetalClassName('pearl', 'static')}
                  style={getMetalStyle('pearl')}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="h-5 w-5" />
                      Your Coin Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!userCoin ? (
                      <div className="text-center py-8">
                        <Coins className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 mb-2">No coin profile created yet</p>
                        <p className="text-sm text-gray-400 mb-4">
                          Create your unique coin profile on Farcoins.xyz! Each user can create one coin based on their
                          Farcaster identity.
                        </p>
                        <Link href="/create">
                          <Button 
                            className={getMetalClassName('gold', 'animated', '')}
                            style={getMetalStyle('gold')}
                          >
                            Create Your Coin Profile
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className={`${getMetalClassName('pearl', 'static')} p-4 rounded-lg flex items-center space-x-4`} style={getMetalStyle('pearl')}>
                          <div className="w-20 h-20 items-center justify-center">
                            {userCoin.image_url ? (
                              <img
                                src={userCoin.image_url || "/placeholder.svg"}
                                alt={userCoin.name}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = "none"
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.innerHTML = `<span class=\"text-white font-bold text-xl\">${userCoin.symbol.charAt(0)}</span>`
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-white font-bold text-xl">{userCoin.symbol.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex-grow">
                            <h2 className="text-2xl font-bold">{userCoin.name}</h2>
                            <p className="text-gray-500 text-sm">${userCoin.symbol}</p>
                            <div className="flex items-center gap-2 mt-2">
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className={`${getMetalClassName('pearl', 'static')} p-3 rounded-lg`} style={getMetalStyle('pearl')}>
                            <h3 className="font-medium mb-1">Currency</h3>
                            <p className="text-gray-600">{userCoin.currency}</p>
                          </div>
                          <div className={`${getMetalClassName('pearl', 'static')} p-3 rounded-lg`} style={getMetalStyle('pearl')}>
                            <h3 className="font-medium mb-1">Created</h3>
                            <p className="text-gray-600">{formatDate(userCoin.created_at)}</p>
                          </div>
                        </div>

                        {userCoin.contract_address && (
                          <div>
                            <h3 className="font-medium mb-2">Contract Address</h3>
                            <div className={`${getMetalClassName('pearl', 'static')} flex items-center gap-2 p-3 rounded-lg`} style={getMetalStyle('pearl')}>
                              <span className="font-mono text-sm flex-1">
                                {userCoin.contract_address.substring(0, 8)}...{userCoin.contract_address.substring(userCoin.contract_address.length - 8)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(userCoin.contract_address, "Contract address")}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(`https://basescan.org/address/${userCoin.contract_address}`, "_blank")
                                }
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {zoraData && (
                          <div className={`${getMetalClassName('pearl', 'static')} p-4 rounded-lg`} style={getMetalStyle('pearl')}>
                            <h3 className="font-medium mb-3 text-purple-800">Market Data</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-purple-600">Market Cap</p>
                                <p className="font-medium">
                                  {Number.parseFloat(zoraData.stats.marketCap).toFixed(4)} ETH
                                </p>
                              </div>
                              <div>
                                <p className="text-purple-600">Holders</p>
                                <p className="font-medium">{zoraData.stats.holders}</p>
                              </div>
                              <div>
                                <p className="text-purple-600">Volume</p>
                                <p className="font-medium">{Number.parseFloat(zoraData.stats.volume).toFixed(4)} ETH</p>
                              </div>
                              <div>
                                <p className="text-purple-600">Transactions</p>
                                <p className="font-medium">{zoraData.stats.transactions}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 flex-wrap mt-4 justify-center">
                          <Link
                            href={
                              userCoin.creator_username
                                ? `/token/${userCoin.creator_username}`
                                : `/token/${userCoin.id}`
                            }
                          >
                            <Button 
                              className={getMetalClassName('chrome', 'animated', '')}
                              style={getMetalStyle('chrome')}
                            >
                              View Coin Details
                            </Button>
                          </Link>
                          
                          {userCoin && (
                            <TokenShareButton
                              tokenName={userCoin.name}
                              tokenSymbol={userCoin.symbol}
                              username={userCoin.creator_username || ''}
                            />
                          )}

                          {userCoin.deployment_status === "success" && userCoin.contract_address && (
                            <>
                              <DepositTokenModal
                                tokenAddress={userCoin.contract_address as Address}
                                tokenName={userCoin.name}
                                tokenSymbol={userCoin.symbol}
                                tokenImage={userCoin.image_url}
                                tokenDecimals={zoraData?.decimals || 18}
                                isUserToken={true}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
      </main>
    </div>
  )
} 