import React from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'draft'
  | 'preview'
  | 'published'
  | 'info'
  | 'warning'
  | 'danger'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: React.ReactNode
}

export function Badge({ variant = 'info', className, children, ...props }: BadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    draft: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    preview: 'bg-violet-950/60 text-violet-300 border-violet-800/70',
    published: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70',
    info: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/70',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-800/70',
    danger: 'bg-rose-950/60 text-rose-300 border-rose-800/70',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border select-none',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
