"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { useFarcaster } from "@/hooks/use-farcaster"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { GMAdvancedTradePanel } from "@/components/token/gm-advanced-trade-panel"
import { TokenDetails } from "@/components/token/token-details"
import { PriceChart } from "@/components/price-chart"
import { UserPortfolio } from "@/components/profile/user-portfolio"

// GM Token constant - dự án token đã định sẵn
const GM_TOKEN = {
  contract_address: "0x3cC0D3ECC81bA57ABF3494abc8D4cb0a43410b07", // GM token addr 
  symbol: "GM",
  name: "GMonchain" ,
  deployment_status: "success"
}

export function StatsSection() {

  const { user: farcasterUser } = useFarcaster()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Add these inside the StatsSection component
  const router = useRouter()
  const [promotedCoins, setPromotedCoins] = useState<any[]>([])
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(true)
  const [userHasPromotedCoin, setUserHasPromotedCoin] = useState(false)
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }



  useEffect(() => {
    async function fetchPromotedCoins() {
      try {
        setIsLoadingPromotions(true)
        // Fetch promoted coins
        const { data: promotions, error } = await supabase
          .from("promotions")
          .select("*, coins(*)")
          .order("created_at", { ascending: false })
          .limit(4)

        if (error) throw error

        // Format the data
        const formattedPromotions = promotions.map((promo) => ({
          id: promo.id,
          coin_id: promo.coin_id,
          name: promo.coins.name,
          symbol: promo.coins.symbol,
          image_url: promo.coins.image_url,
          creator_username: promo.coins.creator_username,
        }))

        setPromotedCoins(formattedPromotions)

        // Check if current user has a promoted coin
        if (farcasterUser?.fid) {
          const { data: userCoin, error: coinError } = await supabase
            .from("coins")
            .select("id")
            .eq("fid", farcasterUser.fid)
            .single()

          if (coinError && coinError.code !== "PGRST116") throw coinError

          if (userCoin) {
            const { data: userPromotion, error: promoError } = await supabase
              .from("promotions")
              .select("id")
              .eq("coin_id", userCoin.id)
              .single()

            if (promoError && promoError.code !== "PGRST116") throw promoError

            setUserHasPromotedCoin(!!userPromotion)
          }
        }
      } catch (error) {
        console.error("Error fetching promoted coins:", error)
      } finally {
        setIsLoadingPromotions(false)
      }
    }

    fetchPromotedCoins()
  }, [farcasterUser?.fid])

  return (
    <>
      <Card
        className={'text-black p-8 mb-8 cursor-pointer hover:shadow-1xl transition-all duration-300 transform hover:scale-[1.01]'}
        style={{
          backgroundImage: `url('/metal-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
          {/* Token Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center">
              <img src="https://www.clanker.world/_next/image?url=https%3A%2F%2Fturquoise-blank-swallow-685.mypinata.cloud%2Fipfs%2Fbafkreihnxocgdzdabeh4hhfduabtalko4frfllomwjj3ei55ypn3myttve&w=1080&q=75" alt="GM" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">GMonchain</h2>
                <p className="text-black text-lg">$GM</p>
              </div>
            </div>
            <p className="text-black mb-4">
              The official token of GMonchain. Join the GMonchain community and trade with confidence.
            </p>
          </div>

          {/* Promoted Coins */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg text-black font-semibold">Promoted Coins:</h3>
              {farcasterUser && !userHasPromotedCoin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-black border-black bg-black/10 hover:bg-black/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push("/promote")
                  }}
                >
                  Promote Your Coin
                </Button>
              )}
            </div>

            {isLoadingPromotions ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-8 animate-pulse">
                    <div className="flex items-center space-x-3">
                    </div>
                  </div>
                ))}
              </div>
            ) : promotedCoins.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {promotedCoins.map((coin) => (
                  <div
                    key={coin.id}
                    className="bg-white/10 rounded-lg p-3 cursor-pointer hover:bg-white/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/token/${coin.creator_username}`)
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                        {coin.image_url ? (
                          <img
                            src={coin.image_url || "/placeholder.svg"}
                            alt={coin.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = `<span class="text-white font-bold">${coin.symbol?.charAt(0) || "?"}</span>`
                              }
                            }}
                          />
                        ) : (
                          <span className="text-white font-bold">{coin.symbol?.charAt(0) || "?"}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-black">{coin.name && coin.name.length > 4 ? `${coin.name.slice(0, 4)}...` : coin.name}</div>
                        <div className="text-xs text-black">{coin.symbol && coin.symbol.length > 4 ? `${coin.symbol.slice(0, 4)}...` : coin.symbol}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <p className="text-black mb-2">No promoted coins yet</p>
                <p className="text-black text-sm mb-3">Be the first to promote your coin!</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* VIP Fullscreen Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className={getMetalClassName('pearl', 'static', 'max-w-none w-[100vw] h-[100vh] m-0 p-0 bg-gray-50 overflow-auto')}
          style={{
            ...getMetalStyle('pearl'),
            position: 'fixed',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            transform: 'none',
            maxWidth: '100vw',
            width: '100vw',
            height: '100vh',
            zIndex: 50,
            overflow: 'auto'
          }}
        >
          <div className="min-h-screen bg-gray-50 overflow-auto">
            <main className="container mx-auto px-4 py-6">
              {/* Back Navigation - matching token page */}
              <div className="flex justify-between items-center mb-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsDialogOpen(false)}
                  className={`${getMetalClassName('pearl', 'static')} flex items-center gap-2`}
                  style={getMetalStyle('pearl')}
                >
                  <X className="w-4 h-4" />
                  Close
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(`https://dexscreener.com/base/0x693388798eb494cb1a19753d1ac74d7a80a2da0b`)
                  }
                  className="flex items-center gap-2"
                >
                  View on Dexscreen
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {/* Main Grid Layout - exact copy of token page */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Token Details and Chart */}
                <div className="lg:col-span-2 space-y-6 ">
                  <TokenDetails 
                    token={{
                      id: "gm-token",
                      name: GM_TOKEN.name,
                      symbol: GM_TOKEN.symbol,
                      image: "https://www.clanker.world/_next/image?url=https%3A%2F%2Fturquoise-blank-swallow-685.mypinata.cloud%2Fipfs%2Fbafkreihnxocgdzdabeh4hhfduabtalko4frfllomwjj3ei55ypn3myttve&w=1080&q=75",
                      creator: "GMonchain",
                      followers: 19826,
                      mcap: "$50.4k",
                      timeAgo: "Official",
                      description: "Born on Farcaster, live on Base leading culture wave of $GM",
                      contract_address: GM_TOKEN.contract_address,
                      deployment_status: GM_TOKEN.deployment_status,
                      currency: "ETH",
                      price: "0.000024",
                      holders: 19826,
                      transactions: 58420,
                      creatorAddress: undefined,
                      decimals: 18,
                      username: "GMonchain"
                    }}
                    zoraData={null}
                  />
                  <PriceChart tokenAddress={GM_TOKEN.contract_address} />
                </div>

                {/* Right Column - Trading Panel and Portfolio */}
                <div className="lg:col-span-1 space-y-6">
                  <GMAdvancedTradePanel token={GM_TOKEN} />
                  <UserPortfolio />
                </div>
              </div>
            </main>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
