'use client'

import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
  size?: 'sm' | 'md'
  className?: string
}

const variantClasses = {
  default: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/50',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200/50',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50',
  gray: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200/50',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full transition-all duration-200',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  )
}
