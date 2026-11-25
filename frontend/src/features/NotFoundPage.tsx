import { Link } from 'react-router-dom'
import { Home, SearchX } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Halaman Tidak Ditemukan')

  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <div className="text-center max-w-md mx-auto">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-bg-surface border border-border mb-6">
          <SearchX className="w-10 h-10 text-text-muted" aria-hidden="true" />
        </div>

        {/* Heading */}
        <h1 className="text-6xl font-bold text-primary mb-4 tabular-nums">404</h1>
        <h2 className="text-xl font-semibold text-text mb-3">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-text-muted leading-relaxed mb-8">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
          Silakan kembali ke beranda.
        </p>

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
