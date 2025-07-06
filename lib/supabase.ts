import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: number
  fid: number
  username?: string
  display_name?: string
  pfp_url?: string
  token_addr?: string
  created_at: string
  updated_at: string
}

export type Coin = {
  id: number
  name: string
  symbol: string
  description?: string
  image_url?: string
  currency: string
  creator_fid: number
  creator_display_name?: string
  creator_username?: string
  contract_address?: string
  metadata_uri?: string
  transaction_hash?: string
  deployment_status: "pending" | "success" | "failed"
  created_at: string
  updated_at: string
}
