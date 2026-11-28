import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Wallet, ArrowRight, Bell, Activity } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  Badge,
  Skeleton,
  ErrorState,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAdminAuth } from '@/features/admin/context/AdminAuthContext'
import { getAdminDashboard, type AdminDashboardData } from '@/lib/api'
import { formatDate, formatDateTime, formatRupiah } from '@/lib/format'

export default function AdminDashboardPage() {
  useDocumentTitle('Dashboard Admin', true)
  const { currentUser } = useAdminAuth()

  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      const res = await getAdminDashboard()
      setData(res)
    } catch {
      setErrorMsg('Gagal memuat ringkasan dashboard admin.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const displayName = currentUser?.name || currentUser?.username || 'Pengurus'

  type AttentionItem = {
    label: string
    to: string
    variant: 'info' | 'draft' | 'warning'
  }

  const attentionItems: AttentionItem[] = data
    ? [
      ...(data.attention.aspirations_new > 0
        ? [{
          label: `${data.attention.aspirations_new} aspirasi baru menunggu ditinjau`,
          to: '/admin/aspirasi',
          variant: 'info' as const,
        }]
        : []),
      ...(data.attention.events_draft > 0
        ? [{
          label: `${data.attention.events_draft} agenda belum terbit`,
          to: '/admin/agenda',
          variant: 'draft' as const,
        }]
        : []),
      ...(data.attention.albums_draft > 0
        ? [{
          label: `${data.attention.albums_draft} album galeri belum terbit`,
          to: '/admin/galeri',
          variant: 'draft' as const,
        }]
        : []),
      ...(data.attention.finance_draft > 0
        ? [{
          label: `${data.attention.finance_draft} transaksi kas draft`,
          to: '/admin/keuangan',
          variant: 'warning' as const,
        }]
        : []),
    ]
    : []

  return (
      <div className="space-y-6">
        <PageHeader
          title={`Halo, ${displayName}`}
          description="Ringkasan item yang menunggu tindakan, jadwal terdekat, posisi kas, dan aktivitas terbaru."
        />

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : errorMsg || !data ? (
          <ErrorState message={errorMsg || 'Data dashboard tidak tersedia.'} onRetry={loadDashboard} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Perlu Perhatian */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                  Perlu Perhatian
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                {attentionItems.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Tidak ada yang menunggu.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {attentionItems.map((item) => (
                      <li key={item.label}>
                        <Link
                          to={item.to}
                          className="flex items-center justify-between gap-3 px-4 py-3 min-h-[44px] rounded-[var(--radius-sm)] bg-[var(--bg-base)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Badge variant={item.variant}>Periksa</Badge>
                            <span className="text-sm font-medium text-[var(--text-main)] truncate">
                              {item.label}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* 2. Kas Ringkas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                  Kas Ringkas
                </CardTitle>
                <Link
                  to="/admin/keuangan"
                  className="text-xs font-semibold text-[var(--accent)] hover:underline min-h-[44px] inline-flex items-center"
                >
                  Kelola Kas
                </Link>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                    Saldo Kas Berjalan
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[var(--accent)] tabular-nums block mt-1">
                    {formatRupiah(data.finance.balance)}
                  </span>
                  <span className="text-xs text-[var(--text-faint)] block mt-1">
                    {data.finance.last_published_at
                      ? `Data per ${formatDate(data.finance.last_published_at)}`
                      : 'Belum ada transaksi terbit.'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-hairline)]">
                  <div>
                    <span className="text-xs text-[var(--text-muted)] block">Masuk Bulan Ini</span>
                    <span className="text-base font-bold text-[var(--success)] tabular-nums">
                      + {formatRupiah(data.finance.income_month)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--text-muted)] block">Keluar Bulan Ini</span>
                    <span className="text-base font-bold text-[var(--danger-text)] tabular-nums">
                      - {formatRupiah(data.finance.expense_month)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Agenda Terdekat */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                  Agenda Terdekat
                </CardTitle>
                <Link
                  to="/admin/agenda"
                  className="text-xs font-semibold text-[var(--accent)] hover:underline min-h-[44px] inline-flex items-center"
                >
                  Kelola Agenda
                </Link>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                {data.upcoming_events.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Belum ada agenda mendatang.</p>
                ) : (
                  <ul className="divide-y divide-[var(--border-hairline)]">
                    {data.upcoming_events.map((ev) => (
                      <li key={ev.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-main)] truncate">
                            {ev.title}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] tabular-nums mt-0.5">
                            {formatDateTime(ev.starts_at)}
                          </p>
                        </div>
                        <Badge variant={ev.status === 'published' ? 'published' : 'draft'}>
                          {ev.status === 'published' ? 'Terbit' : 'Draft'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* 4. Aktivitas Terakhir */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                  Aktivitas Terakhir
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                {data.recent_activity.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Belum ada aktivitas tercatat.</p>
                ) : (
                  <ul className="divide-y divide-[var(--border-hairline)]">
                    {data.recent_activity.map((act, idx) => (
                      <li key={`${act.action}-${idx}`} className="py-2.5 first:pt-0 last:pb-0 flex items-baseline justify-between gap-3 text-sm">
                        <p className="text-[var(--text-main)] min-w-0">
                          <span className="font-semibold">{act.actor_name}</span>{' '}
                          <span className="text-[var(--text-muted)]">{act.label_id.toLowerCase()}</span>
                        </p>
                        <span className="text-xs text-[var(--text-faint)] tabular-nums shrink-0">
                          {act.created_at ? formatDateTime(act.created_at) : '-'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      )
}
