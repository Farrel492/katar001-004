import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  featured?: boolean
}

export function Card({ className, children, featured = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border transition-colors duration-150',
        featured
          ?'bg-[var(--bg-elevated)] border-[var(--border-strong)] shadow-[var(--shadow-minimal)]'
          : 'bg-[var(--bg-surface)] border-[var(--border-hairline)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
      <div className={cn('p-6 pb-3 border-b border-[var(--border-hairline)]', className)} {...props}>
        {children}
      </div>
      )
}

      export function CardTitle({
        className,
        children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
        <h3
          className={cn('text-lg sm:text-xl font-bold tracking-tight text-[var(--text-main)]', className)}
          {...props}
        >
          {children}
        </h3>
        )
}

        export function CardDescription({
          className,
          children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
            <p className={cn('text-sm text-[var(--text-muted)] mt-1', className)} {...props}>
              {children}
            </p>
            )
}

            export function CardContent({
              className,
              children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
              <div className={cn('p-6', className)} {...props}>
                {children}
              </div>
              )
}

              export function CardFooter({
                className,
                children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
                <div
                  className={cn('p-6 pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between', className)}
                  {...props}
                >
                  {children}
                </div>
                )
}
