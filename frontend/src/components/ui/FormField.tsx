import React from 'react'
import { cn } from '@/lib/utils'

export interface FormFieldProps {
  label: string
  htmlFor?: string
  helperText?: string
  errorMessage?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  helperText,
  errorMessage,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('w-full space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-[#E6ECF8] select-none"
      >
        {label}
        {required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {helperText && !errorMessage && (
        <p className="text-xs text-[#9AA8C4]">{helperText}</p>
      )}
      {errorMessage && (
        <p className="text-xs text-red-400 font-medium" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
