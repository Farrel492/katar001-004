import React from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-sm)] bg-slate-800/60 border border-[var(--border-hairline)]',
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  )
}
