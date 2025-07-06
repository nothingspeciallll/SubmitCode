"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { StatsSection } from "@/components/stats-section"
import { TokenGrid } from "@/components/home/token-grid"
import { FilterSection } from "@/components/home/filter-section"
import { CreateProfileCoinCard } from "@/components/home/create-profile-coin-card"
import { useFarcasterContext } from "@/components/farcaster-provider"

export default function HomePage() {
  const [sortBy, setSortBy] = useState("newest")
  const [filterBy, setFilterBy] = useState("all")
  
  const { sdk, isSDKReady, isInFarcaster } = useFarcasterContext()

  useEffect(() => {
    async function initializeMiniApp() {
      if (isSDKReady && sdk?.actions && isInFarcaster) {
        await sdk.actions.addMiniApp()
      }
    }
    initializeMiniApp()
  }, [isSDKReady, sdk, isInFarcaster])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <StatsSection /> 
        <CreateProfileCoinCard />
        <FilterSection sortBy={sortBy} onSortChange={setSortBy} filterBy={filterBy} onFilterChange={setFilterBy} />
        <TokenGrid sortBy={sortBy} filterBy={filterBy} />
      </main>
    </div>
  )
}
