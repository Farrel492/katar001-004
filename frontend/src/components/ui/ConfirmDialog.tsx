import React from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
  isLoading?: boolean
  errorMessage?: string | null
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
  isLoading = false,
  errorMessage = null,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" closeOnOverlayClick={!isLoading}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={
              variant === 'danger'
                ? 'w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/80 text-red-400 flex items-center justify-center shrink-0'
                : 'w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-800/80 text-blue-400 flex items-center justify-center shrink-0'
            }
          >
            {variant === 'danger' ? (
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Info className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
          <div className="text-sm text-[#9AA8C4] leading-relaxed">{description}</div>
        </div>

        {errorMessage && (
          <div
            className="p-3 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-start gap-2"
            role="alert"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/60">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
