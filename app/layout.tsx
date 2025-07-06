import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/app/provider/providers"
import { BottomNavigation } from "@/components/bottom-navigation"
import { ToastProvider } from "@/components/ui/toast"

const inter = Inter({ subsets: ["latin"] }) 
export const metadata: Metadata = {
  title: "Farcoins - Coin Your Farcaster Profile",
  description: "Coin your Farcaster profile and get free memecoins on Base with Farcaster integration",
  keywords: ["memecoin", "cryptocurrency", "trading", "farcaster", "base", "blockchain", "web3", "tokens", "crypto"],
  authors: [{ name: "Farcoins Team", url: "https://farcoins.xyz" }],
  creator: "Farcoins",
  publisher: "Farcoins",
  applicationName: "Farcoins",
  category: "Finance",
  metadataBase: new URL("https://farcoins.xyz"),
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png"
  },
  openGraph: {
    title: "Farcoins - Coin Your Farcaster Profile",
    description: "Coin your Farcaster profile and get free memecoins on Base with Farcaster integration",
    url: "https://farcoins.xyz",
    siteName: "Farcoins",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://farcoins.xyz/logo.png",
        width: 1200,
        height: 630,
        alt: "Farcoins - Coin Your Farcaster Profile"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Farcoins - Coin Your Farcaster Profile",
    description: "Coin your Farcaster profile and get free memecoins on Base with Farcaster integration",
    creator: "@farcoins",
    site: "@farcoins",
    images: ["https://farcoins.xyz/logo.png"]
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://farcoins.xyz/Banner.png",
      button: {
        title: "Coin Your Profile 🪙",
        action: {
          type: "launch_frame",
          url: "https://farcoins.xyz",
          name: "Farcoins",
          splashImageUrl: "https://farcoins.xyz/splash.png",
          splashBackgroundColor: "#000000"
        }
      }
    }),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Update the return statement to include BottomNavigation
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ToastProvider>
            {/* <TokenClaimEventListener /> */}
            <main className="mobile-padding-bottom">
              {children}
            </main>
            <BottomNavigation />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}
