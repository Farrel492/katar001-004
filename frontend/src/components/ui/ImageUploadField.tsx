import React, { useId, useRef, useState } from 'react'
import { Image as ImageIcon, Upload, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

export interface ImageUploadFieldProps {
  label: string
  currentUrl: string | null
  onUpload: (file: File) => Promise<void>
  onDelete?: () => Promise<void>
  helperText?: string
  disabled?: boolean
  aspect?: 'square' | 'wide'
  fallbackText?: string
}

export function ImageUploadField({
  label,
  currentUrl,
  onUpload,
  onDelete,
  helperText = 'Format: JPG, PNG, atau WebP. Maksimal 2 MB.',
  disabled = false,
  aspect = 'square',
  fallbackText,
}: ImageUploadFieldProps) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setLocalError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setLocalError('Format berkas harus JPG, PNG, atau WebP.')
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setLocalError('Ukuran berkas tidak boleh melebihi 2 MB.')
      return
    }

    setIsUploading(true)
    try {
      await onUpload(file)
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Gagal mengunggah gambar.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setLocalError(null)
    setIsDeleting(true)
    try {
      await onDelete()
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Gagal menghapus gambar.')
    } finally {
      setIsDeleting(false)
    }
  }

  const isBusy = isUploading || isDeleting || disabled

  return (
    <div className="space-y-2.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-[#E6ECF8]">
        {label}
      </label>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-[#060B18] border border-slate-800">
        {/* Pratinjau */}
        <div
          className={cn(
            'rounded-xl bg-[#111B33] border border-slate-700/60 overflow-hidden flex items-center justify-center shrink-0',
            aspect === 'square' ? 'w-24 h-24' : 'w-32 h-24',
          )}
        >
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={label}
              className="w-full h-full object-cover"
            />
          ) : fallbackText ? (
            <span className="text-xl font-bold text-[#9AA8C4] select-none">
              {fallbackText}
            </span>
          ) : (
            <ImageIcon className="w-8 h-8 text-[#7182A4]" aria-hidden="true" />
          )}
        </div>

        {/* Kontrol Unggah & Hapus */}
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={isBusy}
            className="sr-only"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {currentUrl ? 'Ganti Gambar' : 'Pilih Gambar'}
                </>
              )}
            </Button>

            {currentUrl && onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                disabled={isBusy}
                onClick={handleDelete}
                className="text-[#F87171] hover:text-red-300 hover:bg-red-950/30 min-h-[44px]"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1.5" />
                )}
                Hapus
              </Button>
            )}
          </div>

          <p className="text-xs text-[#9AA8C4]">{helperText}</p>
        </div>
      </div>

      {localError && (
        <div className="flex items-start gap-2 text-xs text-red-400 font-medium" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{localError}</span>
        </div>
      )}
    </div>
  )
}
