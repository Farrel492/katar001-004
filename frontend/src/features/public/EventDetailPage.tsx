import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, Image as ImageIcon, ChevronRight } from 'lucide-react'
import { Container, Badge, Spinner, EmptyState, Button, Card } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getPublicEventDetail, type EventData } from '@/lib/api'
import { formatDateTime } from '@/lib/format'

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<EventData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useDocumentTitle(event ? event.title : 'Detail Agenda')

  useEffect(() => {
    if (!slug) return
    setIsLoading(true)
    setErrorMsg(null)

    getPublicEventDetail(slug)
      .then((res) => {
        setEvent(res.data)
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : 'Agenda tidak ditemukan.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [slug])

  if (isLoading) {
    return (
        <div className="py-28 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[var(--text-muted)]">Memuat informasi agenda...</p>
        </div>
        )
  }

        if (errorMsg || !event) {
    return (
          <div className="py-20">
            <Container size="narrow">
              <EmptyState
                icon={<Calendar className="w-8 h-8 text-[var(--danger-text)]" />}
                title="Agenda Tidak Ditemukan"
                description={errorMsg || 'Agenda yang Anda cari tidak tersedia atau belum diterbitkan.'}
                action={
                    <Button variant="secondary" to="/agenda">
                      Kembali ke Daftar Agenda
              </Button>
            }
          />
          </Container>
        </div>
        )
  }

        return (
          <div className="py-10 space-y-8">
            <Container size="narrow">
                  {/* Breadcrumb Sederhana */}
                  <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-[var(--text-muted)]">
                    <Link to="/" className="hover:text-[var(--accent)] min-h-[44px] inline-flex items-center">
                      Beranda
                    </Link>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--text-faint)]" aria-hidden="true" />
                  <Link to="/agenda" className="hover:text-[var(--accent)] min-h-[44px] inline-flex items-center">
                    Agenda
                  </Link>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--text-faint)]" aria-hidden="true" />
                  <span className="text-[var(--text-main)] font-medium truncate max-w-[220px] sm:max-w-sm">
                    {event.title}
                  </span>
                </nav>

                    <article className="space-y-6">
                      <div className="space-y-3">
                        <Badge variant="info">{event.category}</Badge>
                        <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight leading-tight">
                          {event.title}
                        </h1>
                      </div>

                                  {/* Info Penting di Atas: Kapan & Di Mana */}
                                  <Card featured>
                                    <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" aria-hidden="true" />
                                        <div className="space-y-0.5">
                                          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                                            Kapan
                                          </span>
                                          <p className="text-sm sm:text-base font-semibold text-[var(--text-main)] tabular-nums">
                                            {formatDateTime(event.starts_at)}
                                          </p>
                                          {event.ends_at && (
                                            <p className="text-xs text-[var(--text-muted)] tabular-nums">
                                              s/d {formatDateTime(event.ends_at)}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" aria-hidden="true" />
                                        <div className="space-y-0.5">
                                            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                                              Di Mana
                                            </span>
                                            <p className="text-sm sm:text-base font-semibold text-[var(--text-main)]">
                                              {event.location || 'Menyesuaikan / Lihat keterangan di bawah'}
                                            </p>
                                        </div>
                                      </div>
                                </div>
          </Card>

                                {/* Sampul Acara (jika ada) */}
                                {event.cover_url && (
                                  <div className="aspect-video w-full rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                                    <img
                                      src={event.cover_url}
                                      alt={`Sampul ${event.title}`}
                                      width={1200}
                                      height={675}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}

                                  {/* Ringkasan & Deskripsi di Bawah */}
                                  <div className="space-y-4 max-w-[70ch]">
                                    <p className="text-base sm:text-lg font-medium text-[var(--text-main)] leading-relaxed">
                                      {event.summary}
                                    </p>
                                    <div className="text-base sm:text-[17px] text-[var(--text-muted)] leading-[1.7] whitespace-pre-line">
                                      {event.description}
                                    </div>
                                  </div>

                                  {/* Album Dokumentasi Terkait */}
                                  {event.albums && event.albums.length > 0 && (
                                        <div className="pt-8 border-t border-[var(--border-hairline)] space-y-4">
                                          <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                                            <ImageIcon className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />
                                            Dokumentasi Kegiatan Terkait
                                          </h2>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {event.albums.map((alb) => (
                                              <Link
                                                key={alb.slug}
                                                to={`/dokumentasi/${alb.slug}`}
                                                className="flex items-center gap-4 p-4 min-h-[72px] rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] transition-colors group"
                                              >
                                                  <div className="w-16 h-16 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--bg-base)] shrink-0 border border-[var(--border-hairline)]">
                                                    {alb.cover_url ? (
                        <img
                          src={alb.cover_url}
                          alt={alb.title}
                          width={64}
                          height={64}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                                                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-faint)]">
                          <ImageIcon className="w-6 h-6" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors truncate">
                        {alb.title}
                      </h3>
                      <span className="text-xs text-[var(--text-muted)] mt-1 block tabular-nums">
                        {alb.photos_count} foto
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-faint)] shrink-0" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          )}
                                              </article>
      </Container>
                                        </div>
                                        )
}
