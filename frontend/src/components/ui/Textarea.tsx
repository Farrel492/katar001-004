import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  errorMessage?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, errorMessage, id, className, rows = 4, ...props }, ref) => {
    const generatedId = useId()
    const textareaId = id || generatedId
    const helperId = `${textareaId}-helper`
    const errorId = `${textareaId}-error`

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
            htmlFor={textareaId}
            className="block text-sm font-medium text-[#E6ECF8] select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] text-[#E6ECF8] border text-sm transition-colors duration-150',
            'placeholder:text-[#6B7A99] focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent min-h-[44px]',
            hasError
              ? 'border-red-500 focus:ring-red-400'
              : 'border-slate-800 hover:border-slate-700',
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

Textarea.displayName = 'Textarea'
