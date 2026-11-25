import { useState, useEffect } from 'react'
import { X, Menu, MessageSquare, Globe, Shield } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
const CURRENT_YEAR = new Date().getFullYear();
import { Container } from '@/components/ui'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/profil', label: 'Profil & Struktur' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/dokumentasi', label: 'Dokumentasi' },
  { to: '/keuangan', label: 'Keuangan' },
  { to: '/aspirasi', label: 'Aspirasi' },
]

export default function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Close mobile menu when navigating to a new route (via link click)
  const handleNavLinkClick = () => setIsMobileMenuOpen(false);



  // Removed effect; navigation links close menu via handleNavLinkClick

  // Cegah scroll pada body saat drawer menu ponsel terbuka
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  // Menutup drawer saat tombol Esc ditekan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileMenuOpen])

  return (
    <div className="min-h-screen flex flex-col bg-[#060B18] text-[#E6ECF8]">
      {/* Skip Link untuk Aksesibilitas Keyboard */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#2F6BFF] focus:text-white focus:font-semibold focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
      >
        Lewati ke konten utama
      </a>

      {/* Sticky Header & Navbar */}
      <header className="sticky top-0 z-40 w-full glass-effect border-b border-slate-800/80 transition-colors">
        <Container>
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Brand Identity */}
            <Link
              to="/"
              className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-[#22D3EE] rounded-lg py-1 px-1.5 -ml-1.5"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#2F6BFF] to-[#22D3EE] flex items-center justify-center text-white shadow-md shadow-blue-900/40 font-bold text-lg">
                KT
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight">
                  Karang Taruna
                </span>
                <span className="text-xs text-[#9AA8C4] font-medium leading-none">
                  RT 001 RW 004
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi Utama Publik">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={handleNavLinkClick}
                  className={({ isActive }) =>
                    cn(
                      'px-3.5 py-2 rounded-xl text-sm font-medium transition-colors duration-150',
                      'hover:text-white hover:bg-slate-800/40 focus-visible:outline-2 focus-visible:outline-[#22D3EE]',
                      isActive
                        ? 'text-[#22D3EE] font-semibold bg-cyan-950/40'
                        : 'text-[#9AA8C4]',
                    )
                  }
                >
                  {({ isActive }) => (
                    <span aria-current={isActive ? 'page' : undefined}>
                      {link.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-panel"
                aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#111B33] border border-slate-700/60 text-[#E6ECF8] hover:text-white focus-visible:outline-2 focus-visible:outline-[#22D3EE]"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile Navigation Drawer / Panel */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav-panel"
          className="fixed inset-0 top-[64px] sm:top-[80px] z-50 md:hidden flex flex-col bg-[#060B18]/95 backdrop-blur-xl border-t border-slate-800"
          role="dialog"
          aria-modal="true"
          aria-label="Menu Navigasi Ponsel"
        >
          <Container className="py-6 flex-1 flex flex-col justify-between overflow-y-auto">
            <nav className="flex flex-col space-y-2" aria-label="Menu Ponsel">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-medium min-h-[44px]',
                      'transition-colors duration-150',
                      isActive
                        ? 'bg-cyan-950/50 text-[#22D3EE] font-semibold border border-cyan-800/60'
                        : 'text-[#9AA8C4] hover:bg-slate-800/40 hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <span aria-current={isActive ? 'page' : undefined}>
                      {link.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="pt-6 border-t border-slate-800/80 text-xs text-[#9AA8C4] text-center space-y-1">
              <p className="font-semibold text-[#E6ECF8]">Karang Taruna RT 001 RW 004</p>
              <p>Kel. Jatibening Baru, Kec. Pondok Gede, Kota Bekasi</p>
            </div>
          </Container>
        </div>
      )}

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-[#0C1427] border-t border-slate-800/80 text-[#9AA8C4] py-12 mt-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-slate-800/80">
            {/* Identity Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2F6BFF] flex items-center justify-center text-white font-bold text-sm">
                  KT
                </div>
                <span className="font-bold text-[#E6ECF8] text-base">
                  Karang Taruna RT 001 RW 004
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#9AA8C4]">
                Wadah keterbukaan informasi, kebersamaan pemuda, dan transparansi kegiatan bagi seluruh warga lingkungan RT 001 RW 004.
              </p>
              <p className="text-xs text-[#7182A4]">
                Kelurahan Jatibening Baru &bull; Kecamatan Pondok Gede &bull; Kota Bekasi
              </p>
            </div>

            {/* Quick Links Column */}
            <div>
              <h4 className="text-sm font-semibold text-[#E6ECF8] uppercase tracking-wider mb-3">
                Navigasi Cepat
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/profil" className="hover:text-[#22D3EE] transition-colors py-1 inline-block">
                    Profil & Struktur Pengurus
                  </Link>
                </li>
                <li>
                  <Link to="/agenda" className="hover:text-[#22D3EE] transition-colors py-1 inline-block">
                    Agenda Kegiatan
                  </Link>
                </li>
                <li>
                  <Link to="/keuangan" className="hover:text-[#22D3EE] transition-colors py-1 inline-block">
                    Laporan Transparansi Keuangan
                  </Link>
                </li>
                <li>
                  <Link to="/aspirasi" className="hover:text-[#22D3EE] transition-colors py-1 inline-block">
                    Kirim Saran & Aspirasi
                  </Link>
                </li>
              </ul>
            </div>

            {/* Official Contact Area (Placeholder bertanda jelas) */}
            <div>
              <h4 className="text-sm font-semibold text-[#E6ECF8] uppercase tracking-wider mb-3">
                Kontak Resmi Pengurus
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111B33] border border-slate-800">
                  <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  <div>
                    <span className="text-xs font-medium text-[#E6ECF8] block">WhatsApp Resmi</span>
                    <span className="text-xs text-[#7182A4]">[Nomor kontak belum diisi]</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111B33] border border-slate-800">
                  <Globe className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                  <div>
                    <span className="text-xs font-medium text-[#E6ECF8] block">Instagram Resmi</span>
                    <span className="text-xs text-[#7182A4]">[Akun resmi belum diisi]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright & Disclaimer (TIDAK ADA LINK ADMIN) */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7182A4] gap-4">
            <p>&copy; {CURRENT_YEAR} Karang Taruna RT 001 RW 004. Seluruh hak cipta dilindungi.</p>
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
              <span>Platform Informasi Publik Resmi Lingkungan RT 001 RW 004</span>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  )
}
