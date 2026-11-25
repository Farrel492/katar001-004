import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
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
  ShieldAlert,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

/**
 * CATATAN KEAMANAN (AGENTS.md & docs/arsitektur.md):
 * Penjaga rute frontend dan layout ini HANYA kenyamanan UX untuk pengguna antarmuka.
 * Otorisasi dan perlindungan data yang sesungguhnya diwajibkan ada di BACKEND
 * melalui middleware autentikasi Sanctum dan Policy Laravel.
 */

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/profil', label: 'Profil & Struktur', icon: Users },
  { to: '/admin/agenda', label: 'Agenda & Galeri', icon: Calendar },
  { to: '/admin/keuangan', label: 'Keuangan', icon: Wallet },
  { to: '/admin/aspirasi', label: 'Aspirasi Warga', icon: MessageSquare },
]

export default function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [showLogoutAlert, setShowLogoutAlert] = useState(false)


  // Removed effect that closed mobile drawer on route change; navigation links now close drawer via onClick handlers
  // useEffect(() => {
  //   setIsMobileDrawerOpen(false)
  // }, [location.pathname])

  return (
    <div className="min-h-screen flex bg-[#060B18] text-[#E6ECF8]">
      {/* 1. Desktop & Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 bg-[#0C1427] border-r border-slate-800/80 transition-all duration-300 flex flex-col',
          // Desktop Width
          isSidebarCollapsed ? 'md:w-20' : 'md:w-64',
          // Mobile Drawer Behavior
          isMobileDrawerOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0',
        )}
        aria-label="Navigasi Panel Admin"
      >
        {/* Brand Header */}
        <div className="h-16 sm:h-20 flex items-center justify-between px-4 border-b border-slate-800/80">
          <Link
            to="/admin"
            className="flex items-center gap-3 overflow-hidden focus-visible:outline-2 focus-visible:outline-[#22D3EE] rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2F6BFF] to-[#8B7CF6] flex items-center justify-center text-white font-bold shrink-0 shadow-md shadow-blue-950/40">
              AD
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm text-white tracking-tight leading-tight">
                  Admin Portal
                </span>
                <span className="text-xs text-[#9AA8C4] truncate">
                  RT 001 RW 004
                </span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle Button (Desktop Only) */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-[#111B33] border border-slate-700/60 text-[#9AA8C4] hover:text-white"
            aria-label={isSidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px]',
                    'hover:bg-slate-800/40 hover:text-white focus-visible:outline-2 focus-visible:outline-[#22D3EE]',
                    isActive
                      ? 'bg-[#2F6BFF] text-white shadow-lg shadow-blue-950/50 font-semibold'
                      : 'text-[#9AA8C4]',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    {!isSidebarCollapsed && (
                      <span
                        className="truncate"
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer Area of Sidebar */}
        <div className="p-4 border-t border-slate-800/80">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 text-xs text-[#9AA8C4] hover:text-[#22D3EE] transition-colors py-2 px-1',
              isSidebarCollapsed && 'justify-center',
            )}
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Buka Halaman Warga</span>}
          </Link>
        </div>
      </aside>

      {/* Backdrop Overlay for Mobile Drawer */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* 2. Main Content Wrapper */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 min-w-0',
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64',
        )}
      >
        {/* Topbar Header */}
        <header className="h-16 sm:h-20 bg-[#0C1427]/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile Drawer */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-[#111B33] border border-slate-700/60 text-[#E6ECF8]"
              aria-label="Buka menu navigasi admin"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/80 hidden sm:inline-block">
              Area Administrasi (Internal)
            </span>
          </div>

          {/* User Placeholder & Logout Placeholder Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#111B33] border border-slate-700 flex items-center justify-center text-xs font-bold text-[#22D3EE]">
                P
              </div>
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-[#E6ECF8]">
                  Pengurus (Admin)
                </span>
                <span className="text-[10px] text-[#7182A4] leading-tight">
                  Sesi Sementara
                </span>
              </div>
            </div>

            {/* Tombol Keluar (Placeholder yang belum aktif) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogoutAlert(true)}
              className="text-[#F87171] hover:text-red-300 hover:bg-red-950/30"
              title="Tombol ini adalah placeholder (akan dihubungkan pada modul autentikasi)"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        {/* Modal / Toast Peringatan Logout Placeholder */}
        {showLogoutAlert && (
          <div className="bg-amber-950/40 border-b border-amber-800/60 px-6 py-3 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Catatan UI / Dev:</strong> Tombol 'Keluar' ini masih berupa placeholder antarmuka dan belum fungsional. Otentikasi dan logout API akan diintegrasikan pada modul Autentikasi.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutAlert(false)}
              className="ml-4 font-bold text-amber-300 hover:text-white"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
