import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helperText?: string
  errorMessage?: string
  options: SelectOption[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, errorMessage, id, options, className, ...props }, ref) => {
    const generatedId = useId()
    const selectId = id || generatedId
    const helperId = `${selectId}-helper`
    const errorId = `${selectId}-error`

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
            htmlFor={selectId}
            className="block text-sm font-medium text-[#E6ECF8] select-none"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] text-[#E6ECF8] border text-sm transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent min-h-[44px] appearance-none pr-10 cursor-pointer',
              hasError
                ? 'border-red-500 focus:ring-red-400'
                : 'border-slate-800 hover:border-slate-700',
              className,
            )}
            {...props}
          >
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-[#0C1427] text-[#E6ECF8]"
              >
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#9AA8C4]">
            <svg
              className="h-4 w-4 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
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

Select.displayName = 'Select'
