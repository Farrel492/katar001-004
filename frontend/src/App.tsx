import { useQuery } from '@tanstack/react-query'
import { getSystemHealth } from '@/lib/api'

  export default function App() {
    const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
      queryKey: ['system-health'],
      queryFn: getSystemHealth,
      retry: 1,
      refetchOnWindowFocus: false,
    })

    return (
              <main className="min-h-screen bg-[#0a0f1d] text-slate-100 flex items-center justify-center p-4 antialiased">
                <div className="w-full max-w-xl bg-[#111a2e] border border-[#1e2d4a] rounded-xl shadow-2xl p-6 sm:p-8">
                  {/* Header */}
                  <div className="border-b border-[#1e2d4a] pb-4 mb-6">
                    <div className="flex items-center justify-between">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                        Status Sistem
                      </h1>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                        Fondasi Awal
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      Website Karang Taruna RT 001 RW 004 &bull; Uji Koneksi Frontend &rarr; API &rarr; Database
                    </p>
                  </div>

                {/* State: Loading */}
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                    <p className="text-sm text-slate-300">Menghubungi server dan memeriksa status database...</p>
                  </div>
                )}

                    {/* State: Error */}
                    {!isLoading && isError && (
                      <div className="rounded-lg bg-red-950/40 border border-red-800/80 p-5 mb-6 text-slate-200">
                        <div className="flex items-start space-x-3">
                          <span className="text-xl text-red-400">&bull;</span>
                          <div>
                            <h3 className="font-semibold text-red-300">Koneksi Terganggu</h3>
                            <p className="text-sm text-red-200/90 mt-1">
                              {error instanceof Error
                                ? error.message
                                : 'Tidak dapat terhubung ke server backend atau database. Pastikan server Laravel dan Laragon aktif.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* State: Success / Data received */}
                    {!isLoading && data && (
                      <div className="space-y-4">
                        {/* Database Warning if degraded */}
                        {data.database === 'gagal' && (
                          <div className="rounded-lg bg-amber-950/40 border border-amber-800/80 p-4 text-amber-200 text-sm">
                            Layanan API aktif, namun database lokal tidak dapat dijangkau.
                          </div>
                        )}

                        {/* Grid items */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* API Status */}
                          <div className="bg-[#16223b] border border-[#1e2d4a] rounded-lg p-4">
                            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                              Status API Backend
                            </span>
                            <div className="flex items-center space-x-2 mt-2">
                              <span
                                className={`w-3 h-3 rounded-full ${data.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                                  }`}
                              />
                              <span className="text-base font-semibold text-white capitalize">
                                {data.status === 'ok' ? 'Terhubung (OK)' : data.status}
                              </span>
                            </div>
                          </div>

                          {/* Database Status */}
                          <div className="bg-[#16223b] border border-[#1e2d4a] rounded-lg p-4">
                            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                              Koneksi Database (MySQL)
                            </span>
                            <div className="flex items-center space-x-2 mt-2">
                              <span
                                className={`w-3 h-3 rounded-full ${data.database === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                                  }`}
                              />
                              <span className="text-base font-semibold text-white capitalize">
                                {data.database === 'ok' ? 'Terhubung (OK)' : 'Gagal Terhubung'}
                              </span>
                            </div>
                          </div>

                          {/* App Name */}
                          <div className="bg-[#16223b] border border-[#1e2d4a] rounded-lg p-4 sm:col-span-2">
                            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                              Nama Aplikasi
                            </span>
                            <p className="text-sm font-medium text-slate-200 mt-1">
                              {data.app_name || '-'}
                            </p>
                          </div>

                          {/* Server Time */}
                          <div className="bg-[#16223b] border border-[#1e2d4a] rounded-lg p-4 sm:col-span-2">
                            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                              Waktu Server (Asia/Jakarta)
                            </span>
                            <p className="text-sm font-mono text-cyan-300 mt-1">
                              {data.server_time ? new Date(data.server_time).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-6 pt-4 border-t border-[#1e2d4a] flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Path: <code className="text-slate-400">/api/health</code>
                      </span>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-50 cursor-pointer"
                      >
                        {isFetching ? 'Memeriksa...' : 'Periksa Ulang'}
                      </button>
                    </div>
          </div>
        </main>
        )
}
