import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Image as ImageIcon, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Container, Spinner, EmptyState, Button } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getPublicAlbumDetail, type AlbumData } from '@/lib/api'
import { formatDate } from '@/lib/format'

export default function AlbumDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [album, setAlbum] = useState<AlbumData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Lightbox State & Focus Management
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const lightboxRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

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

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus()
    })
  }, [])

  // Navigasi Keyboard & Focus Trap Lightbox (Esc, ArrowLeft, ArrowRight, Tab)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null || !album || !album.photos) return
      const total = album.photos.length

      if (e.key === 'Escape') {
        e.preventDefault()
        closeLightbox()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : total - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setLightboxIndex((prev) => (prev !== null && prev < total - 1 ? prev + 1 : 0))
      } else if (e.key === 'Tab' && lightboxRef.current) {
        const focusables = Array.from(
          lightboxRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          ),
        )
        if (focusables.length === 0) {
          e.preventDefault()
          return
        }
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [lightboxIndex, album, closeLightbox],
  )

  useEffect(() => {
    if (lightboxIndex !== null) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      const timer = window.setTimeout(() => {
        const closeBtn = lightboxRef.current?.querySelector<HTMLButtonElement>('button')
        closeBtn?.focus()
      }, 20)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
    document.body.style.overflow = ''
    return undefined
  }, [lightboxIndex, handleKeyDown])

  if (isLoading) {
    return (
        <div className="py-28 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[var(--text-muted)]">Memuat foto dokumentasi...</p>
        </div>
        )
  }

        if (errorMsg || !album) {
    return (
          <div className="py-20">
            <Container size="narrow">
              <EmptyState
                icon={<ImageIcon className="w-8 h-8 text-[var(--danger-text)]" />}
                title="Album Tidak Ditemukan"
                description={errorMsg || 'Album dokumentasi tidak tersedia atau belum diterbitkan.'}
                action={
                    <Button variant="secondary" to="/dokumentasi">
                      Kembali ke Daftar Dokumentasi
              </Button>
            }
          />
          </Container>
        </div>
        )
  }

        const photos = album.photos || []
        const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null

        return (
          <div className="py-10 space-y-8">
            <Container>
                  {/* Breadcrumb Sederhana */}
                  <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-[var(--text-muted)]">
                    <Link to="/" className="hover:text-[var(--accent)] min-h-[44px] inline-flex items-center">
                      Beranda
                    </Link>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--text-faint)]" aria-hidden="true" />
                  <Link to="/dokumentasi" className="hover:text-[var(--accent)] min-h-[44px] inline-flex items-center">
                    Dokumentasi
                  </Link>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--text-faint)]" aria-hidden="true" />
                  <span className="text-[var(--text-main)] font-medium truncate max-w-[220px] sm:max-w-sm">
                    {album.title}
                  </span>
                </nav>

                {/* Informasi Album */}
                    <div className="space-y-3 max-w-[70ch]">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--text-muted)] tabular-nums">
                        <Calendar className="w-4 h-4 text-[var(--accent)] shrink-0" aria-hidden="true" />
                        <span>{album.taken_at ? formatDate(album.taken_at) : 'Tanggal tidak tercatat'}</span>
                        <span aria-hidden="true">&bull;</span>
                        <span>{photos.length} Foto</span>
                      </div>

                        <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight leading-tight">
                          {album.title}
                        </h1>

                        {album.description && (
            <p className="text-base sm:text-[17px] text-[var(--text-muted)] leading-relaxed">
              {album.description}
            </p>
                        )}

                        {album.event && (
                            <p className="text-sm text-[var(--text-muted)] pt-1">
                              Terkait agenda:{' '}
                              <Link
                                to={`/agenda/${album.event.slug}`}
                                className="text-[var(--accent)] hover:underline font-semibold"
                              >
                                {album.event.title}
                              </Link>
            </p>
          )}
                    </div>

                    {/* Galeri Grid Foto */}
                    {photos.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<ImageIcon className="w-7 h-7 text-[var(--text-muted)]" />}
            title="Belum Ada Foto"
            description="Belum ada foto yang ditampilkan di album ini."
          />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-6">
                        {photos.map((photo, index) => (
                          <button
                            type="button"
                            key={photo.id}
                            onClick={(e) => {
                              triggerRef.current = e.currentTarget
                              setLightboxIndex(index)
                            }}
                            className="group relative aspect-square rounded-[var(--radius-lg)] overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer"
                            aria-label={`Buka foto: ${photo.caption || `Foto ke-${index + 1}`}`}
                          >
                            <img
                              src={photo.photo_url}
                              alt={photo.caption || `${album.title} - Foto ${index + 1}`}
                              width={400}
                              height={400}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                            {photo.caption && (
                                <div className="absolute inset-x-0 bottom-0 bg-black/80 px-3 py-2 text-left">
                                  <p className="text-xs text-[var(--text-main)] line-clamp-1">{photo.caption}</p>
                                </div>
                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Lightbox Aksesibel (Esc, ArrowLeft/Right, Focus Trap, Return Focus, 44px Buttons) */}
                        {lightboxIndex !== null && activePhoto && (
                          <div
                            ref={lightboxRef}
                            tabIndex={-1}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Penampil Foto Dokumentasi"
                            className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 outline-none"
                          >
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-xs sm:text-sm text-[var(--text-muted)] tabular-nums">
                                    Foto {lightboxIndex + 1} dari {photos.length}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={closeLightbox}
                                    className="min-w-[44px] min-h-[44px] px-3 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                                    aria-label="Tutup penampil foto"
                                  >
                                    <X className="w-5 h-5" aria-hidden="true" />
                                    <span>Tutup</span>
                                  </button>
                                </div>

                                <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 min-h-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1))
                                    }
                                    className="absolute left-2 sm:left-4 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-main)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                                    aria-label="Foto sebelumnya"
                                  >
                                    <ChevronLeft className="w-6 h-6" aria-hidden="true" />
                                  </button>

                                  <img
                                    src={activePhoto.photo_url}
                                    alt={activePhoto.caption || `${album.title} - Foto ${lightboxIndex + 1}`}
                                    className="max-h-full max-w-full object-contain rounded-[var(--radius-sm)] select-none"
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0))
                                    }
                                    className="absolute right-2 sm:right-4 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-main)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                                    aria-label="Foto berikutnya"
                                  >
                                    <ChevronRight className="w-6 h-6" aria-hidden="true" />
                                  </button>
                                </div>

                                  <div className="text-center py-2">
                                    {activePhoto.caption ? (
                                        <p className="text-sm text-[var(--text-main)] max-w-xl mx-auto px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] inline-block">
                                          {activePhoto.caption}
                                        </p>
                                        ) : (
                                        <p className="text-xs text-[var(--text-muted)]">
                                          Gunakan tombol panah kiri/kanan pada keyboard untuk berpindah foto.
                                        </p>
              )}
                                      </div>
          </div>
        )}
                                </Container>
                            </div>
                            )
}
