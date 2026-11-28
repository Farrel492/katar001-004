import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'

export default function RouteErrorPage() {
  const error = useRouteError()

  let message = 'Terjadi kendala saat memuat halaman. Silakan coba kembali.'
  if (isRouteErrorResponse(error) && error.status === 404) {
    message = 'Halaman yang Anda cari tidak ditemukan.'
  }

  return (
      <main className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] mb-6">
              <AlertTriangle className="w-8 h-8 text-[var(--warning)]" aria-hidden="true" />
            </div>

            <h1 className="text-2xl font-bold text-[var(--text-main)] mb-3">
              Halaman Tidak Dapat Dimuat
            </h1>
            <p className="text-[var(--text-muted)] leading-relaxed mb-8">{message}</p>

            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-[var(--radius-sm)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              Kembali ke Beranda
            </Link>
          </div>
      </main>
      )
}
