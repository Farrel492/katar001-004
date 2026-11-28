import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Image as ImageIcon, Calendar, ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Container, Spinner, EmptyState } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getPublicAlbumDetail, type AlbumData } from '@/lib/api'
import { formatDate } from '@/lib/format'

export default function AlbumDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [album, setAlbum] = useState<AlbumData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const lightboxRef = useRef<HTMLDivElement>(null)

  useDocumentTitle(album ? album.title : 'Galeri Album')

  useEffect(() => {
    if (!slug) return
    setIsLoading(true)
    setErrorMsg(null)

    getPublicAlbumDetail(slug)
      .then((res) => {
        setAlbum(res.data)
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : 'Album tidak ditemukan.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [slug])

  // Navigasi Keyboard Lightbox (Esc, Left, Right)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null || !album || !album.photos) return

      if (e.key === 'Escape') {
        setLightboxIndex(null)
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : album.photos!.length - 1))
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < album.photos!.length - 1 ? prev + 1 : 0))
      }
    },
    [lightboxIndex, album]
  )

  useEffect(() => {
    if (lightboxIndex !== null) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      lightboxRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [lightboxIndex, handleKeyDown])

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-[#9AA8C4]">Memuat foto dokumentasi...</p>
      </div>
    )
  }

  if (errorMsg || !album) {
    return (
      <div className="py-24">
        <Container size="narrow">
          <EmptyState
            icon={<ImageIcon className="w-10 h-10 text-red-400" />}
            title="Album Tidak Ditemukan"
            description={errorMsg || 'Album dokumentasi tidak tersedia atau belum diterbitkan.'}
            action={
              <Link
                to="/dokumentasi"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0C1427] border border-slate-800 text-sm font-semibold text-white hover:border-slate-700 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Daftar Dokumentasi
              </Link>
            }
          />
        </Container>
      </div>
    )
  }

  const photos = album.photos || []
  const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null

  return (
    <div className="py-12 space-y-10">
      <Container>
        {/* Navigasi Balik */}
        <div className="mb-6">
          <Link
            to="/dokumentasi"
            className="inline-flex items-center gap-2 text-sm text-[#9AA8C4] hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Semua Album
          </Link>
        </div>

        {/* Informasi Album */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-[#22D3EE] font-medium">
            <Calendar className="w-3.5 h-3.5" />
            {album.taken_at ? formatDate(album.taken_at) : 'Tanggal tidak disetel'}
            <span className="text-slate-600">•</span>
            <span>{photos.length} Foto Tersimpan</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {album.title}
          </h1>

          {album.description && (
            <p className="text-base text-[#9AA8C4] leading-relaxed">{album.description}</p>
          )}

          {album.event && (
            <div className="pt-1">
              <span className="text-xs text-slate-500">Terkait agenda: </span>
              <Link
                to={`/agenda/${album.event.slug}`}
                className="text-xs text-[#2F6BFF] hover:underline font-semibold"
              >
                {album.event.title}
              </Link>
            </div>
          )}
        </div>

        {/* Galeri Grid Foto */}
        {photos.length === 0 ? (
          <div className="py-16 text-center text-[#9AA8C4] bg-[#0C1427]/40 rounded-3xl border border-slate-800">
            Belum ada foto yang ditampilkan di album ini.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-6">
            {photos.map((photo, index) => (
              <button
                type="button"
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-[#2F6BFF] transition-all focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                aria-label={`Buka foto: ${photo.caption || `Foto ke-${index + 1}`}`}
              >
                <img
                  src={photo.photo_url}
                  alt={photo.caption || `${album.title} - Foto ${index + 1}`}
                  width={400}
                  height={400}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white line-clamp-1 italic text-left">{photo.caption}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ============================================================== */}
        {/* LIGHTBOX MODAL AKSESIBEL (Esc, Arrow Left/Right)              */}
        {/* ============================================================== */}
        {lightboxIndex !== null && activePhoto && (
          <div
            ref={lightboxRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Penampil Foto Dokumentasi"
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 outline-none animate-in fade-in duration-200"
          >
            {/* Header Lightbox */}
            <div className="flex items-center justify-between z-10">
              <span className="text-xs text-[#9AA8C4]">
                Foto {lightboxIndex + 1} dari {photos.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-xl bg-slate-900/80 text-white hover:bg-slate-800 transition"
                aria-label="Tutup penampil foto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Foto Tengah & Tombol Geser */}
            <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 min-h-0">
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1))
                }
                className="absolute left-2 sm:left-4 z-10 p-3 rounded-2xl bg-black/60 text-white hover:bg-black/80 transition"
                aria-label="Foto sebelumnya"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <img
                src={activePhoto.photo_url}
                alt={activePhoto.caption || `${album.title} - Foto ${lightboxIndex + 1}`}
                className="max-h-full max-w-full object-contain rounded-xl select-none"
              />

              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0))
                }
                className="absolute right-2 sm:right-4 z-10 p-3 rounded-2xl bg-black/60 text-white hover:bg-black/80 transition"
                aria-label="Foto berikutnya"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Footer Keterangan Foto */}
            <div className="text-center py-2 z-10">
              {activePhoto.caption ? (
                <p className="text-sm text-white max-w-xl mx-auto px-4 py-1.5 rounded-xl bg-black/60 inline-block">
                  {activePhoto.caption}
                </p>
              ) : (
                <p className="text-xs text-slate-500">Gunakan panah kiri/kanan pada keyboard untuk navigasi.</p>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}
