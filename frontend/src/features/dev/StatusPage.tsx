import { useQuery } from '@tanstack/react-query'
import { getSystemHealth } from '@/lib/api'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Container, PageHeader } from '@/components/ui'

export default function StatusPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['system-health'],
    queryFn: getSystemHealth,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  return (
    <div className="min-h-screen bg-[#060B18] text-[#E6ECF8] py-12 antialiased">
      <Container size="narrow">
        <PageHeader
          title="Status Sistem"
          description="Uji koneksi frontend (Vite Proxy) ke backend (Laravel REST API) dan database MySQL Laragon."
          badge={<Badge variant="draft">Dev / Health</Badge>}
        />

        <Card>
          <CardHeader>
            <CardTitle>Pengecekan Kesehatan API & Database</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-sm text-[#9AA8C4]">Memeriksa status server...</p>
              </div>
            )}

            {!isLoading && isError && (
              <div className="rounded-xl bg-red-950/40 border border-red-800/80 p-5 text-slate-200">
                <h3 className="font-semibold text-red-300">Koneksi Terganggu</h3>
                <p className="text-sm text-red-200/90 mt-1">
                  {error instanceof Error
                    ? error.message
                    : 'Tidak dapat terhubung ke server backend atau database. Pastikan server Laravel dan Laragon aktif.'}
                </p>
              </div>
            )}

            {!isLoading && data && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#111B33] border border-slate-800 rounded-xl p-4">
                  <span className="text-xs uppercase tracking-wider text-[#9AA8C4] font-semibold">
                    Status API Backend
                  </span>
                  <div className="flex items-center space-x-2 mt-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        data.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-base font-semibold text-white capitalize">
                      {data.status === 'ok' ? 'Terhubung (OK)' : data.status}
                    </span>
                  </div>
                </div>

                <div className="bg-[#111B33] border border-slate-800 rounded-xl p-4">
                  <span className="text-xs uppercase tracking-wider text-[#9AA8C4] font-semibold">
                    Koneksi Database (MySQL)
                  </span>
                  <div className="flex items-center space-x-2 mt-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        data.database === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                      }`}
                    />
                    <span className="text-base font-semibold text-white capitalize">
                      {data.database === 'ok' ? 'Terhubung (OK)' : 'Gagal Terhubung'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#111B33] border border-slate-800 rounded-xl p-4 sm:col-span-2">
                  <span className="text-xs uppercase tracking-wider text-[#9AA8C4] font-semibold">
                    Nama Aplikasi
                  </span>
                  <p className="text-sm font-medium text-slate-200 mt-1">
                    {data.app_name || '-'}
                  </p>
                </div>

                <div className="bg-[#111B33] border border-slate-800 rounded-xl p-4 sm:col-span-2">
                  <span className="text-xs uppercase tracking-wider text-[#9AA8C4] font-semibold">
                    Waktu Server (Asia/Jakarta)
                  </span>
                  <p className="text-sm font-mono text-cyan-300 mt-1">
                    {data.server_time
                      ? new Date(data.server_time).toLocaleString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                        })
                      : '-'}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-[#9AA8C4]">
                Path: <code className="text-cyan-400">/api/health</code>
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => refetch()}
                isLoading={isFetching}
              >
                {isFetching ? 'Memeriksa...' : 'Periksa Ulang'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  )
}
