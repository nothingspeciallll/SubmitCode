"use client"

import { useState, useEffect } from 'react'
import { getMetalClassName, getMetalStyle } from '@/lib/metal-effects'
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  description?: string
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, type, title, description, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
  }

  const colors = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600',
  }

  const Icon = icons[type]

  return (
    <div
      className={`${getMetalClassName('pearl', 'static')} fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-2`}
      style={getMetalStyle('pearl')}
    >
      <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg shadow-lg bg-white">
        <Icon className={`w-5 h-5 mt-0.5 ${colors[type]}`} />
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{title}</h4>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Toast context and provider
import { createContext, useContext, useCallback } from 'react'

interface ToastContextType {
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: (toastId: string) => {
        setToasts(prev => prev.filter(t => t.id !== toastId))
      },
    }
    setToasts(prev => [...prev, newToast])
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
} 