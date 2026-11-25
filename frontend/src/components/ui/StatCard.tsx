import React from 'react'
import { cn } from '@/lib/utils'

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    label: string
    isPositive?: boolean
  }
  featured?: boolean
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  featured = false,
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        'p-6 rounded-2xl border transition-all duration-200',
        featured
          ? 'glass-effect shadow-xl shadow-cyan-950/20'
          : 'bg-[#0C1427] border-slate-800/80 shadow-md',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-[#9AA8C4] tracking-wide">
          {title}
        </span>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-[#111B33] border border-slate-700/40 flex items-center justify-center text-[#22D3EE] shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-[#E6ECF8] tabular-nums tracking-tight">
          {value}
        </div>
        {(description || trend) && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {trend && (
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-md inline-flex items-center',
                  trend.isPositive
                    ? 'bg-emerald-950/60 text-emerald-300'
                    : 'bg-rose-950/60 text-rose-300',
                )}
              >
                {trend.label}
              </span>
            )}
            {description && (
              <span className="text-xs text-[#9AA8C4]">{description}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
