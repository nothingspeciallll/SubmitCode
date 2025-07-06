import { useState } from "react"
import type { TransactionStep } from "@/components/ui/transaction-modal"

export interface TransactionState {
  isOpen: boolean
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

export function useTransactionModal() {
  const [state, setState] = useState<TransactionState>({
    isOpen: false,
    step: "preparing"
  })

  const openModal = (tradeDetails?: TransactionState['tradeDetails']) => {
    setState({
      isOpen: true,
      step: "preparing",
      tradeDetails
    })
  }

  const updateStep = (step: TransactionStep) => {
    setState(prev => ({ ...prev, step }))
  }

  const setTxHash = (txHash: string) => {
    setState(prev => ({ ...prev, txHash }))
  }

  const setError = (error: string) => {
    setState(prev => ({ ...prev, error, step: "error" }))
  }

  const closeModal = () => {
    setState({
      isOpen: false,
      step: "preparing"
    })
  }

  return {
    ...state,
    openModal,
    updateStep,
    setTxHash,
    setError,
    closeModal
  }
} 