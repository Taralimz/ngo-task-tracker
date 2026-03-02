'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

const widthClasses = {
  sm: 'w-96',
  md: 'w-[480px]',
  lg: 'w-[560px]',
  xl: 'w-[720px]',
  '2xl': 'w-[900px]',
}

export function Drawer({ isOpen, onClose, title, children, width = 'lg', className }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-overlay"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <div
          ref={drawerRef}
          className={cn(
            'relative flex flex-col bg-white shadow-elevated animate-slide-in',
            widthClasses[width],
            className
          )}
        >
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                title="ปิด"
                aria-label="ปิด"
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-all duration-200 hover:rotate-90"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  )
}
