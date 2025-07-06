"use client"

import { Header } from "@/components/header"
import { DepositCard } from "@/components/airdrop/deposit-card"
import { ClaimableTokensList } from "@/components/airdrop/claimable-tokens-list"

export default function AirdropPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-[130vh] overflow-y-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Token Airdrop</h1>
              <p className="text-gray-600">Deposit your tokens for marketing and claim available airdrops</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Deposit Section */}
          <div className="lg:col-span-1 space-y-6">
            <DepositCard />
          </div>
          <div className="lg:col-span-2 space-y-6">
          </div>
        </div>
        <ClaimableTokensList />
      </main>
    </div> 
  )
} 