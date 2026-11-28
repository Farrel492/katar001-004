import React, { useCallback, useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  closeOnOverlayClick?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  closeOnOverlayClick = true,
}: ModalProps) {
  const titleId = useId()
  const descId = useId()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  // Simpan referensi onClose terbaru tanpa menjadikannya dependency effect
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  // Handler keyboard stabil — tidak berganti referensi saat parent re-render
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCloseRef.current()
      return
    }

    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, []) // deps kosong: stabil selamanya, baca onClose via ref

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement | null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Fokus hanya dipindah SEKALI saat modal pertama kali terbuka
    const timer = window.setTimeout(() => {
      const container = dialogRef.current
      if (!container) return
      // Lewati tombol tutup (index 0) agar fokus langsung ke field pertama
      const focusable = container.querySelectorAll<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      )
      if (focusable.length > 0) {
        focusable[0].focus()
      } else {
        container.focus()
      }
  }, 50)

  window.addEventListener('keydown', handleKeyDown)

  return () => {
    window.clearTimeout(timer)
    window.removeEventListener('keydown', handleKeyDown)
    document.body.style.overflow = originalOverflow
    previousFocusRef.current?.focus?.()
  }
  }, [isOpen, handleKeyDown]) // handleKeyDown stabil → effect hanya jalan saat isOpen berubah

if (!isOpen) return null

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

return (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    aria-describedby={description ? descId : undefined}
    onMouseDown={(e) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose()
      }
    }}
  >
    <div
      ref={dialogRef}
      tabIndex={-1}
      className={cn(
        'bg-[#0C1427] border border-slate-800 rounded-2xl w-full overflow-hidden shadow-2xl my-auto focus:outline-none',
        sizeClasses[size],
      )}
    >
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-800/80">
        <div>
          <h2 id={titleId} className="text-lg font-bold text-[#E6ECF8]">
            {title}
          </h2>
          {description && (
            <p id={descId} className="text-xs text-[#9AA8C4] mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 rounded-xl flex items-center justify-center text-[#9AA8C4] hover:text-white hover:bg-slate-800/60 focus-visible:outline-2 focus-visible:outline-[#22D3EE] cursor-pointer"
          aria-label={`Tutup ${title}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
)
}
