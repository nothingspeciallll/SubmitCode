"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Check, Sparkles, Wallet, DollarSign, AlertTriangle } from "lucide-react"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useFarcaster } from "@/hooks/use-farcaster"
import { supabase } from "@/lib/supabase"
import { type CoinData } from "@/lib/coins-service"
import { useAccount, useWalletClient, usePublicClient, useBalance } from "wagmi"
import { promotionService, PROMOTION_CONFIG } from "@/lib/promotion-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function PromotePage() {
  const router = useRouter()
  const { user: farcasterUser, isLoading: isFarcasterLoading } = useFarcaster()
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [userCoin, setUserCoin] = useState<CoinData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPromoting, setIsPromoting] = useState(false)
  const [hasPromotion, setHasPromotion] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<"ETH" | "USDC">("ETH")
  const [balanceInfo, setBalanceInfo] = useState<{
    eth: { balance: bigint; hasEnough: boolean }
    usdc: { balance: bigint; hasEnough: boolean }
  } | null>(null)

  // Get ETH balance
  const { data: ethBalance } = useBalance({ address })
  
  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address,
    token: PROMOTION_CONFIG.supportedCurrencies.USDC.address,
  })

  useEffect(() => {
    async function fetchUserCoin() {
      if (!farcasterUser?.fid || isFarcasterLoading) return

      try {
        setIsLoading(true)
        // Get user's coin
        const { data: coin, error: coinError } = await supabase
          .from("coins")
          .select("*")
          .eq("fid", farcasterUser.fid)
          .single()

        if (coinError) {
          if (coinError.code !== "PGRST116") {
            throw coinError
          }
          return
        }

        setUserCoin(coin)

        // Check if user already has a promotion
        if (coin) {
          const hasExistingPromotion = await promotionService.hasExistingPromotion(coin.id)
          setHasPromotion(hasExistingPromotion)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserCoin()
  }, [farcasterUser?.fid, isFarcasterLoading])

  // Update balance info when balances change
  useEffect(() => {
    if (!publicClient || !ethBalance?.value || !usdcBalance?.value) return

    async function checkBalances() {
      try {
        const ethRequired = promotionService.calculatePaymentAmount("ETH")
        const usdcRequired = promotionService.calculatePaymentAmount("USDC")

        setBalanceInfo({
          eth: {
            balance: ethBalance!.value,
            hasEnough: ethBalance!.value >= ethRequired
          },
          usdc: {
            balance: usdcBalance!.value,
            hasEnough: usdcBalance!.value >= usdcRequired
          }
        })
      } catch {
      }
    }

    checkBalances()
  }, [ethBalance, usdcBalance, publicClient])

  const handlePromote = async (currency?: "ETH" | "USDC") => {
    // If currency is provided, set it as the selected currency
    if (currency) {
      setSelectedCurrency(currency)
    }
    if (!userCoin || !userCoin.id || !farcasterUser || !address || !walletClient || !publicClient) {
      return
    }

    try {
      setIsPromoting(true)

      // Execute promotion with payment
      await promotionService.promoteWithPayment(
        userCoin.id,
        farcasterUser.fid,
        selectedCurrency,
        address,
        walletClient,
        publicClient
      )
      setHasPromotion(true)
      // Redirect to home after a short delay
      setTimeout(() => {
        router.push("/")
      }, 3000)
      } catch {
      console.error("Error promoting coin")
    } finally {
      setIsPromoting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-2 ${getMetalClassName('pearl', 'static')}`}
            style={getMetalStyle('pearl')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <Card 
            className={`animate-pulse ${getMetalClassName('pearl', 'static')}`}
            style={getMetalStyle('pearl')}
          >
            <CardHeader>
              <div className="h-7 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ) : !userCoin ? (
          <Card
            className={getMetalClassName('pearl', 'static')}
            style={getMetalStyle('pearl')}
          >
            <CardHeader>
              <CardTitle>No Coin Found</CardTitle>
              <CardDescription>You need to create a coin before you can promote it.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Create your own coin profile first to be able to promote it to other users.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/create">
                <Button>Create Your Coin</Button>
              </Link>
            </CardFooter>
          </Card>
        ) : hasPromotion ? (
          <Card
            className={getMetalClassName('pearl', 'static')}
            style={getMetalStyle('pearl')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                Your Coin Is Being Promoted
              </CardTitle>
              <CardDescription>Your coin is now visible in the promotions section.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  {userCoin.image_url ? (
                    <Image
                      src={userCoin.image_url || "/placeholder.svg"}
                      alt={userCoin.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `<span class="text-white font-bold text-xl">${userCoin.symbol.charAt(0)}</span>`
                        }
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-xl">{userCoin.symbol.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-lg">{userCoin.name}</h3>
                  <p className="text-gray-500">${userCoin.symbol}</p>
                </div>
              </div>

              <p className="text-gray-600">
                Your coin is now being promoted to all users. It will appear in the promotions section on the homepage.
              </p>
            </CardContent>
            <CardFooter>
              <Link href={`/token/${userCoin.id}`}>
                <Button variant="outline">View Your Coin</Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <Card
            className={getMetalClassName('pearl', 'static')}
            style={getMetalStyle('pearl')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Promote Your Coin
              </CardTitle>
              <CardDescription>Get more visibility for your coin by paying the promotion fee.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Coin Info */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  {userCoin.image_url ? (
                    <Image
                      src={userCoin.image_url || "/placeholder.svg"}
                      alt={userCoin.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `<span class="text-white font-bold text-xl">${userCoin.symbol.charAt(0)}</span>`
                        }
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-xl">{userCoin.symbol.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-lg">{userCoin.name}</h3>
                  <p className="text-gray-500">${userCoin.symbol}</p>
                </div>
              </div>

              {/* Wallet Connection */}
              {!isConnected && (
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertDescription>
                    Please connect your wallet to proceed with the promotion payment.
                  </AlertDescription>
                </Alert>
              )}

              {/* Payment Information */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <h3 className="font-medium text-lg">Promotion Fee</h3>
                    </div>
                    <Badge className="text-lg px-3 py-1 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800">
                      ${PROMOTION_CONFIG.feeUSD}
                    </Badge>
                  </div>
                    {/* Insufficient Balance Warning */}
                    {balanceInfo && (
                      <div className="mt-4">
                        {!balanceInfo.eth.hasEnough && !balanceInfo.usdc.hasEnough && (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Insufficient balance to pay the promotion fee in any currency.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                <h3 className="font-medium">Benefits of Promotion:</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Your coin will be featured on the homepage</li>
                  <li>Increased visibility to all users</li>
                  <li>Higher chance of attracting investors</li>
                  <li>Promotion lasts for 30 days</li>
                  <li>Payment is secure and on-chain</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button
                onClick={() => handlePromote("USDC")}
                disabled={
                  isPromoting || 
                  !isConnected || 
                  !balanceInfo || 
                  !balanceInfo.usdc.hasEnough
                }
                className={getMetalClassName('platinum', 'animated', 'flex-1 py-6')}
                style={getMetalStyle('platinum')}
              >
                {isPromoting && selectedCurrency === "USDC" ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5 mr-2" />
                    Pay with USDC
                  </>
                )}
              </Button>
              <Button
                onClick={() => handlePromote("ETH")}
                disabled={
                  isPromoting || 
                  !isConnected || 
                  !balanceInfo || 
                  !balanceInfo.eth.hasEnough
                }
                className={getMetalClassName('gold', 'animated', 'flex-1 py-6')}
                style={getMetalStyle('gold')}
              >
                {isPromoting && selectedCurrency === "ETH" ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-amber-900 border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5 mr-2" />
                    Pay with ETH
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
