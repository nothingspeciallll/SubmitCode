"use client"

import { useEffect, useRef } from 'react'
import { generateTokenFrameEmbed } from '@/lib/og-utils'

interface TokenFrameMetaProps {
  tokenName: string
  tokenSymbol: string
  username?: string
  tokenAddress?: string
  metal?: 'silver' | 'gold' | 'platinum' | 'chrome' | 'pearl'
}

export function TokenFrameMeta(props: TokenFrameMetaProps) {
  const metaElementRef = useRef<HTMLMetaElement | null>(null)
  const isUnmountedRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    isUnmountedRef.current = false

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Delay execution to ensure component is fully mounted
    timeoutRef.current = setTimeout(() => {
      if (isUnmountedRef.current) return

      try {
        const frameEmbed = generateTokenFrameEmbed({
          ...props,
          username: props.username || 'Anonymous',
          currentUrl: typeof window !== 'undefined' ? window.location.href : '',
        })
        
        // Safer DOM manipulation with multiple checks
        const safeRemoveElement = (element: Element | null) => {
          if (element && element.parentNode && document.body.contains(element)) {
            try {
              element.parentNode.removeChild(element)
            } catch (e) {
            }
          }
        }

        // Remove existing fc:frame meta tag if it exists
        const existingMetas = document.querySelectorAll('meta[name="fc:frame"]')
        existingMetas.forEach(safeRemoveElement)
        
        // Create and add new meta tag only if component is still mounted
        if (!isUnmountedRef.current && document.head) {
          const meta = document.createElement('meta')
          meta.name = 'fc:frame'
          meta.content = JSON.stringify(frameEmbed)
          meta.setAttribute('data-token-frame', 'true') // Add identifier
          
          // Store reference
          metaElementRef.current = meta
          
          // Safely append to head
          document.head.appendChild(meta)
        }
      } catch (error) {
        console.error('Error adding frame meta:', error)
      }
    })
    
    // Cleanup function with enhanced safety
    return () => {
      isUnmountedRef.current = true
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      // Use requestAnimationFrame for safer cleanup
      requestAnimationFrame(() => {
        try {
          
          // Remove by stored reference first
          if (metaElementRef.current && metaElementRef.current.parentNode && document.body.contains(metaElementRef.current)) {
            metaElementRef.current.parentNode.removeChild(metaElementRef.current)
          }
          
          // Fallback: remove any remaining fc:frame meta tags
          const metasToRemove = document.querySelectorAll('meta[name="fc:frame"][data-token-frame="true"]')
          metasToRemove.forEach(meta => {
            if (meta.parentNode && document.body.contains(meta)) {
              try {
                meta.parentNode.removeChild(meta)
              } catch (e) {
              }
            }
          })
        } catch (error) {
          // Silently handle all cleanup errors to prevent crashes
        } finally {
          metaElementRef.current = null
        }
      })
    }
  }, [props.tokenName, props.tokenSymbol, props.username, props.tokenAddress, props.metal])

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])
  
  return null
} 