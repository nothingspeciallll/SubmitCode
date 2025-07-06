"use client"

import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { coinsService, type CoinData } from "@/lib/coins-service"
import { zoraService, DeployCurrency } from "@/lib/zora-service"

interface TokenMetadata {
  name: string
  description: string
  attributes: Array<{
    trait_type: string
    value: string
  }>
  image?: string
}
import { supabase } from "@/lib/supabase"
import { useFarcaster } from "@/hooks/use-farcaster"
import { useAccount, useWalletClient, usePublicClient } from "wagmi"
import { Address } from "viem"
import { CreateCoinForm } from "@/components/create/create-coin-form"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Coin name must be at least 2 characters.",
  }),
  symbol: z.string().min(2, {
    message: "Coin symbol must be at least 2 characters.",
  }),
  description: z.string().optional(),
  image_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
})

export default function CreatePage() {
  const router = useRouter()
  const { user: farcasterUser, isLoading: isFarcasterLoading } = useFarcaster()
  
  // Wallet connection hooks
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [hasCreatedCoin, setHasCreatedCoin] = useState<boolean | null>(null)
  const [userCoin, setUserCoin] = useState<CoinData | null>(null)
  const [isCreateCoinLoading, setIsCreateCoinLoading] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      image_url: "",
    },
  })

  // Auto-populate form with Farcaster user data and fetch bio from Supabase
  useEffect(() => {
    async function fetchUserBioAndPopulateForm() {
      if (!farcasterUser || isFarcasterLoading) return;

      // Set base information from Farcaster user
      form.setValue("name", farcasterUser.displayName || "")
      form.setValue("symbol", farcasterUser.username?.toUpperCase() || "")
      form.setValue("image_url", farcasterUser.pfpUrl || "")
      
      try {
        // Fetch user's bio from Supabase
        const { data, error } = await supabase
          .from("users")
          .select("bio")
          .eq("fid", farcasterUser.fid)
          .single();

        if (error) throw error;
        
        const userBio = data?.bio || "";
        const coinName = farcasterUser.displayName || "";
        const description = `${userBio}\n\n${coinName} coin created on Farcoins.xyz x Farcaster.xyz x Zora` 
        form.setValue("description", description);
      } catch {
        const coinName = farcasterUser.displayName || "";
        form.setValue("description", `${coinName} coin created on Farcoins.xyz x Farcaster.xyz x Zora`);
      }
    }
    fetchUserBioAndPopulateForm();
  }, [farcasterUser, isFarcasterLoading, form, supabase])

  // Check if user has already created a coin
  useEffect(() => {
    async function checkUserCoin() {
      if (!farcasterUser?.fid || isFarcasterLoading) return

      try {
        const hasCoin = await coinsService.hasUserCreatedCoin(farcasterUser.fid)
        setHasCreatedCoin(hasCoin)

        if (hasCoin) {
          const coin = await coinsService.getUserCoinByFid(farcasterUser.fid)
          setUserCoin(coin)
        }
      } catch {
        setHasCreatedCoin(false)
      }
    }

    checkUserCoin()
  }, [farcasterUser?.fid, isFarcasterLoading])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!farcasterUser?.fid) {
      return
    }
    if (!isConnected || !address) {
        return
    }
    if (!walletClient || !publicClient) {
        return
    }

    setIsCreateCoinLoading(true)

    try {
      // Create simple metadata object (minimal to avoid validation errors)
      const metadata: TokenMetadata = {
        name: values.name,
        description: values.description || `${values.name} coin created on Farcoins.xyz`,
        attributes: [
          { trait_type: "Creator", value: farcasterUser.displayName || "" },
          { trait_type: "Username", value: farcasterUser.username || "" },
          { trait_type: "Farcaster FID", value: farcasterUser.fid.toString() },
          { trait_type: "Platform", value: "Farcoins.xyz" },
          { trait_type: "Type", value: "Social Token" },
        ],
      }

      // Only add image if it's a valid URL
      if (values.image_url && values.image_url.startsWith('http')) {
        metadata.image = values.image_url
      }

      // For now, create a simple data URI for metadata (skipping IPFS)
      const metadataJson = JSON.stringify(metadata)
      // Use a Unicode-safe base64 encoding function instead of btoa
      const safeBase64 = (str: string) => {
        // First encode as UTF-8
        return Buffer.from(str).toString('base64')
      }
      const metadataUri = `data:application/json;base64,${safeBase64(metadataJson)}`

      // Step 1: Deploy to Zora first
      const zoraParams = {
        name: values.name,
        symbol: values.symbol,
        uri: metadataUri,
        payoutRecipient: address as Address,
        chainId: 8453, // Base mainnet
        currency: DeployCurrency.ETH,
      }

      const zoraResult = await zoraService.createCoin(
        zoraParams,
        walletClient,
        publicClient,
        { gasMultiplier: 120 }
      )

      // Step 2: Only save to Supabase after successful Zora deployment
      const coinData = await coinsService.createCoin({
        name: values.name,
        symbol: values.symbol,
        description: values.description || "",
        image_url: values.image_url || "",
        currency: "ETH",
        fid: farcasterUser.fid,
        creator_display_name: farcasterUser.displayName,
        creator_username: farcasterUser.username,
      })

      if (!coinData) {
        throw new Error("Failed to save coin data")
      }

      // Step 3: Update the coin record with deployment information
      await coinsService.updateCoinDeployment(coinData.id!, {
        contract_address: zoraResult.address,
        transaction_hash: zoraResult.hash,
        deployment_status: "success",
        metadata_uri: metadataUri,
      })

      // Keep loading state active during navigation
      // The loading state will be reset when the new page loads
      router.push(`/token/${farcasterUser.username}`)
      
    } catch (error) {
      console.error("Error creating coin:", error)
      setIsCreateCoinLoading(false)
    }
  }

  // Show existing coin if user has already created one
  if (hasCreatedCoin && userCoin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Your Coin Profile</h1>
            <p className="text-muted-foreground">
              You have already created your coin profile. Each user can only create one coin.
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center space-x-4 mb-4">
              {userCoin.image_url && (
                <img
                  src={userCoin.image_url || "/placeholder.svg"}
                  alt={userCoin.name}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold">{userCoin.name}</h2>
                <p className="text-lg text-muted-foreground">${userCoin.symbol}</p>
              </div>
            </div>

            {userCoin.description && <p className="text-muted-foreground mb-4">{userCoin.description}</p>}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status: {userCoin.deployment_status || "Created"}</span>
              <Button onClick={() => router.push(`/token/${userCoin.creator_username || farcasterUser?.username}`)}>View Details</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <CreateCoinForm 
      form={form}
      onSubmit={onSubmit}
      isCreateCoinLoading={isCreateCoinLoading}
      isConnected={isConnected}
      walletClient={walletClient}
    />
  )
}
