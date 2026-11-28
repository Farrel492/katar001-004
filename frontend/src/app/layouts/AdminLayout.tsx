import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Wallet,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { AdminAuthProvider, useAdminAuth } from '@/features/admin/context/AdminAuthContext'
import { getAdminAspirationStats } from '@/lib/api'

  interface NavItem {
    to: string
  label: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  end?: boolean
  }

interface NavGroup {
    group: string | null
  items: NavItem[]
  }

const ROUTE_TITLES: Array<{ prefix: string; title: string; exact?: boolean }> = [
  { prefix: '/admin', title: 'Dashboard', exact: true },
  { prefix: '/admin/profil', title: 'Profil & Struktur' },
  { prefix: '/admin/agenda', title: 'Agenda' },
  { prefix: '/admin/galeri', title: 'Galeri' },
  { prefix: '/admin/aspirasi', title: 'Aspirasi Warga' },
  { prefix: '/admin/keuangan', title: 'Keuangan' },
  { prefix: '/admin/pengguna', title: 'Manajemen Akun' },
]

function getPageTitle(pathname: string): string {
  for (const item of ROUTE_TITLES) {
    if (item.exact ? pathname === item.prefix : pathname.startsWith(item.prefix)) {
      return item.title
    }
  }
  return 'Panel Admin'
}

function AdminLayoutContent() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [newAspirationsCount, setNewAspirationsCount] = useState<number>(0)

  const { currentUser, isLoading, logout } = useAdminAuth()
  const location = useLocation()
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const drawerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!currentUser) return
    let mounted = true
    getAdminAspirationStats()
      .then((stats) => {
        if (mounted && stats) {
          setNewAspirationsCount(stats.new || 0)
        }
      })
      .catch(() => { })
    return () => {
      mounted = false
    }
}, [currentUser, location.pathname])

// Tutup drawer saat pindah halaman
useEffect(() => {
  setIsMobileDrawerOpen(false)
}, [location.pathname])

// Focus trap & Esc untuk mobile drawer
useEffect(() => {
  if (!isMobileDrawerOpen) {
    document.body.style.overflow = ''
    return
  }
  document.body.style.overflow = 'hidden'

  const focusTimer = window.setTimeout(() => {
    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled])',
    )
    firstFocusable?.focus()
  }, 20)

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsMobileDrawerOpen(false)
      window.requestAnimationFrame(() => menuButtonRef.current?.focus())
      return
    }
    if (e.key === 'Tab' && drawerRef.current) {
      const focusables = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
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
}, [isMobileDrawerOpen])

const handleLogout = async () => {
  setIsLoggingOut(true)
  try {
    await logout()
  } finally {
    setIsLoggingOut(false)
  }
}

