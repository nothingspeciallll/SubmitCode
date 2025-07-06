/**
 * Metal Effects Utility
 * Provides functions and styles to create metallic effects for UI elements
 */

import { cva } from 'class-variance-authority';
import { cn } from './utils';

// Define metal variants
export const metalVariants = cva('relative overflow-hidden', {
  variants: {
    metal: {
      // Shiny silver
      silver: [
        'bg-gradient-to-b from-gray-200 to-gray-400',
        'text-gray-800',
        'border border-gray-300',
        'shadow-md',
        'font-semibold',
      ],
      // Shiny gold
      gold: [
        'bg-gradient-to-b from-amber-200 to-amber-400',
        'text-amber-900',
        'border border-amber-300',
        'shadow-md',
        'font-semibold',
      ],
      // Shiny copper
      copper: [
        'bg-gradient-to-b from-orange-200 to-orange-400',
        'text-orange-900',
        'border border-orange-300',
        'shadow-md',
        'font-semibold',
      ],
      // Shiny chrome
      chrome: [
        'bg-gradient-to-b from-slate-100 to-slate-300',
        'text-slate-800',
        'border border-slate-200',
        'shadow-md',
        'font-semibold',
      ],
      // Shiny platinum
      platinum: [
        'bg-gradient-to-b from-gray-100 to-gray-300',
        'text-gray-700',
        'border border-gray-200',
        'shadow-md',
        'font-semibold',
      ],
      // Light pearl white
      pearl: [
        'bg-gradient-to-b from-white to-gray-50',
        'text-gray-600',
        'border border-gray-100',
        'shadow-sm',
        'font-medium',
      ],
      // Shiny emerald (green) for Buy button
      emerald: [
        'bg-gradient-to-b from-emerald-300 to-emerald-500',
        'text-white',
        'border border-emerald-400',
        'shadow-md',
        'font-semibold',
      ],
      // Shiny ruby (red) for Sell button
      ruby: [
        'bg-gradient-to-b from-red-300 to-red-500',
        'text-white',
        'border border-red-400',
        'shadow-md',
        'font-semibold',
      ],
    },
    shine: {
      // Static shine effect
      static: 'shiny-metal',
      // Animated shine effect on hover
      animated: 'shiny-metal-animated',
      // Strong shine effect
      strong: 'shiny-metal-strong',
      // No shine effect
      none: '',
    }
  },
  defaultVariants: {
    metal: 'silver',
    shine: 'static',
  },
});

// Function to create inline styles for metal effect
export function getMetalStyle(type: 'silver' | 'gold' | 'chrome' | 'copper' | 'platinum' | 'pearl' | 'emerald' | 'ruby' = 'silver') {
  const metalStyles = {
    silver: {
      background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.2)',
      textShadow: '0 1px 1px rgba(255,255,255,0.2)',
    },
    gold: {
      background: 'linear-gradient(180deg, #fef3c7 0%, #fbbf24 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.2)',
      textShadow: '0 1px 1px rgba(255,255,255,0.2)',
    },
    chrome: {
      background: 'linear-gradient(180deg, #f1f5f9 0%, #cbd5e1 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 3px rgba(0,0,0,0.2)',
      textShadow: '0 1px 1px rgba(255,255,255,0.3)',
    },
    copper: {
      background: 'linear-gradient(180deg, #fed7aa 0%, #fb923c 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.2)',
      textShadow: '0 1px 1px rgba(255,255,255,0.2)',
    },
    platinum: {
      background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 3px rgba(0,0,0,0.1)',
      textShadow: '0 1px 1px rgba(255,255,255,0.4)',
    },
    pearl: {
      background: 'linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.1)',
      textShadow: '0 1px 1px rgba(255,255,255,0.8)',
    },
    emerald: {
      background: 'linear-gradient(180deg, #6ee7b7 0%, #10b981 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.2)',
      textShadow: '0 1px 1px rgba(0,0,0,0.1)',
    },
    ruby: {
      background: 'linear-gradient(180deg, #fca5a5 0%, #ef4444 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.2)',
      textShadow: '0 1px 1px rgba(0,0,0,0.1)',
    },
  };

  return metalStyles[type];
}

// Function to create className for metal effect
export function getMetalClassName(
  metal: 'silver' | 'gold' | 'chrome' | 'copper' | 'platinum' | 'pearl' | 'emerald' | 'ruby' = 'silver',
  shine: 'static' | 'animated' | 'strong' | 'none' = 'static',
  extraClassName: string = ''
) {
  return cn(metalVariants({ metal, shine }), extraClassName);
}
