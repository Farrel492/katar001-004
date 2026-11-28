import { useState, useEffect, useRef } from 'react'
import { X, Menu, Phone, Mail, MapPin, ExternalLink } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Container } from '@/components/ui'
import { cn } from '@/lib/utils'
import { getPublicProfile, type OrganizationProfileData } from '@/lib/api'

const CURRENT_YEAR = new Date().getFullYear()

const NAV_LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/profil', label: 'Profil' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/dokumentasi', label: 'Dokumentasi' },
  { to: '/keuangan', label: 'Keuangan' },
  { to: '/aspirasi', label: 'Aspirasi' },
]

export interface PublicOutletContext {
  profile: OrganizationProfileData | null
  profileLoading: boolean
}

function getMonogram(shortName?: string | null): string {
  if (!shortName) return 'KT'
  const words = shortName.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  return shortName.slice(0, 2).toUpperCase()
}

function formatWhatsappHref(wa: string): string {
  const digits = wa.replace(/[^\d]/g, '')
  if (!digits) return '#'
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits
  return `https://wa.me/${normalized}`
}

export default function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [profile, setProfile] = useState<OrganizationProfileData | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const mobilePanelRef = useRef<HTMLDivElement | null>(null)
  const location = useLocation()

  useEffect(() => {
    let active = true
    const fetchProfile = () => {
      getPublicProfile()
        .then((res) => {
          if (active) setProfile(res.data)
        })
        .catch(() => {
          // Gunakan fallback identitas default bila API belum tersedia
        })
        .finally(() => {
          if (active) setProfileLoading(false)
        })
    }

    fetchProfile()
    window.addEventListener('focus', fetchProfile)
    return () => {
      active = false
      window.removeEventListener('focus', fetchProfile)
    }
}, [location.pathname])

const closeMobileMenu = () => {
  setIsMobileMenuOpen(false)
  window.requestAnimationFrame(() => {
    menuButtonRef.current?.focus()
  })
}

