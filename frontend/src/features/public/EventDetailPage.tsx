import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, ArrowLeft, Image as ImageIcon, ChevronRight } from 'lucide-react'
import { Container, Badge, Spinner, EmptyState } from '@/components/ui'
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
      <div className="py-32 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-[#9AA8C4]">Memuat informasi agenda...</p>
      </div>
    )
  }

  if (errorMsg || !event) {
    return (
      <div className="py-24">
        <Container size="narrow">
          <EmptyState
            icon={<Calendar className="w-10 h-10 text-red-400" />}
            title="Agenda Tidak Ditemukan"
            description={errorMsg || 'Agenda yang Anda cari tidak tersedia atau belum diterbitkan.'}
            action={
              <Link
                to="/agenda"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0C1427] border border-slate-800 text-sm font-semibold text-white hover:border-slate-700 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Daftar Agenda
              </Link>
            }
          />
        </Container>
      </div>
    )
  }

  return (
    <div className="py-12 space-y-10">
      <Container size="narrow">
        {/* Navigasi Balik */}
        <div className="mb-6">
          <Link
            to="/agenda"
            className="inline-flex items-center gap-2 text-sm text-[#9AA8C4] hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Semua Agenda
          </Link>
        </div>

        {/* Sampul Acara */}
        {event.cover_url && (
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-slate-800 mb-8 bg-slate-900 shadow-2xl">
            <img
              src={event.cover_url}
              alt={event.title}
              width={1200}
              height={675}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Konten Utama */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="info" className="bg-[#0C1427] text-[#22D3EE] border-slate-700">
              {event.category}
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {event.title}
          </h1>

          {/* Metadata Jadwal & Tempat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#0C1427]/80 border border-slate-800">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#2F6BFF] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider">
                  Waktu Pelaksanaan
                </span>
                <p className="text-sm font-medium text-white">
                  {formatDateTime(event.starts_at)}
                </p>
                {event.ends_at && (
                  <p className="text-xs text-slate-400">
                    s/d {formatDateTime(event.ends_at)}
                  </p>
                )}
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider">
                    Lokasi Kegiatan
                  </span>
                  <p className="text-sm font-medium text-white">{event.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Ringkasan & Deskripsi */}
          <div className="prose prose-invert max-w-none space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 text-blue-200 text-sm leading-relaxed font-medium">
              {event.summary}
            </div>

            <div className="text-base text-[#E6ECF8] leading-relaxed whitespace-pre-line pt-2">
              {event.description}
            </div>
          </div>

          {/* Album Dokumentasi Terkait jika Ada */}
          {event.albums && event.albums.length > 0 && (
            <div className="pt-10 border-t border-slate-800 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#2F6BFF]" />
                Dokumentasi Kegiatan Terkait
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.albums.map((alb) => (
                  <Link
                    key={alb.slug}
                    to={`/dokumentasi/${alb.slug}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-[#0C1427] border border-slate-800 hover:border-slate-700 transition group"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-800">
                      {alb.cover_url ? (
                        <img src={alb.cover_url} alt={alb.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white group-hover:text-[#2F6BFF] transition truncate">
                        {alb.title}
                      </h3>
                      <p className="text-xs text-[#9AA8C4] mt-0.5 line-clamp-1">{alb.description}</p>
                      <span className="text-[11px] text-[#22D3EE] mt-1 block">
                        {alb.photos_count} Foto
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}
