import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Image as ImageIcon, Calendar } from 'lucide-react'
import { Container, PageHeader, EmptyState, ErrorState, Badge, Spinner, Button, Card, CardContent } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getPublicAlbums, type AlbumData } from '@/lib/api'
import { formatDate } from '@/lib/format'

export default function DocumentationPage() {
  useDocumentTitle('Dokumentasi Kegiatan')

  const [albums, setAlbums] = useState<AlbumData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const fetchAlbums = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const res = await getPublicAlbums(page)
      setAlbums(res.data)
      setLastPage(res.last_page)
    } catch {
      setAlbums([])
      setErrorMsg('Gagal memuat album dokumentasi.')
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  return (
        <div className="py-10 space-y-8">
          <Container>
            <PageHeader
              title="Dokumentasi Kegiatan"
              description="Arsip foto kegiatan warga dan pemuda Karang Taruna RT 001 RW 004."
            />

            <div className="pt-6">
              {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Spinner size="lg" />
                    <p className="text-sm text-[var(--text-muted)]">Memuat galeri dokumentasi...</p>
                  </div>
                  ) : errorMsg ? (
                  <ErrorState message={errorMsg} onRetry={fetchAlbums} />
                  ) : albums.length === 0 ? (
                  <EmptyState
                    icon={<ImageIcon className="w-7 h-7 text-[var(--accent)]" />}
                    title="Belum Ada Album Dokumentasi"
                    description="Dokumentasi foto kegiatan yang telah diterbitkan akan tampil di sini."
                  />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {albums.map((album) => (
                          <Link
                  key={album.slug}
                          to={`/dokumentasi/${album.slug}`}
                          className="group block rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                        >
                              <Card className="h-full overflow-hidden hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] transition-colors duration-150">
                                {/* Rasio sampul seragam 4:3 */}
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--bg-base)] border-b border-[var(--border-hairline)]">
                                  {album.cover_url ? (
                                    <img
                                      src={album.cover_url}
                                      alt={`Sampul ${album.title}`}
                                      width={600}
                                      height={450}
                                      loading="lazy"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-faint)] gap-2">
                                        <ImageIcon className="w-8 h-8" aria-hidden="true" />
                                        <span className="text-xs">Belum ada foto</span>
                                      </div>
                      )}
                                          <div className="absolute top-3 left-3">
                                            <Badge variant="info" className="bg-[var(--bg-base)] border-[var(--border-strong)] text-[var(--text-main)] tabular-nums">
                                              {album.photos_count} Foto
                                            </Badge>
                                          </div>
                                      </div>

                                          <CardContent className="p-5 space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] tabular-nums">
                                              <Calendar className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" aria-hidden="true" />
                                              <span>
                                                {album.taken_at ? formatDate(album.taken_at) : 'Tanggal tidak tercatat'}
                                              </span>
                                            </div>

                                              <h2 className="text-lg font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors duration-150 line-clamp-2">
                                                {album.title}
                                              </h2>

                                              {album.description && (
                                                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                                                    {album.description}
                                                  </p>
                      )}
                                        </CardContent>
                                      </Card>
                                    </Link>
                                  ))}
                                </div>
          )}
                            </div>

        {/* Paginasi */ }
        { lastPage > 1 && (
                          <div className="flex justify-center items-center gap-3 pt-8">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={page <= 1}
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                              Sebelumnya
                            </Button>
                            <span className="text-xs sm:text-sm text-[var(--text-muted)] tabular-nums">
                              Halaman {page} dari {lastPage}
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={page >= lastPage}
                              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                            >
                              Selanjutnya
                            </Button>
                          </div>
                        )}
                    </Container>
                  </div>
                  )
}
