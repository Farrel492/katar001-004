import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, Tag, ArrowRight } from 'lucide-react'
import { Container, PageHeader, EmptyState, ErrorState, Badge, Spinner, Button, Card } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getPublicEvents, type EventData } from '@/lib/api'

function getDateBlockParts(dateInput: string): { dayNum: string; monthShort: string; time: string } {
  try {
    const d = new Date(dateInput)
    if (Number.isNaN(d.getTime())) return { dayNum: '-', monthShort: '-', time: '-' }

    const dayNum = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(d)

    const monthShort = new Intl.DateTimeFormat('id-ID', {
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(d)

    const time =
      new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
        hour12: false,
      })
        .format(d)
        .replace(':', '.') + ' WIB'

    return { dayNum, monthShort, time }
  } catch {
    return { dayNum: '-', monthShort: '-', time: '-' }
  }
}

export default function AgendaPage() {
  useDocumentTitle('Agenda Kegiatan')

  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming')
  const [category, setCategory] = useState<string>('')
  const [events, setEvents] = useState<EventData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const upcomingTabRef = useRef<HTMLButtonElement | null>(null)
  const pastTabRef = useRef<HTMLButtonElement | null>(null)

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg(null)
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
      setErrorMsg('Gagal memuat daftar agenda kegiatan.')
    } finally {
      setIsLoading(false)
    }
  }, [scope, category, page])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, current: 'upcoming' | 'past') => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = current === 'upcoming' ? 'past' : 'upcoming'
      setScope(next)
      setPage(1)
      if (next === 'upcoming') {
        upcomingTabRef.current?.focus()
      } else {
        pastTabRef.current?.focus()
      }
    }
  }

  return (
        <div className="py-10 space-y-8">
          <Container>
            <PageHeader
              title="Agenda Kegiatan"
              description="Jadwal kegiatan mendatang dan arsip agenda warga RT 001 RW 004."
            />

              {/* Tab & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 pb-4 border-b border-[var(--border-hairline)]">
                <div
                  role="tablist"
                  aria-label="Filter waktu agenda"
                  className="inline-flex items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-[var(--radius-sm)] border border-[var(--border-hairline)] self-start"
                >
                  <button
                    ref={upcomingTabRef}
                    type="button"
                    role="tab"
                    id="tab-upcoming"
                    aria-selected={scope === 'upcoming'}
                    aria-controls="panel-agenda"
                    tabIndex={scope === 'upcoming' ? 0 : -1}
                    onClick={() => {
                      setScope('upcoming')
                      setPage(1)
                    }}
                    onKeyDown={(e) => handleTabKeyDown(e, 'upcoming')}
                    className={`px-4 py-2 min-h-[44px] rounded-[var(--radius-sm)] text-sm font-semibold transition-colors duration-150 cursor-pointer ${scope === 'upcoming'
                        ? 'bg-[var(--primary)] text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
                      }`}
                  >
                    Akan Datang
                  </button>
                  <button
                    ref={pastTabRef}
                    type="button"
                    role="tab"
                    id="tab-past"
                    aria-selected={scope === 'past'}
                    aria-controls="panel-agenda"
                    tabIndex={scope === 'past' ? 0 : -1}
                    onClick={() => {
                      setScope('past')
                      setPage(1)
                    }}
                    onKeyDown={(e) => handleTabKeyDown(e, 'past')}
                    className={`px-4 py-2 min-h-[44px] rounded-[var(--radius-sm)] text-sm font-semibold transition-colors duration-150 cursor-pointer ${scope === 'past'
                        ? 'bg-[var(--primary)] text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
                      }`}
                  >
                    Sudah Lewat
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value)
                      setPage(1)
                    }}
                    aria-label="Filter kategori kegiatan"
                    className="bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm text-[var(--text-main)] rounded-[var(--radius-sm)] px-3.5 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
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

              {/* Panel Daftar Acara */}
              <div
                id="panel-agenda"
                role="tabpanel"
                aria-labelledby={scope === 'upcoming' ? 'tab-upcoming' : 'tab-past'}
                className="pt-6"
              >
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                      <Spinner size="lg" />
                      <p className="text-sm text-[var(--text-muted)]">Memuat agenda kegiatan...</p>
                    </div>
                    ) : errorMsg ? (
                    <ErrorState message={errorMsg} onRetry={fetchEvents} />
                    ) : events.length === 0 ? (
                    <EmptyState
                      icon={<Calendar className="w-7 h-7 text-[var(--accent)]" />}
                      title={scope === 'upcoming' ? 'Belum ada agenda terjadwal.' : 'Belum ada arsip kegiatan selesai.'}
                      description={
                        scope === 'upcoming'
                          ? 'Jadwal kegiatan terbaru akan tampil di halaman ini setelah diterbitkan oleh pengurus.'
                          : 'Belum ada agenda sebelumnya yang tercatat pada filter ini.'
                      }
                    />
                    ) : (
                                <div className="space-y-4">
                                  {events.map((ev) => {
                                    const { dayNum, monthShort, time } = getDateBlockParts(ev.starts_at)
                                    return (
                  <Card
                    key={ev.id}
                    className="hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] transition-colors duration-150"
                  >
                    <article className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
                      {/* Blok Tanggal Tegas */}
                      <div className="flex sm:flex-col items-center justify-center sm:w-24 shrink-0 px-4 py-2.5 sm:py-3 rounded-[var(--radius-sm)] bg-[var(--bg-base)] border border-[var(--border-strong)] text-center gap-2 sm:gap-0.5">
                        <span className="text-2xl sm:text-3xl font-extrabold text-[var(--accent)] tabular-nums leading-none">
                          {dayNum}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          {monthShort}
                        </span>
                      </div>

                      {/* Info Utama */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="info">{ev.category}</Badge>
                          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-muted)] tabular-nums">
                            <Clock className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" aria-hidden="true" />
                            {time}
                          </span>
                          {ev.location && (
                            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-muted)]">
                              <MapPin className="w-3.5 h-3.5 text-[var(--text-faint)] shrink-0" aria-hidden="true" />
                              <span className="truncate">{ev.location}</span>
                            </span>
                          )}
                        </div>

                        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-main)] leading-snug">
                          <Link
                            to={`/agenda/${ev.slug}`}
                            className="hover:text-[var(--accent)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded"
                          >
                            {ev.title}
                          </Link>
                        </h2>

                        <p className="text-sm sm:text-base text-[var(--text-muted)] line-clamp-2 max-w-[68ch] leading-relaxed">
                          {ev.summary}
                        </p>
                      </div>

                                {/* Aksi */}
                                <div className="shrink-0">
                                  <Button variant="secondary" size="sm" to={`/agenda/${ev.slug}`}>
                                    Detail
                                    <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden="true" />
                                  </Button>
                                </div>
                              </article>
                            </Card>
                            )
              })}
                          </div>
          )}
                        </div>

        {/* Paginasi */}
                {lastPage > 1 && (
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
