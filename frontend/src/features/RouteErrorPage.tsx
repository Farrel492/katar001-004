import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'

export default function RouteErrorPage() {
  const error = useRouteError()

  // Determine a safe, user-friendly message — never expose technical details
  let message = 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.'
  if (isRouteErrorResponse(error) && error.status === 404) {
    // Should normally be caught by the NotFoundPage wildcard, but just in case
    message = 'Halaman yang Anda cari tidak ditemukan.'
  }

  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <div className="text-center max-w-md mx-auto">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-bg-surface border border-border mb-6">
          <AlertTriangle className="w-10 h-10 text-warning" aria-hidden="true" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-text mb-3">Oops! Ada Masalah</h1>
        <p className="text-text-muted leading-relaxed mb-8">{message}</p>

        {/* Action */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-primary-accent text-white font-semibold text-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  )
}
