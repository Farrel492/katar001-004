import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  errorMessage?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, errorMessage, id, className, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const helperId = `${inputId}-helper`
    const errorId = `${inputId}-error`

    const hasError = Boolean(errorMessage)
    const describedBy = [
      hasError ? errorId : null,
      helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#E6ECF8] select-none"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-base)] text-[var(--text-main)] border text-base sm:text-sm transition-colors duration-150',
            'placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent min-h-[44px]',
            hasError
              ? 'border-red-500 focus:ring-red-400'
              : 'border-[var(--border-strong)] hover:border-slate-500',
        className,
          )}
        {...props}
        />
        {helperText && !hasError && (
          <p id={helperId} className="text-xs text-[#9AA8C4]">
            {helperText}
          </p>
        )}
        {hasError && (
          <p id={errorId} className="text-xs text-red-400 font-medium">
            {errorMessage}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