// Cegah scroll pada body saat menu ponsel terbuka & kelola fokus (focus trap + Esc)
useEffect(() => {
  if (!isMobileMenuOpen) {
    document.body.style.overflow = ''
    return
  }

  document.body.style.overflow = 'hidden'

  const focusTimer = window.setTimeout(() => {
    const firstLink = mobilePanelRef.current?.querySelector<HTMLElement>('a, button')
    firstLink?.focus()
  }, 20)

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsMobileMenuOpen(false)
      window.requestAnimationFrame(() => {
        menuButtonRef.current?.focus()
      })
      return
    }

    if (e.key === 'Tab' && mobilePanelRef.current) {
      const focusables = Array.from(
        mobilePanelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => {
    window.clearTimeout(focusTimer)
    window.removeEventListener('keydown', handleKeyDown)
    document.body.style.overflow = ''
  }
}, [isMobileMenuOpen])

const shortName = profile?.short_name || 'Karang Taruna'
const regionLabel = profile?.region_label || 'RT 001 RW 004'
const orgName = profile?.name || 'Karang Taruna RT 001 RW 004'
const address =
  profile?.address || 'Kel. Jatibening Baru, Kec. Pondok Gede, Kota Bekasi'

return (
  <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-main)] text-[17px] leading-[1.65]">
    {/* Skip Link Aksesibilitas */}
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:min-h-[44px] focus:inline-flex focus:items-center focus:bg-[var(--primary)] focus:text-white focus:font-semibold focus:rounded-[var(--radius-sm)] focus:outline-2 focus:outline-[var(--accent)]"
    >
      Lewati ke konten
    </a>

    {/* Header Ringkas */}
    <header className="sticky top-0 z-40 w-full bg-[#060B18]/95 border-b border-[var(--border-hairline)]">
      <Container>
        <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
          {/* Identitas RT / Organisasi */}
          <Link
            to="/"
            className="flex items-center gap-3 min-h-[44px] rounded-[var(--radius-sm)] py-1 pr-2 focus-visible:outline-2 focus-visible:outline-[var(--accent)] shrink-0"
          >
            {profile?.logo_url ? (
              <img
                src={profile.logo_url}
                alt={`Logo ${orgName}`}
                width={36}
                height={36}
                className="w-9 h-9 rounded-[var(--radius-sm)] object-cover border border-[var(--border-strong)] bg-[var(--bg-surface)] shrink-0"
              />
            ) : (
              <span
                aria-hidden="true"
                className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-main)] font-bold text-sm tracking-tight shrink-0"
              >
                {getMonogram(shortName)}
              </span>
            )}
            <span className="flex flex-col">
              <span className="font-bold text-sm sm:text-base tracking-tight text-[var(--text-main)] leading-tight">
                {shortName}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-medium leading-tight">
                {regionLabel}
              </span>
            </span>
          </Link>

          {/* Navigasi Desktop */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi Utama">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'px-3.5 py-2 min-h-[44px] inline-flex items-center rounded-[var(--radius-sm)] text-sm font-medium transition-colors duration-150',
                    'hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]',
                    isActive
                      ? 'text-[var(--accent)] font-semibold bg-[var(--bg-elevated)] border border-[var(--border-hairline)]'
                      : 'text-[var(--text-muted)] border border-transparent',
                  )
                }
              >
                {({ isActive }) => (
                  <span aria-current={isActive ? 'page' : undefined}>{link.label}</span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Tombol Menu Ponsel (dengan label jelas & target sentuh >= 44px) */}
          <div className="flex items-center md:hidden">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-panel"
              aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              className="min-h-[44px] px-3 inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-sm font-semibold text-[var(--text-main)] hover:border-slate-500 cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <>
                  <X className="w-4 h-4" aria-hidden="true" />
                  <span>Tutup</span>
                </>
              ) : (
                <>
                  <Menu className="w-4 h-4" aria-hidden="true" />
                  <span>Menu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Container>
    </header>

    {/* Panel Menu Ponsel (Focus Trapped, Esc to close) */}
    {isMobileMenuOpen && (
      <div
        id="mobile-nav-panel"
        ref={mobilePanelRef}
        className="fixed inset-0 top-16 z-50 md:hidden flex flex-col bg-[var(--bg-base)] border-t border-[var(--border-hairline)]"
        role="dialog"
        aria-modal="true"
        aria-label="Menu Navigasi"
      >
        <Container className="py-5 flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Pilih Halaman
              </span>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="min-h-[44px] min-w-[44px] px-3 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-semibold text-[var(--text-main)]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                Tutup
              </button>
            </div>

            <nav className="flex flex-col space-y-1.5" aria-label="Menu Navigasi Ponsel">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-4 py-3 rounded-[var(--radius-sm)] text-base font-medium min-h-[48px] transition-colors duration-150',
                      isActive
                        ? 'bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold border border-[var(--border-strong)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)] border border-transparent',
                    )
                  }
                >
                  {({ isActive }) => (
                    <span aria-current={isActive ? 'page' : undefined}>{link.label}</span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="pt-5 mt-6 border-t border-[var(--border-hairline)] text-xs text-[var(--text-muted)] space-y-1">
            <p className="font-semibold text-[var(--text-main)]">{orgName}</p>
            <p>{address}</p>
          </div>
        </Container>
      </div>
    )}

    {/* Konten Utama */}
    <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
      <Outlet context={{ profile, profileLoading } satisfies PublicOutletContext} />
    </main>

    {/* Footer Resmi (tanpa tautan admin) */}
    <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] text-[var(--text-muted)] py-12 mt-16">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[var(--border-hairline)]">
          {/* Identitas & Alamat */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              {profile?.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt={`Logo ${orgName}`}
                  width={32}
                  height={32}
                  loading="lazy"
                  className="w-8 h-8 rounded-[var(--radius-sm)] object-cover border border-[var(--border-hairline)]"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-main)] font-bold text-xs"
                >
                  {getMonogram(shortName)}
                </span>
              )}
              <span className="font-bold text-[var(--text-main)] text-base">
                {orgName}
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-sm text-[var(--text-muted)] pt-1">
              <MapPin className="w-4 h-4 text-[var(--accent)] shrink-0 mt-1" aria-hidden="true" />
              <p className="leading-relaxed max-w-sm">{address}</p>
            </div>
          </div>

          {/* Navigasi */}
          <div className="md:col-span-3">
            <h2 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider mb-3">
              Navigasi
            </h2>
            <ul className="space-y-1 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex items-center min-h-[44px] sm:min-h-[36px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak Resmi dari API Profil */}
          <div className="md:col-span-4">
            <h2 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider mb-3">
              Kontak Resmi
            </h2>
            <div className="space-y-2.5 text-sm">
              {profile?.whatsapp ? (
                <a
                  href={formatWhatsappHref(profile.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 min-h-[44px] rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] text-[var(--text-main)] transition-colors duration-150"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Phone className="w-4 h-4 text-[var(--success)] shrink-0" aria-hidden="true" />
                    <span className="truncate tabular-nums">WhatsApp: {profile.whatsapp}</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--text-faint)] shrink-0" aria-hidden="true" />
                </a>
              ) : (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-base)] border border-[var(--border-hairline)] text-xs text-[var(--text-faint)]">
                  <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>WhatsApp resmi belum tersedia</span>
                </div>
              )}

              {profile?.email ? (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 min-h-[44px] rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] text-[var(--text-main)] transition-colors duration-150"
                >
                  <Mail className="w-4 h-4 text-[var(--accent)] shrink-0" aria-hidden="true" />
                  <span className="truncate">{profile.email}</span>
                </a>
              ) : (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-base)] border border-[var(--border-hairline)] text-xs text-[var(--text-faint)]">
                  <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Email resmi belum tersedia</span>
                </div>
              )}

              {profile?.instagram && (
                <p className="text-xs text-[var(--text-muted)] pt-1">
                  Instagram: <span className="text-[var(--text-main)] font-medium">{profile.instagram}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[var(--text-faint)] gap-2">
          <p>&copy; {CURRENT_YEAR} {orgName}.</p>
          <p>{regionLabel} &bull; Kel. Jatibening Baru, Kec. Pondok Gede, Bekasi</p>
        </div>
      </Container>
    </footer>
  </div>
)
}
