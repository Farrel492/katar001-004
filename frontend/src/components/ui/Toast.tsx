import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastProps {
  message: string | null
  type?: ToastType
  onDismiss: () => void
  className?: string
}

export function Toast({ message, type = 'success', onDismiss, className }: ToastProps) {
  if (!message) return null

  const styles: Record<ToastType, string> = {
    success: 'bg-emerald-950/70 border-emerald-800/80 text-emerald-200',
    error: 'bg-red-950/70 border-red-800/80 text-red-200',
    info: 'bg-cyan-950/70 border-cyan-800/80 text-cyan-200',
  }

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertTriangle : Info
  const iconColor =
    type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-red-400' : 'text-cyan-400'

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cn(
        'p-4 rounded-xl border text-sm flex items-center justify-between gap-3 shadow-lg',
        styles[type],
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className={cn('w-5 h-5 shrink-0', iconColor)} aria-hidden="true" />
        <span className="break-words">{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="min-w-[44px] min-h-[44px] -my-2 -mr-2 flex items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#22D3EE] cursor-pointer"
        aria-label="Tutup pemberitahuan"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
