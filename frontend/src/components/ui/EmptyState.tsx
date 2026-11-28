import React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-hairline)]',
        className,
      )}
      {...props}
    >
        <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-muted)] mb-4">
          {icon || <Inbox className="w-7 h-7" aria-hidden="true" />}
        </div>
        <h3 className="text-lg font-bold text-[#E6ECF8]">{title}</h3>
        {description && (
          <p className="mt-1.5 text-sm text-[#9AA8C4] max-w-md">{description}</p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </div>
      )
}
