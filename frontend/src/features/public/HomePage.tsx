import { useEffect, useState, useCallback } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Calendar, MapPin, ArrowRight, Image as ImageIcon, MessageSquare } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Badge,
  Container,
  Skeleton,
  ErrorState,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  getPublicEvents,
  getPublicFinanceSummary,
  getPublicAlbums,
  type EventData,
  type FinanceSummaryData,
  type AlbumData,
} from '@/lib/api'
import { formatDate, formatRupiah } from '@/lib/format'
import type { PublicOutletContext } from '@/app/layouts/PublicLayout'

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

function formatEventTime(dateInput: string): string {
  try {
    const d = new Date(dateInput)
    if (Number.isNaN(d.getTime())) return ''
    const time = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
      hour12: false,
    })
      .format(d)
      .replace(':', '.')
    return `${time} WIB`
  } catch {
    return ''
  }
}

function getCurrentJakartaMonthYear(): { month: number; year: number } {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).formatToParts(now)
  const month = Number(parts.find((p) => p.type === 'month')?.value || now.getMonth() + 1)
  const year = Number(parts.find((p) => p.type === 'year')?.value || now.getFullYear())
  return { month, year }
}

export default function HomePage() {
  useDocumentTitle('Beranda')
  const outletCtx = useOutletContext<PublicOutletContext | null>()
  const profile = outletCtx?.profile ?? null

  const { month: currentMonth, year: currentYear } = getCurrentJakartaMonthYear()

  // Agenda Terdekat
  const [events, setEvents] = useState<EventData[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)

  // Kas Terbuka
  const [finance, setFinance] = useState<FinanceSummaryData | null>(null)
  const [financeLoading, setFinanceLoading] = useState(true)
  const [financeError, setFinanceError] = useState<string | null>(null)

  // Dokumentasi Terbaru
  const [albums, setAlbums] = useState<AlbumData[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(true)

  const loadEvents = useCallback(async () => {
    try {
      setEventsLoading(true)
      setEventsError(null)
      const res = await getPublicEvents({ scope: 'upcoming', page: 1 })
      setEvents((res.data || []).slice(0, 3))
    } catch {
      setEventsError('Agenda terdekat belum dapat dimuat saat ini.')
    } finally {
      setEventsLoading(false)
    }
  }, [])

  const loadFinance = useCallback(async () => {
    try {
      setFinanceLoading(true)
      setFinanceError(null)
      const res = await getPublicFinanceSummary(currentYear)
      setFinance(res)
    } catch {
      setFinanceError('Ringkasan kas belum dapat dimuat saat ini.')
    } finally {
      setFinanceLoading(false)
    }
  }, [currentYear])

  const loadAlbums = useCallback(async () => {
    try {
      setAlbumsLoading(true)
      const res = await getPublicAlbums(1)
      setAlbums((res.data || []).slice(0, 4))
    } catch {
      // Sembunyikan bagian dokumentasi jika gagal atau kosong
      setAlbums([])
    } finally {
      setAlbumsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
    loadFinance()
    loadAlbums()
  }, [loadEvents, loadFinance, loadAlbums])

  const orgName = profile?.name || 'Karang Taruna RT 001 RW 004'
  const regionText =
    profile?.region_label
      ? `${profile.region_label} • Kel. Jatibening Baru, Kec. Pondok Gede, Bekasi`
      : 'RT 001 RW 004 • Kel. Jatibening Baru, Kec. Pondok Gede, Bekasi'

  const currentMonthSummary = finance?.monthly?.find((m) => m.month === currentMonth)

  return (
    <div className="space-y-16 sm:space-y-20 pb-8">
      {/* 1. HERO (Bobot visual tertinggi, tanpa gambar stok, tanpa glow/gradasi mencolok) */}
      <section className="bg-subtle-grid border-b border-[var(--border-hairline)] py-14 sm:py-20">
        <Container>
          <div className="max-w-3xl space-y-6">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
              {regionText}
            </p>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-[var(--text-main)] tracking-tight leading-[1.15]">
              {orgName}
            </h1>

            <p className="text-[17px] sm:text-lg text-[var(--text-muted)] leading-[1.65] max-w-[65ch]">
              Pusat informasi resmi agenda kegiatan, laporan kas terbuka, dan saluran aspirasi warga tanpa perlu masuk akun.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="lg" variant="primary" to="/agenda">
                Lihat Agenda
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="secondary" to="/aspirasi">
                Kirim Aspirasi
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. AGENDA TERDEKAT */}
      <section aria-labelledby="heading-agenda">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 id="heading-agenda" className="text-2xl sm:text-3xl font-bold text-[var(--text-main)] tracking-tight">
                Agenda Terdekat
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-muted)] mt-1">
                Jadwal kegiatan warga yang akan datang.
              </p>
            </div>
            <Link
              to="/agenda"
              className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-[var(--accent)] hover:underline self-start sm:self-auto"
            >
              Semua agenda
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {
            eventsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" >
                {
                  [0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="p-6 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3"
                    >
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))
                }
              </div>
            ) : eventsError ? (
              <ErrorState message={eventsError} onRetry={loadEvents} />
            ) : events.length === 0 ? (
              <div className="p-6 sm:p-8 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
                <p className="text-base text-[var(--text-muted)]">Belum ada agenda terjadwal.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {events.map((ev) => (
                  <Link
                    key={ev.id}
                    to={`/agenda/${ev.slug}`}
                    className="group block rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                  >
                    <Card className="h-full hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] transition-colors duration-150">
                      <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="info">{ev.category}</Badge>
                          </div>

                          <h3 className="text-lg font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors duration-150 leading-snug">
                            {ev.title}
                          </h3>

                          <p className="text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                            {ev.summary}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-[var(--border-hairline)] space-y-1.5 text-xs sm:text-sm text-[var(--text-muted)]">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[var(--accent)] shrink-0" aria-hidden="true" />
                            <span className="tabular-nums">
                              {formatDate(ev.starts_at)}
                              {formatEventTime(ev.starts_at) ? ` • ${formatEventTime(ev.starts_at)}` : ''}
                            </span>
                          </div>
                          {ev.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[var(--text-faint)] shrink-0" aria-hidden="true" />
                              <span className="truncate">{ev.location}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
        </Container>
      </section>

      {/* 3. KAS TERBUKA */}
      <section aria-labelledby="heading-kas">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 id="heading-kas" className="text-2xl sm:text-3xl font-bold text-[var(--text-main)] tracking-tight">
                Kas Terbuka
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-muted)] mt-1">
                Ringkasan kas resmi yang telah diterbitkan untuk warga.
              </p>
            </div>
            <Link
              to="/keuangan"
              className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-[var(--accent)] hover:underline self-start sm:self-auto"
            >
              Lihat rincian keuangan
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {financeLoading ? (
            <div className="p-6 sm:p-8 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : financeError ? (
            <ErrorState message={financeError} onRetry={loadFinance} />
          ) : (
            <Card featured>
              <CardContent className="p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                      Saldo Kas Berjalan
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-[var(--accent)] tabular-nums block">
                      {formatRupiah(finance?.balance ?? 0)}
                    </span>
                    <span className="text-xs text-[var(--text-faint)] block">
                      {finance?.last_published_at
                        ? `Data per ${formatDate(finance.last_published_at)}`
                        : 'Belum ada transaksi terbit.'}
                    </span>
                  </div>

                  <div className="space-y-1 md:border-l md:border-[var(--border-hairline)] md:pl-8">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                      Pemasukan ({MONTH_NAMES[currentMonth - 1]} {currentYear})
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-[var(--success)] tabular-nums block">
                      + {formatRupiah(currentMonthSummary?.income ?? 0)}
                    </span>
                    <span className="text-xs text-[var(--text-faint)] block">
                      Transaksi terbit bulan berjalan
                    </span>
                  </div>

                  <div className="space-y-1 md:border-l md:border-[var(--border-hairline)] md:pl-8">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                      Pengeluaran ({MONTH_NAMES[currentMonth - 1]} {currentYear})
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-[var(--danger-text)] tabular-nums block">
                      - {formatRupiah(currentMonthSummary?.expense ?? 0)}
                    </span>
                    <span className="text-xs text-[var(--text-faint)] block">
                      Transaksi terbit bulan berjalan
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </Container>
      </section>

      {/* 4. DOKUMENTASI TERBARU (Sembunyikan bila kosong) */}
      {(albumsLoading || albums.length > 0) && (
        <section aria-labelledby="heading-dokumentasi">
          <Container>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <h2
                  id="heading-dokumentasi"
                  className="text-2xl sm:text-3xl font-bold text-[var(--text-main)] tracking-tight"
                >
                  Dokumentasi Terbaru
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-muted)] mt-1">
                  Foto kegiatan lingkungan yang telah diterbitkan.
                </p>
              </div>
              <Link
                to="/dokumentasi"
                className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-[var(--accent)] hover:underline self-start sm:self-auto"
              >
                Semua dokumentasi
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            {albumsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] overflow-hidden"
                  >
                    <Skeleton className="w-full aspect-[4/3] rounded-none" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {albums.map((album) => (
                  <Link
                    key={album.id}
                    to={`/dokumentasi/${album.slug}`}
                    className="group block rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                  >
                    <Card className="h-full overflow-hidden hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] transition-colors duration-150">
                      <div className="aspect-[4/3] w-full bg-[var(--bg-base)] border-b border-[var(--border-hairline)] overflow-hidden flex items-center justify-center">
                        {album.cover_url ? (
                          <img
                            src={album.cover_url}
                            alt={`Sampul ${album.title}`}
                            width={400}
                            height={300}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon
                            className="w-8 h-8 text-[var(--text-faint)]"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <CardContent className="p-4 space-y-1.5">
                        <h3 className="text-base font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors duration-150 line-clamp-1">
                          {album.title}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] tabular-nums">
                          {album.taken_at ? formatDate(album.taken_at) : 'Dokumentasi kegiatan'} &bull;{' '}
                          {album.photos_count} foto
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </Container>
        </section>
      )}

      {/* 5. AJAKAN ASPIRASI */}
      <section aria-labelledby="heading-aspirasi">
        <Container>
          <Card>
            <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-[65ch]">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                  <span>Saluran Aspirasi Warga</span>
                </div>
                <h2 id="heading-aspirasi" className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">
                  Punya saran atau usulan untuk lingkungan?
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                  Kirimkan masukan langsung tanpa perlu masuk akun, dan nama maupun kontak boleh dikosongkan. Setelah mengirim, simpan kode pelacakan yang muncul untuk memantau tanggapan pengurus kapan saja.
                </p>
              </div>

              <div className="shrink-0">
                <Button variant="secondary" size="lg" to="/aspirasi">
                  Kirim Aspirasi
                  <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    </div>
  )
}
