"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { useTokenClaimContract, usePoolInfo } from "@/hooks/use-token-claim-contract"
import { useTokenBalance } from "@/hooks/use-token-balance"
import { useTokenApproval } from "@/hooks/use-token-approval"
import { useFarcaster } from "@/hooks/use-farcaster"
import { airdropsService, type AirdropPool } from "@/lib/airdrops-service"
import { Address, formatUnits, parseUnits } from "viem"
import { Coins, ArrowDown, Info, CheckCircle } from "lucide-react"

interface DepositTokenModalProps {
  tokenAddress: Address
  tokenName: string
  tokenSymbol: string
  tokenImage?: string
  tokenDecimals?: number
  isUserToken?: boolean
  trigger?: React.ReactNode
}

export function DepositTokenModal({
  tokenAddress,
  tokenName,
  tokenSymbol,
  tokenImage,
  tokenDecimals = 18,
  isUserToken = false,
  trigger
}: DepositTokenModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState("")
  const [isValidAmount, setIsValidAmount] = useState(false)
  const [existingPool, setExistingPool] = useState<AirdropPool | null>(null)
  const [isCheckingPool, setIsCheckingPool] = useState(false)
  const { user: farcasterUser } = useFarcaster()
  const { depositToken, isPending, isConfirming, isConfirmed, hash } = useTokenClaimContract()
  const { poolInfo, isLoading: isLoadingPool, refetch: refetchPool } = usePoolInfo(tokenAddress)
  const { balance: userBalance, isLoading: isLoadingBalance, isError: isBalanceError } = useTokenBalance(tokenAddress)
  const { 
    needsApproval, 
    approveToken, 
    isPending: isApprovePending, 
    isConfirming: isApproveConfirming, 
    isConfirmed: isApproveConfirmed,
    refetchAllowance 
  } = useTokenApproval(tokenAddress)

  // Format balance for display
  const formatBalance = (balance: bigint) => {
    try {
      if (balance === BigInt(0)) return "0"
      const formatted = formatUnits(balance, tokenDecimals)
      const num = parseFloat(formatted)
      if (num < 0.001) return "< 0.001"
      if (num < 1) return num.toFixed(6)
      if (num < 1000) return num.toFixed(3)
      if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
      return `${(num / 1000000).toFixed(1)}M`
    } catch {
      return "0"
    }
  }

  // Validate deposit amount
  useEffect(() => {
    if (!depositAmount) {
      setIsValidAmount(false)
      return
    }

    try {
      const amountBigInt = parseUnits(depositAmount, tokenDecimals)
      // If there's a balance error, still allow deposit if amount is valid
      if (isBalanceError) {
        setIsValidAmount(amountBigInt > BigInt(0))
        return
      }
      // Normal validation with balance check
      if (!userBalance) {
        setIsValidAmount(false)
        return
      }
      setIsValidAmount(amountBigInt > BigInt(0) && amountBigInt <= userBalance)
    } catch {
      setIsValidAmount(false)
    }
  }, [depositAmount, userBalance, tokenDecimals, isBalanceError])

  const handleApprove = async () => {
    if (!depositAmount) return
    await approveToken(depositAmount, tokenDecimals)
  }

  const handleDeposit = async () => {
    if (!isValidAmount || !farcasterUser?.fid) return
    // Check if approval is needed first
    if (needsApproval(depositAmount, tokenDecimals)) {
      return
    }
    await depositToken(tokenAddress, depositAmount, tokenDecimals)
  }

  const handleMaxClick = () => {
    if (userBalance) {
      const formatted = formatUnits(userBalance, tokenDecimals)
      setDepositAmount(formatted)
    }
  }

  // Check for existing pool when modal opens
  useEffect(() => {
    const checkExistingPool = async () => {
      if (!isOpen || !farcasterUser?.fid) return
      setIsCheckingPool(true)
      try {
        const pool = await airdropsService.getPoolByContractAndDepositor(
          tokenAddress, 
          farcasterUser.fid
        )
        setExistingPool(pool)
      } catch (error) {
        setExistingPool(null)
      } finally {
        setIsCheckingPool(false)
      }
    }
    checkExistingPool()
  }, [isOpen, tokenAddress, farcasterUser?.fid])

  // Handle successful approval
  useEffect(() => {
    if (isApproveConfirmed) {
      refetchAllowance()
    }
  }, [isApproveConfirmed, refetchAllowance])

  // Handle successful deposit
  useEffect(() => {
    if (isConfirmed) {

      // Create or update airdrop pool in Supabase
      const upsertPool = async () => {
        if (!farcasterUser?.fid || !depositAmount) return
        
        try {
          await airdropsService.upsertPool({
            contract_address: tokenAddress,
            token_name: tokenName,
            token_symbol: tokenSymbol,
            token_image: tokenImage,
            token_decimals: tokenDecimals,
            total_amount: parseUnits(depositAmount, tokenDecimals).toString(),
            depositor_fid: farcasterUser.fid,
            depositor_username: farcasterUser.username,
            transaction_hash: hash
          })
                    
          // Refresh pool info once after transaction is confirmed
          refetchPool()
        } catch{
        }
      }
      upsertPool()
      setDepositAmount("")
      setExistingPool(null) // Reset existing pool state
      setIsOpen(false)
    }
  }, [isConfirmed, hash, refetchPool, tokenSymbol, farcasterUser, depositAmount, tokenAddress, tokenName, tokenImage, tokenDecimals])

  const defaultTrigger = (
    <Button
      className={getMetalClassName('gold', 'animated')}
      style={getMetalStyle('gold')}
      size="sm"
    >
      <Coins className="w-4 h-4 mr-2" />
      Deposit {tokenSymbol}
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="!fixed !inset-0 !p-4 !m-0 !max-w-full !w-full !h-full !translate-x-0 !translate-y-0 !left-0 !top-0 sm:!left-[50%] sm:!top-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:!h-auto sm:!w-[95vw] sm:!max-w-md sm:!max-h-[90vh] sm:!rounded-lg !rounded-none flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Coins className="w-5 h-5" />
            <span>Deposit {tokenSymbol}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {/* Token Info */}
          <Card className={getMetalClassName('pearl', 'static')} style={getMetalStyle('pearl')}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={'w-12 h-12 rounded-lg flex items-center justify-center'}>
                  {tokenImage ? (
                    <img src={tokenImage} alt={tokenName} className="w-12 h-12 rounded-lg" />
                  ) : (
                    <Coins className="w-6 h-6 text-black" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base truncate">{tokenName}</h3>
                    <Badge className={getMetalClassName('pearl', 'static')} style={getMetalStyle('pearl')} variant="secondary">{tokenSymbol}</Badge>
                    {isUserToken && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Your Token
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 break-words">
                    Your Balance: {isLoadingBalance ? "Loading..." : 
                      isBalanceError ? "Unable to fetch balance" : 
                      `${formatBalance(userBalance || BigInt(0))} ${tokenSymbol}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Pool Info */}
          {isCheckingPool ? (
            <div className={`${getMetalClassName('pearl', 'static')} p-4 rounded-lg border border-gray-100`} style={getMetalStyle('pearl')}>
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-600">Checking existing pool...</span>
              </div>
            </div>
          ) : existingPool ? (
            <div className={`${getMetalClassName('pearl', 'static')} p-4 rounded-lg border border-gray-100`} style={getMetalStyle('pearl')}>
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Existing Pool Found</span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
              {!isLoadingPool && poolInfo && (
            <p>
              Total Pool: <span className="font-semibold">{formatBalance(poolInfo.totalPool)} {tokenSymbol}</span>
            </p>
          )}
                <p>Claims: <span className="font-semibold">{existingPool.claim_count}</span></p>
                <p className="text-xs text-green-600 bg-green-100 p-2 rounded mt-2">
                  💡 Your new deposit will be <strong>added</strong> to this existing pool
                </p>
              </div>
            </div>
          ) : (
            <div className={`${getMetalClassName('pearl', 'static')} p-4 rounded-lg border border-gray-100`} style={getMetalStyle('pearl')}>
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">New Pool</span>
              </div>
              <p className="text-sm text-blue-700">
                This will create a new airdrop pool for {tokenSymbol}
              </p>
            </div>
          )}
          
          {/* Deposit Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="deposit-amount">Deposit Amount</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMaxClick}
                  disabled={isLoadingBalance || isBalanceError || !userBalance}
                  className={getMetalClassName('pearl', 'static')}
                  style={getMetalStyle('pearl')}
                >
                  MAX
                </Button>
              </div>
              {depositAmount && !isValidAmount && (
                <p className="text-sm text-red-500 mt-1 break-words">
                  {isBalanceError ? "Invalid amount" : "Invalid amount or insufficient balance"}
                </p>
              )}
              
              {isBalanceError && (
                <p className="text-sm text-yellow-600 mt-1 break-words">
                  ⚠️ Unable to fetch balance, but you can still deposit if you have sufficient tokens
                </p>
              )}
            </div>

            {/* Marketing Benefits */}
            <div className={`${getMetalClassName('gold', 'static')} p-4 rounded-lg border`} style={getMetalStyle('gold')}>
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Marketing Benefits
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Other users can claim your tokens randomly</li>
                <li>• Increases exposure and awareness of your token</li>
                <li>• Builds community engagement</li>
                <li>• They will see your token in the airdrop list</li>
                <li>• Best way to marketing your farcaster profile</li>
              </ul>
            </div>

            {/* Approve/Deposit Buttons */}
            {depositAmount && needsApproval(depositAmount, tokenDecimals) ? (
              <Button
                onClick={handleApprove}
                disabled={!isValidAmount || isApprovePending || isApproveConfirming || !farcasterUser?.fid}
                className={getMetalClassName('gold', 'animated', 'w-full')}
                style={getMetalStyle('gold')}
              >
                {isApprovePending || isApproveConfirming ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    {isApprovePending ? 'Approving...' : 'Confirming...'}
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" />
                    Approve {tokenSymbol}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleDeposit}
                disabled={!isValidAmount || isPending || isConfirming || !farcasterUser?.fid || isCheckingPool}
                className={getMetalClassName('platinum', 'animated', 'w-full')}
                style={getMetalStyle('platinum')}
              >
                {isPending || isConfirming ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    {isPending ? 'Depositing...' : 'Confirming...'}
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4 mr-2" />
                    {existingPool ? `Add to Pool` : `Create Pool`}
                  </>
                )}
              </Button>
            )}

            {!farcasterUser?.fid && (
              <p className="text-xs text-red-500 text-center px-2 break-words">
                Connect Farcaster to deposit tokens
              </p>  
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 