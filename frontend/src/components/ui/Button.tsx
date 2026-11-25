import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  to?: string
  href?: string
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      className,
      to,
      href,
      children,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'

    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'text-xs px-3 py-1.5 min-h-[36px] sm:min-h-[36px]',
      md: 'text-sm px-4 py-2.5 min-h-[44px]', // Memenuhi target sentuh minimal 44px
      lg: 'text-base px-6 py-3.5 min-h-[48px]',
    }

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-[#2F6BFF] hover:bg-[#4F82FF] text-white shadow-lg shadow-blue-900/30 active:scale-[0.98]',
      secondary:
        'bg-[#111B33] hover:bg-[#16223b] text-[#E6ECF8] border border-slate-700/60 hover:border-slate-500',
      ghost: 'bg-transparent hover:bg-slate-800/40 text-[#9AA8C4] hover:text-[#E6ECF8]',
      danger:
        'bg-[#F87171] hover:bg-red-500 text-white shadow-lg shadow-red-950/40 active:scale-[0.98]',
    }

    const combinedClassName = cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      isLoading && 'opacity-80 pointer-events-none',
      className,
    )

    const content = (
      <>
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </>
    )

    if (to) {
      return (
        <Link
          to={to}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={combinedClassName}
          aria-disabled={disabled || isLoading}
        >
          {content}
        </Link>
      )
    }

    if (href) {
      return (
        <a
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={combinedClassName}
          aria-disabled={disabled || isLoading}
        >
          {content}
        </a>
      )
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={combinedClassName}
        {...props}
      >
        {content}
      </button>
    )
  },
)

Button.displayName = 'Button'
