import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Image as ImageIcon, Calendar, ArrowRight } from 'lucide-react'
import { Container, PageHeader, EmptyState, Badge, Spinner } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getPublicAlbums, type AlbumData } from '@/lib/api'
import { formatDate } from '@/lib/format'

export default function DocumentationPage() {
  useDocumentTitle('Dokumentasi Kegiatan')

  const [albums, setAlbums] = useState<AlbumData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const fetchAlbums = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getPublicAlbums(page)
      setAlbums(res.data)
      setLastPage(res.last_page)
    } catch {
      setAlbums([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  return (
      <div className="py-10 space-y-10">
        <Container>
          <PageHeader
            title="Dokumentasi & Galeri Kegiatan"
            description="Koleksi foto dan rekaman momen kebersamaan warga serta pemuda Karang Taruna RT 001 RW 004."
          />

          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-[#9AA8C4]">Memuat galeri dokumentasi...</p>
            </div>
          ) : albums.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<ImageIcon className="w-10 h-10 text-[#2F6BFF]" />}
                title="Belum Ada Album Dokumentasi"
                description="Dokumentasi dan arsip foto kegiatan yang telah terlaksana akan ditampilkan di sini."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
              {albums.map((album) => (
                <article
                  key={album.slug}
                  className="group flex flex-col justify-between rounded-3xl bg-[#0C1427]/60 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-blue-950/20 overflow-hidden"
                >
                  <div>
                    {/* Foto Sampul Album */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-900 border-b border-slate-800">
                      {album.cover_url ? (
                        <img
                          src={album.cover_url}
                          alt={album.title}
                          width={600}
                          height={338}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 gap-2">
                          <ImageIcon className="w-10 h-10 opacity-30" />
                          <span className="text-xs text-slate-600">Belum ada foto</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge variant="info" className="bg-[#060B18]/90 text-white border-slate-700 backdrop-blur-md">
                          {album.photos_count} Foto
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-[#22D3EE] font-medium">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {album.taken_at ? formatDate(album.taken_at) : 'Tanggal tidak disetel'}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-white group-hover:text-[#2F6BFF] transition-colors line-clamp-2">
                        <Link to={`/dokumentasi/${album.slug}`}>{album.title}</Link>
                      </h2>

                      {album.description && (
                        <p className="text-sm text-[#9AA8C4] line-clamp-2 leading-relaxed">
                          {album.description}
                        </p>
                      )}

                      {album.event && (
                        <div className="text-xs text-slate-400 pt-1">
                          <span className="text-slate-500">Agenda:</span> {album.event.title}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <Link
                      to={`/dokumentasi/${album.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F6BFF] hover:text-blue-400 transition-colors"
                    >
                      Buka Album Foto
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Paginasi */}
          {lastPage > 1 && (
            <div className="flex justify-center items-center gap-3 pt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-[#0C1427] border border-slate-800 text-white disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span className="text-xs text-[#9AA8C4]">
                Halaman {page} dari {lastPage}
              </span>
              <button
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-[#0C1427] border border-slate-800 text-white disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </Container>
      </div>
      )
}
