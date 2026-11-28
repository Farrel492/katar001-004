import { useState, useEffect, useCallback, useId } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Image as ImageIcon,
  ArrowLeft,
  Upload,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit,
  XCircle,
  Calendar,
} from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  Toast,
  type ToastType,
  Spinner,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  getAdminAlbumDetail,
  uploadAlbumPhotos,
  updatePhotoCaption,
  deleteAlbumPhoto,
  reorderAlbumPhotos,
  setAlbumCoverPhoto,
  type AlbumData,
  type AlbumPhotoData,
} from '@/lib/api'
import { formatDate } from '@/lib/format'

export default function AdminGalleryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const albumId = parseInt(id || '0', 10)

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type })
    window.setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr))
    }, 4500)
  }

  const [album, setAlbum] = useState<AlbumData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Upload state
  const [uploadFiles, setUploadFiles] = useState<{ file: File; preview: string; caption: string }[]>([])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const [uploadProgressMsg, setUploadProgressMsg] = useState('')

  // Edit Caption State
  const [editingCaptionId, setEditingCaptionId] = useState<number | null>(null)
  const [captionInput, setCaptionInput] = useState('')

  // Confirm Delete
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState<AlbumPhotoData | null>(null)

  useDocumentTitle(album ? `Foto: ${album.title}` : 'Kelola Foto Album', true)

  const fetchAlbum = useCallback(async () => {
    if (!albumId) return
    setIsLoading(true)
    try {
      const res = await getAdminAlbumDetail(albumId)
      setAlbum(res.data)
    } catch {
      showToast('Gagal memuat informasi album.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [albumId])

  useEffect(() => {
    fetchAlbum()
  }, [fetchAlbum])

  const handleSelectPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected || selected.length === 0) return

    if (selected.length > 10) {
      showToast('Maksimal memilih 10 foto sekaligus.', 'error')
      return
    }

    const newFiles: { file: File; preview: string; caption: string }[] = []
    Array.from(selected).forEach((file) => {
      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
        caption: '',
      })
    })

    setUploadFiles(newFiles)
  }

  const handleExecuteUpload = async () => {
    if (!album || uploadFiles.length === 0) return

    setIsUploadingPhotos(true)
    setUploadProgressMsg(`Mengunggah ${uploadFiles.length} foto ke album...`)

    try {
      const files = uploadFiles.map((item) => item.file)
      const captions = uploadFiles.map((item) => item.caption)

      const res = await uploadAlbumPhotos(album.id, files, captions)
      showToast(res.message, res.failed.length > 0 ? 'error' : 'success')

      setAlbum(res.album)
      setUploadFiles([])
      setUploadProgressMsg('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto.'
      showToast(msg, 'error')
    } finally {
      setIsUploadingPhotos(false)
    }
  }

  const handleSavePhotoCaption = async (photoId: number) => {
    if (!album) return
    try {
      await updatePhotoCaption(album.id, photoId, captionInput)
      showToast('Keterangan foto berhasil diperbarui.', 'success')
      setAlbum((prev) => {
        if (!prev || !prev.photos) return prev
        return {
          ...prev,
          photos: prev.photos.map((p) => (p.id === photoId ? { ...p, caption: captionInput } : p)),
        }
      })
      setEditingCaptionId(null)
    } catch {
      showToast('Gagal memperbarui keterangan foto.', 'error')
    }
  }

  const handleSetCoverPhoto = async (photoId: number) => {
    if (!album) return
    try {
      const res = await setAlbumCoverPhoto(album.id, photoId)
      showToast('Sampul album berhasil diganti.', 'success')
      setAlbum(res.data)
    } catch {
      showToast('Gagal menyetel sampul album.', 'error')
    }
  }

  const handleDeletePhoto = async () => {
    if (!album || !confirmDeletePhoto) return
    try {
      const res = await deleteAlbumPhoto(album.id, confirmDeletePhoto.id)
      showToast('Foto berhasil dihapus.', 'success')
      setAlbum(res.album)
      setConfirmDeletePhoto(null)
    } catch {
      showToast('Gagal menghapus foto.', 'error')
    }
  }

  const handleMovePhoto = async (index: number, direction: 'up' | 'down') => {
    if (!album || !album.photos) return
    const photos = [...album.photos]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= photos.length) return

    const temp = photos[index]
    photos[index] = photos[targetIndex]
    photos[targetIndex] = temp

    const ids = photos.map((p) => p.id)
    try {
      const res = await reorderAlbumPhotos(album.id, ids)
      setAlbum((prev) => (prev ? { ...prev, photos: res.photos } : prev))
      showToast('Urutan foto berhasil disimpan.', 'success')
    } catch {
      showToast('Gagal memperbarui urutan foto.', 'error')
    }
  }

  const uploadInputId = useId()

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-[#9AA8C4]">Memuat informasi album & foto...</p>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-red-400">Album tidak ditemukan atau telah dihapus.</p>
        <Link to="/admin/galeri" className="text-sm text-blue-400 hover:underline">
          Kembali ke Daftar Galeri
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <Toast
        message={toast?.message ?? null}
        type={toast?.type}
        onDismiss={() => setToast(null)}
      />

      {/* Navigasi Balik & Info Singkat */}
      <div className="space-y-3 border-b border-slate-800 pb-5">
        <Link
          to="/admin/galeri"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#9AA8C4] hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Semua Album
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <ImageIcon className="w-6 h-6 text-[#2F6BFF]" />
              {album.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-[#9AA8C4] mt-1">
              <Calendar className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>{album.taken_at ? formatDate(album.taken_at) : 'Tanggal tidak disetel'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">Status: {album.status === 'published' ? 'Terbit' : 'Draft'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Area Unggah Banyak Foto */}
      <div className="p-5 rounded-2xl bg-[#0C1427]/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#2F6BFF]" />
              Unggah Foto Baru
            </h2>
            <p className="text-xs text-[#9AA8C4] mt-0.5">
              Maksimal 10 foto sekaligus. Format JPG, PNG, atau WebP (maks 2 MB per file).
            </p>
          </div>

          <label
            htmlFor={uploadInputId}
            className="px-3.5 py-2 rounded-xl bg-[#2F6BFF] hover:bg-blue-600 text-white text-xs font-semibold cursor-pointer transition shadow flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Pilih Foto
          </label>
          <input
            id={uploadInputId}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleSelectPhotos}
            disabled={isUploadingPhotos}
          />
        </div>

        {/* Antrean File yang Dipilih */}
        {uploadFiles.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-h-60 overflow-y-auto p-1">
              {uploadFiles.map((item, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group">
                  <img src={item.preview} alt="Pratinjau" className="w-full aspect-square object-cover" />
                  <div className="p-1.5 bg-slate-950/90">
                    <input
                      type="text"
                      placeholder="Keterangan..."
                      value={item.caption}
                      onChange={(e) => {
                        const val = e.target.value
                        setUploadFiles((prev) =>
                          prev.map((f, i) => (i === idx ? { ...f, caption: val } : f))
                        )
                      }}
                      className="w-full bg-transparent text-[11px] text-white border-none focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-600 transition"
                    title="Batal pilih"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-xs text-[#9AA8C4]">
                {uploadFiles.length} foto siap diunggah
              </span>
              <Button
                size="sm"
                onClick={handleExecuteUpload}
                disabled={isUploadingPhotos}
                className="text-xs"
              >
                {isUploadingPhotos ? (
                  <>
                    <Spinner size="sm" className="mr-1.5" />
                    {uploadProgressMsg || 'Mengunggah...'}
                  </>
                ) : (
                  'Mulai Unggah Semua'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Grid Koleksi Foto yang Sudah Ada */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
          <span>Daftar Foto Tersimpan ({album.photos?.length || 0})</span>
          <span className="text-xs text-[#9AA8C4] font-normal">
            Gunakan tombol panah untuk mengatur urutan tampilan foto.
          </span>
        </h2>

        {!album.photos || album.photos.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#9AA8C4] bg-slate-900/30 rounded-2xl border border-slate-800">
            Belum ada foto dalam album ini. Silakan pilih dan unggah foto pada formulir di atas.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
            {album.photos.map((photo, index) => {
              const isCover = album.cover_photo_id === photo.id
              return (
                <div
                  key={photo.id}
                  className={`rounded-2xl overflow-hidden bg-[#0C1427] border transition-all flex flex-col justify-between ${
                    isCover ? 'border-[#2F6BFF] ring-1 ring-[#2F6BFF]' : 'border-slate-800'
                  }`}
                >
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || 'Foto dokumentasi'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isCover && (
                      <div className="absolute top-2 left-2 bg-[#2F6BFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                        Sampul Album
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Keterangan & Form Edit Caption */}
                  <div className="p-3 space-y-2 flex-1">
                    {editingCaptionId === photo.id ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={captionInput}
                          onChange={(e) => setCaptionInput(e.target.value)}
                          placeholder="Tulis keterangan foto..."
                          className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white focus:outline-none focus:border-[#2F6BFF]"
                          maxLength={200}
                        />
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px]"
                            onClick={() => setEditingCaptionId(null)}
                          >
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            className="h-6 text-[10px]"
                            onClick={() => handleSavePhotoCaption(photo.id)}
                          >
                            Simpan
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-[#E6ECF8] line-clamp-2 italic">
                          {photo.caption || <span className="text-slate-600">Tanpa keterangan</span>}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCaptionId(photo.id)
                            setCaptionInput(photo.caption || '')
                          }}
                          className="text-slate-500 hover:text-blue-400 p-0.5"
                          title="Ubah keterangan"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tombol Reorder & Aksi Foto */}
                  <div className="p-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMovePhoto(index, 'up')}
                        className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                        title="Geser ke depan"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === album.photos!.length - 1}
                        onClick={() => handleMovePhoto(index, 'down')}
                        className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                        title="Geser ke belakang"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isCover && (
                        <button
                          type="button"
                          onClick={() => handleSetCoverPhoto(photo.id)}
                          className="px-2 py-0.5 rounded text-[10px] text-blue-400 hover:bg-blue-950/40 border border-blue-900/60"
                        >
                          Jadikan Sampul
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setConfirmDeletePhoto(photo)}
                        className="p-1 rounded text-red-400 hover:bg-red-950/40"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog Konfirmasi Hapus Foto */}
      <ConfirmDialog
        isOpen={!!confirmDeletePhoto}
        title="Hapus Foto Dokumentasi?"
        description="Foto ini akan dihapus permanen dari penyimpanan server. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Foto"
        variant="danger"
        onConfirm={handleDeletePhoto}
        onClose={() => setConfirmDeletePhoto(null)}
      />
    </div>
  )
}
