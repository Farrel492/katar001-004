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
    'inline-flex items-center justify-center font-semibold rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'

    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'text-sm px-3.5 py-2 min-h-[44px] sm:min-h-[38px]',
      md: 'text-sm sm:text-base px-4 py-2.5 min-h-[44px]',
      lg: 'text-base px-6 py-3 min-h-[48px]',
    }

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
      'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white border border-transparent',
      secondary:
      'bg-[var(--bg-elevated)] hover:bg-[#172442] text-[var(--text-main)] border border-[var(--border-strong)] hover:border-slate-500',
      ghost:
        'bg-transparent hover:bg-slate-800/40 text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent',
      danger:
      'bg-[var(--danger)] hover:bg-red-700 text-white border border-transparent',
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
          aria-label={props['aria-label']}
          title={props.title}
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
          aria-label={props['aria-label']}
          title={props.title}
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
