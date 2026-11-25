import { useEffect } from 'react'

/**
 * Hook untuk memperbarui document.title dan menambahkan tag meta robots noindex jika diperlukan
 */
export function useDocumentTitle(title: string, noIndex = false) {
  useEffect(() => {
    const fullTitle = `${title} — Karang Taruna RT 001 RW 004`
    document.title = fullTitle

    let metaRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')

    if (noIndex) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta')
        metaRobots.name = 'robots'
        document.head.appendChild(metaRobots)
      }
      metaRobots.content = 'noindex, nofollow'
    } else if (metaRobots) {
      metaRobots.remove()
    }

    return () => {
      if (noIndex && metaRobots) {
        metaRobots.remove()
      }
    }
  }, [title, noIndex])
}