if (isLoading) {
  return (
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" aria-hidden="true" />
          <p className="text-sm text-[var(--text-muted)]">Memuat sesi administrasi...</p>
        </div>
      </div>
      )
  }

      const isSuperadmin = currentUser?.role === 'superadmin'
      const roleLabel = isSuperadmin ? 'Superadmin' : 'Admin'
      const initial = (currentUser?.name || currentUser?.username || 'A').charAt(0).toUpperCase()
      const pageTitle = getPageTitle(location.pathname)

      const navGroups: NavGroup[] = [
      {
        group: null,
      items: [{to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
    },
      {
        group: 'Konten',
      items: [
      {to: '/admin/profil', label: 'Profil', icon: Users },
      {to: '/admin/agenda', label: 'Agenda', icon: Calendar },
      {to: '/admin/galeri', label: 'Galeri', icon: ImageIcon },
      ],
    },
      {
        group: 'Interaksi',
      items: [{to: '/admin/aspirasi', label: 'Aspirasi', icon: MessageSquare }],
    },
      {
        group: 'Keuangan',
      items: [{to: '/admin/keuangan', label: 'Keuangan', icon: Wallet }],
    },
      ...(isSuperadmin
      ? [
      {
        group: 'Sistem',
      items: [{to: '/admin/pengguna', label: 'Manajemen Akun', icon: ShieldCheck }],
          },
      ]
      : []),
      ]

      return (
        <div className="min-h-screen flex bg-[var(--bg-base)] text-[var(--text-main)] text-[15px]">
          {/* Sidebar Desktop & Mobile Drawer */}
          <aside
            ref={drawerRef}
            id="admin-sidebar"
            role={isMobileDrawerOpen ? 'dialog' : undefined}
            aria-modal={isMobileDrawerOpen ? 'true' : undefined}
            className={cn(
              'fixed inset-y-0 left-0 z-40 bg-[var(--bg-surface)] border-r border-[var(--border-hairline)] transition-all duration-200 flex flex-col',
              isSidebarCollapsed ? 'md:w-20' : 'md:w-64',
              isMobileDrawerOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0',
            )}
            aria-label="Navigasi Panel Admin"
          >
              {/* Header Sidebar */}
              <div className="h-16 sm:h-18 flex items-center justify-between px-4 border-b border-[var(--border-hairline)]">
                <Link
                  to="/admin"
                  className="flex items-center gap-3 overflow-hidden focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-[var(--radius-sm)] p-1 min-h-[44px]"
                >
                    <span
                      aria-hidden="true"
                      className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-main)] font-bold text-sm shrink-0"
                    >
                      AD
                </span>
                {!isSidebarCollapsed && (
                      <span className="flex flex-col truncate">
                        <span className="font-bold text-sm text-[var(--text-main)] tracking-tight leading-tight">
                          Admin Portal
                        </span>
                          <span className="text-xs text-[var(--text-muted)] truncate">
                            RT 001 RW 004
                          </span>
                      </span>
            )}
                    </Link>

                    <button
                      type="button"
                      onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                      className="hidden md:flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                      aria-label={isSidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
                    >
                      {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      ) : (
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>

                    {isMobileDrawerOpen && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileDrawerOpen(false)
                          window.requestAnimationFrame(() => menuButtonRef.current?.focus())
                        }}
                        className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-main)] cursor-pointer"
                        aria-label="Tutup menu navigasi admin"
                      >
                        <X className="w-5 h-5" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                                    {/* Grup Navigasi */ }
                                    < nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto" aria-label="Menu Administrasi">
                                  {navGroups.map((group, gIdx) => (
                                    <div key={group.group ?? `root-${gIdx}`} className="space-y-1">
                                      {group.group && !isSidebarCollapsed && (
                                        <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                                          {group.group}
                                        </div>
                                      )}
                                      {group.items.map((item) => {
                                        const Icon = item.icon
                                        return (
                                          <NavLink
                                            key={item.to}
                                            to={item.to}
                                            end={item.end}
                                            className={({ isActive }) =>
                                              cn(
                                                'flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors duration-150 min-h-[44px]',
                                                'hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]',
                                                isActive
                                                  ? 'bg-[var(--primary)] text-white font-semibold'
                                                  : 'text-[var(--text-muted)]',
                                              )
                                            }
                                          >
                                            {({ isActive }) => (
                                              <>
                                                <div className="relative shrink-0">
                                                  <Icon className="w-5 h-5 shrink-0" aria-hidden={true} />
                                                  {isSidebarCollapsed && item.to === '/admin/aspirasi' && newAspirationsCount > 0 && (
                                                    <span
                                                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--accent)] rounded-full ring-2 ring-[var(--bg-surface)]"
                                                      title={`${newAspirationsCount} aspirasi baru`}
                                                    />
                                                  )}
                                                </div>
                                                {!isSidebarCollapsed && (
                                                  <>
                                                    <span
                                                      className="truncate flex-1"
                                                      aria-current={isActive ? 'page' : undefined}
                                                    >
                                                      {item.label}
                                                    </span>
                                      {item.to === '/admin/aspirasi' && newAspirationsCount > 0 && (
                                        <span
                                          className={cn(
                                            'px-2 py-0.5 text-[11px] font-bold rounded-[var(--radius-sm)] tabular-nums shrink-0',
                                            isActive
                                              ? 'bg-white/20 text-white'
                                              : 'bg-cyan-950/70 text-[var(--accent)] border border-cyan-800/70',
                                          )}
                                          title={`${newAspirationsCount} aspirasi berstatus baru`}
                                        >
                                          {newAspirationsCount}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </NavLink>
                          )
              })}
                        </div>
                      ))}
                </nav>

                  {/* Footer Sidebar */}
                  <div className="p-3 border-t border-[var(--border-hairline)]">
                    <Link
                      to="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors px-3 min-h-[44px] rounded-[var(--radius-sm)]',
                        isSidebarCollapsed && 'justify-center px-0',
                      )}
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
                      {!isSidebarCollapsed && <span>Buka Halaman Warga</span>}
                    </Link>
                  </div>
                </aside>

                {/* Backdrop Overlay untuk Mobile Drawer */}
                {isMobileDrawerOpen && (
                  <div
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="fixed inset-0 z-30 bg-black/70 md:hidden"
                    aria-hidden="true"
                  />
                )}

                {/* Konten Utama */}
                <div
                  className={cn(
                    'flex-1 flex flex-col transition-all duration-200 min-w-0',
                    isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64',
                  )}
                >
                      {/* Topbar */}
                      <header className="h-16 sm:h-18 bg-[var(--bg-surface)] border-b border-[var(--border-hairline)] sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            ref={menuButtonRef}
                            type="button"
                            onClick={() => setIsMobileDrawerOpen(true)}
                            aria-expanded={isMobileDrawerOpen}
                            aria-controls="admin-sidebar"
                            aria-label="Buka menu navigasi admin"
                            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-main)] cursor-pointer shrink-0"
                          >
                            <Menu className="w-5 h-5" aria-hidden="true" />
                          </button>
                            <span className="font-bold text-base sm:text-lg text-[var(--text-main)] truncate">
                              {pageTitle}
                            </span>
                        </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center text-xs font-bold text-[var(--text-main)] shrink-0"
                                aria-hidden="true"
                              >
                                {initial}
                              </div>
                                  <div className="hidden sm:flex items-center gap-2">
                                    <span className="text-sm font-semibold text-[var(--text-main)]">
                                      {currentUser?.name || currentUser?.username}
                                    </span>
                                    <Badge variant={isSuperadmin ? 'preview' : 'info'}>{roleLabel}</Badge>
                                  </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="text-[var(--danger-text)] hover:text-red-300 hover:bg-red-950/30 min-h-[44px]"
                                title="Keluar dari sesi admin"
                                aria-label="Keluar dari sesi admin"
                              >
                                {isLoggingOut ? (
                <Loader2 className="w-4 h-4 sm:mr-1.5 animate-spin" aria-hidden="true" />
                                ) : (
                <LogOut className="w-4 h-4 sm:mr-1.5" aria-hidden="true" />
                                )}
                                <span className="hidden sm:inline">
                                  {isLoggingOut ? 'Keluar...' : 'Keluar'}
                                </span>
                              </Button>
                        </div>
                      </header>

                        <main className="flex-1 p-4 sm:p-8 min-w-0">
                          <Outlet />
              </main>
            </div>
        </div>
        )
}

        export default function AdminLayout() {
  return (
        <AdminAuthProvider>
          <AdminLayoutContent />
        </AdminAuthProvider>
        )
}
