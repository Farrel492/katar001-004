import { Link } from 'react-router-dom'
import { Home, SearchX } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Halaman Tidak Ditemukan')

  return (
      <main className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] mb-6">
              <SearchX className="w-8 h-8 text-[var(--text-muted)]" aria-hidden="true" />
            </div>

              <h1 className="text-5xl font-extrabold text-[var(--text-main)] mb-3 tabular-nums">404</h1>
              <p className="text-lg font-semibold text-[var(--text-main)] mb-2">
                Halaman Tidak Ditemukan
            </p>
            <p className="text-[var(--text-muted)] leading-relaxed mb-8">
              Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
            </p>

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
