"use client"

import { useMemo, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Home, User, Trophy, Gift } from "lucide-react"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import { useNavigation } from "@/hooks/use-navigation"

export function BottomNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { navItems: baseNavItems, navigateTo } = useNavigation()
  const isUnmountedRef = useRef(false)

  // Add icons to navigation
  const navItems = useMemo(() => [  
    { ...baseNavItems[0], icon: Home },
    {
      id: "airdrop",
      label: "Airdrop",
      icon: Gift,
      href: "/airdrop",
      active: pathname === "/airdrop",
    },
    { ...baseNavItems[1], icon: User },
    { ...baseNavItems[2], icon: Trophy },
  ], [baseNavItems, pathname])

  // Memoize handlers with safety checks
  const handleNavClick = useCallback((item: any) => {
    if (isUnmountedRef.current) return
    
    try {
      navigateTo(item.href)
    } catch (error) {
      console.error('Navigation error:', error)
      // Fallback to basic router navigation
      router.push(item.href)
    }
  }, [navigateTo, router])

  return (
    <>
    
      {/* Bottom Navigation - Only visible on mobile */}
      <div 
        className={`fixed bottom-0 left-0 right-0 border-t border-gray-200 z-50 md:hidden ${getMetalClassName('pearl', 'static')}`}
        style={{
          ...getMetalStyle('pearl'),
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
          position: 'fixed',
          width: '100%',
          bottom: 0,
        }}
      >
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  item.active 
                    ? getMetalClassName('platinum', 'static', 'text-[#e5e4e2] bg-white/20')
                    : 'text-gray-7600 hover:bg-gray-50'
                }`}
                disabled={isUnmountedRef.current} // Prevent clicks during unmount
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Add bottom padding to main content on mobile */}
      <style jsx global>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: 64px;
          }
        }
      `}</style>
    </>
  )
}
