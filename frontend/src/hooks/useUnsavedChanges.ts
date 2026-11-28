import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Mencegah pengguna meninggalkan halaman atau menutup tab saat ada perubahan form yang belum disimpan.
 */
export function useUnsavedChanges(isDirty: boolean) {
  // 1. Peringatan saat menutup tab / refresh browser
  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // 2. Peringatan saat berpindah rute di dalam aplikasi React Router
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        'Ada perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?',
      )
      if (confirmed) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])
}
