/**
 * router.tsx — Definisi rute utama aplikasi Karang Taruna RT 001 RW 004
 *
 * Struktur:
 *   /                  → PublicLayout (semua pengunjung)
 *   /admin             → AdminLayout  (placeholder; auth nyata di backend)
 *   /loginadminkatar   → Halaman login admin (tersembunyi dari publik)
 *   /dev/*             → Hanya tersedia saat DEV (tidak masuk production build)
 *   *                  → NotFoundPage
 *
 * Catatan keamanan:
 *   - AdminLayout di sini adalah shell UX saja.
 *   - Perlindungan nyata (autentikasi & otorisasi) ada di backend Laravel.
 *   - Rute /dev/* dikecualikan dari production melalui import.meta.env.DEV.
 */

import { createBrowserRouter } from 'react-router-dom'
import PublicLayout from '@/app/layouts/PublicLayout'
import AdminLayout from '@/app/layouts/AdminLayout'
import RequireSuperadmin from '@/features/admin/RequireSuperadmin'
import NotFoundPage from '@/features/NotFoundPage'
import RouteErrorPage from '@/features/RouteErrorPage'

// DEV-only imports — tree-shaken oleh Vite di production
import StyleguidePage from '@/features/dev/StyleguidePage'

export const router = createBrowserRouter([
  /* ------------------------------------------------------------------ */
  /* Area Publik                                                          */
  /* ------------------------------------------------------------------ */
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        lazy: () =>
          import('@/features/public/HomePage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'profil',
        lazy: () =>
          import('@/features/public/ProfilePage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'agenda',
        lazy: () =>
          import('@/features/public/AgendaPage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'agenda/:slug',
        lazy: () =>
          import('@/features/public/EventDetailPage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'dokumentasi',
        lazy: () =>
          import('@/features/public/DocumentationPage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'dokumentasi/:slug',
        lazy: () =>
          import('@/features/public/AlbumDetailPage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'keuangan',
        lazy: () =>
          import('@/features/public/FinancePage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'aspirasi',
        lazy: () =>
          import('@/features/public/AspirationPage').then((m) => ({
            Component: m.default,
          })),
      },
      // Wildcard di bawah PublicLayout (menampilkan navbar/footer)
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Area Admin (shell UX saja; auth di backend)                         */
  /* ------------------------------------------------------------------ */
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        lazy: () =>
          import('@/features/admin/AdminDashboardPage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'profil',
        lazy: () =>
          import('@/features/admin/AdminProfilePage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'agenda',
        lazy: () =>
          import('@/features/admin/AdminAgendaPage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'galeri',
        lazy: () =>
          import('@/features/admin/AdminGalleryPage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'galeri/:id',
        lazy: () =>
          import('@/features/admin/AdminGalleryDetailPage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'keuangan',
        lazy: () =>
          import('@/features/admin/AdminFinancePage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'aspirasi',
        lazy: () =>
          import('@/features/admin/AdminAspirationPage').then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: 'pengguna',
        element: <RequireSuperadmin />,
        children: [
          {
            index: true,
            lazy: () =>
              import('@/features/admin/AdminUsersPage').then((m) => ({
                Component: m.default,
              })),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Login Admin — URL tidak-obvious, tidak tercantum di navbar publik   */
  /* ------------------------------------------------------------------ */
  {
    path: '/loginadminkatar',
    errorElement: <RouteErrorPage />,
    lazy: () =>
      import('@/features/admin/AdminLoginPage').then((m) => ({
        Component: m.default,
      })),
  },

  /* ------------------------------------------------------------------ */
  /* Rute Development — HANYA tersedia saat import.meta.env.DEV          */
  /* Vite mengeluarkan blok ini dari production build.                   */
  /* ------------------------------------------------------------------ */
  ...(import.meta.env.DEV
    ? [
        {
          path: '/dev/styleguide',
          element: <StyleguidePage />,
          errorElement: <RouteErrorPage />,
        },
        {
          path: '/dev/status',
          errorElement: <RouteErrorPage />,
          lazy: () =>
            import('@/features/dev/StatusPage').then((m) => ({
              Component: m.default,
            })),
        },
      ]
    : []),

  /* ------------------------------------------------------------------ */
  /* Fallback global 404                                                  */
  /* ------------------------------------------------------------------ */
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
