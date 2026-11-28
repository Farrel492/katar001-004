import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, Tag, ArrowRight } from 'lucide-react'
import { Container, PageHeader, EmptyState, Badge, Spinner } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getPublicEvents, type EventData } from '@/lib/api'
import { formatDateTime } from '@/lib/format'

export default function AgendaPage() {
  useDocumentTitle('Agenda Kegiatan')

  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming')
  const [category, setCategory] = useState<string>('')
  const [events, setEvents] = useState<EventData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getPublicEvents({
        scope,
        category: category || undefined,
        page,
      })
      setEvents(res.data)
      setLastPage(res.last_page)
    } catch {
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }, [scope, category, page])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return (
      <div className="py-10 space-y-10">
        <Container>
          <PageHeader
            title="Agenda & Jadwal Kegiatan"
            description="Informasi rencana kegiatan kepemudaan, kerja bakti, dan agenda warga di lingkungan Karang Taruna RT 001 RW 004."
          />

          {/* Tab & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 bg-[#0C1427] p-1.5 rounded-2xl border border-slate-800/80">
              <button
                onClick={() => {
                  setScope('upcoming')
                  setPage(1)
                }}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${scope === 'upcoming'
                    ? 'bg-[#2F6BFF] text-white shadow-lg shadow-blue-600/30'
                    : 'text-[#9AA8C4] hover:text-white hover:bg-slate-800/50'
                  }`}
              >
                Akan Datang
              </button>
              <button
                onClick={() => {
                  setScope('past')
                  setPage(1)
                }}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${scope === 'past'
                    ? 'bg-[#2F6BFF] text-white shadow-lg shadow-blue-600/30'
                    : 'text-[#9AA8C4] hover:text-white hover:bg-slate-800/50'
                  }`}
              >
                Sudah Terlaksana
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#9AA8C4]" />
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter kategori kegiatan"
                className="bg-[#0C1427] border border-slate-800 text-sm text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#2F6BFF]"
              >
                <option value="">Semua Kategori</option>
                <option value="Kegiatan">Kegiatan Umum</option>
                <option value="Bakti Sosial">Bakti Sosial</option>
                <option value="Rapat">Rapat</option>
                <option value="Olahraga">Olahraga</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Daftar Acara */}
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-[#9AA8C4]">Memuat agenda kegiatan...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<Calendar className="w-10 h-10 text-[#2F6BFF]" />}
                title={scope === 'upcoming' ? 'Tidak Ada Agenda Mendatang' : 'Belum Ada Arsip Kegiatan Selesai'}
                description={
                  scope === 'upcoming'
                    ? 'Saat ini belum ada jadwal kegiatan baru yang diumumkan. Pantau terus halaman ini untuk pembaruan berikutnya.'
                    : 'Belum ada agenda sebelumnya yang tercatat pada filter ini.'
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {events.map((ev) => (
                <article
                  key={ev.id}
                  className="group flex flex-col justify-between rounded-3xl bg-[#0C1427]/60 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-blue-950/20 overflow-hidden"
                >
                  <div>
                    {/* Sampul Acara */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-900 border-b border-slate-800/80">
                      {ev.cover_url ? (
                        <img
                          src={ev.cover_url}
                          alt={ev.title}
                          width={600}
                          height={338}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <Calendar className="w-12 h-12 opacity-30" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge variant="info" className="bg-[#060B18]/90 text-[#22D3EE] border-slate-700 backdrop-blur-md">
                          {ev.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-[#22D3EE] font-medium">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatDateTime(ev.starts_at)}</span>
                      </div>

                      <h2 className="text-lg font-bold text-white group-hover:text-[#2F6BFF] transition-colors line-clamp-2">
                        <Link to={`/agenda/${ev.slug}`}>{ev.title}</Link>
                      </h2>

                      <p className="text-sm text-[#9AA8C4] line-clamp-3 leading-relaxed">
                        {ev.summary}
                      </p>

                      {ev.location && (
                        <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="line-clamp-1">{ev.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <Link
                      to={`/agenda/${ev.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F6BFF] hover:text-blue-400 transition-colors"
                    >
                      Lihat Detail Acara
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
