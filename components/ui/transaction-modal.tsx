"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ExternalLink, 
  Copy, 
  AlertTriangle,
  ArrowRight,
} from "lucide-react"
import { useTransactionModal } from "@/hooks/use-transaction-modal"

export type TransactionStep = 
  | "preparing"
  | "approval"
  | "signing"
  | "broadcasting"
  | "confirming"
  | "success"
  | "error"

export interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  step: TransactionStep
  txHash?: string
  error?: string
  tradeDetails?: {
    direction: "buy" | "sell"
    amount: string
    tokenSymbol: string
    expectedReceive: string
    receiveSymbol: string
    provider?: string
  }
}

export function TransactionModal({ 
  isOpen, 
  onClose, 
  step, 
  txHash, 
  error, 
  tradeDetails 
}: TransactionModalProps) {
  const [copied, setCopied] = useState(false)
  const isLoading = ["preparing", "approval", "signing", "broadcasting", "confirming"].includes(step)
  const isCompleted = step === "success"
  const isError = step === "error"

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStepStatus = (stepName: TransactionStep) => {
    const stepOrder: TransactionStep[] = ["preparing", "approval", "signing", "broadcasting", "confirming", "success"]
    const currentIndex = stepOrder.indexOf(step)
    const stepIndex = stepOrder.indexOf(stepName)
    
    if (step === "error") return "error"
    if (stepIndex < currentIndex) return "completed"
    if (stepIndex === currentIndex) return "current"
    return "pending"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/50" />
        <DialogContent className="fixed left-[50%] top-[50%] z-50 max-w-md translate-x-[-50%] translate-y-[-50%] p-0 overflow-hidden bg-white rounded-lg shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
              isError ? 'bg-red-100 text-red-600' :
              isCompleted ? 'bg-green-100 text-green-600' :
              'bg-blue-100 text-blue-600'
            }`}>
            </div>
            
        
          </div>

          {/* Trade Details */}
          {tradeDetails && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    {tradeDetails.direction === "buy" ? "Pay" : "Sell"}
                  </p>
                  <p className="font-semibold">
                    {tradeDetails.amount} {tradeDetails.tokenSymbol}
                  </p>
                </div>
                
                <ArrowRight className="w-4 h-4 text-gray-400" />
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Receive
                  </p>
                  <p className="font-semibold">
                    {tradeDetails.expectedReceive} {tradeDetails.receiveSymbol}
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Transaction Hash */}
          {txHash && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Transaction Hash:</span>
                <Badge variant="outline" className="text-xs">
                  Base Network
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <code className="text-xs bg-white px-2 py-1 rounded flex-1 overflow-hidden">
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(txHash)}
                  className="h-8 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`https://basescan.org/tx/${txHash}`, "_blank")}
                  className="h-8 px-2"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
              
              {copied && (
                <p className="text-xs text-green-600 mt-1">Copied!</p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-1">
                    Transaction Error
                  </h3>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading state message */}
          {isLoading && !isError && (
            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">
                {step === "signing" ? "Please check your wallet..." : "Processing..."}
              </p>
            </div>
          )}
        </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

// Default export wrapper that connects to the hook
export default function TransactionModalProvider() {
  const transactionModal = useTransactionModal()
  
  return (
    <TransactionModal
      isOpen={transactionModal.isOpen}
      onClose={transactionModal.closeModal}
      step={transactionModal.step}
      txHash={transactionModal.txHash}
      error={transactionModal.error}
      tradeDetails={transactionModal.tradeDetails}
    />
  )
} 