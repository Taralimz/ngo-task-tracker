'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3.5 py-2.5 border rounded-xl text-gray-900 placeholder-gray-400 bg-white',
            'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
            'transition-all duration-200 ease-smooth',
            'hover:border-gray-400',
            error ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400' : 'border-gray-200',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3.5 py-2.5 border rounded-xl text-gray-900 placeholder-gray-400 bg-white',
            'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
            'transition-all duration-200 ease-smooth resize-none',
            'hover:border-gray-400',
            error ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400' : 'border-gray-200',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
