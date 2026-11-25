/**
 * Utilitas pemformatan angka uang dan tanggal
 * Aturan:
 * - Nominal uang berupa bilangan bulat Rupiah (BIGINT / integer), bukan float
 * - Format locale id-ID, zona waktu Asia/Jakarta
 * - Menangani nilai null, undefined, atau string tidak valid secara aman
 */

/**
 * Format nominal Rupiah dari bilangan bulat integer / bigint
 * Contoh: 1250000 -> "Rp 1.250.000"
 */
export function formatRupiah(amount: number | bigint | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'Rp 0'
  }

  try {
    let rawValue: number
    if (typeof amount === 'string') {
      const sanitized = amount.trim()
      rawValue = Number.parseInt(sanitized.replace(/[^\d-]/g, ''), 10)
    } else {
      rawValue = Number(amount)
    }

    if (Number.isNaN(rawValue)) {
      return 'Rp 0'
    }

    const integerVal = Math.trunc(rawValue)
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(integerVal)

    // Normalisasi agar selalu berformat "Rp " diikuti angka
    return formatted.replace(/IDR\s?/, 'Rp ').replace(/Rp\s?/, 'Rp ')
  } catch {
    return 'Rp 0'
  }
}

/**
 * Format tanggal standar Indonesia dengan zona waktu Asia/Jakarta
 * Contoh: "23 November 2026"
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-'

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (Number.isNaN(date.getTime())) return '-'

    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(date)
  } catch {
    return '-'
  }
}

/**
 * Format tanggal dan waktu Indonesia dengan zona waktu Asia/Jakarta
 * Contoh: "23 November 2026, 12.30 WIB"
 */
export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-'

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (Number.isNaN(date.getTime())) return '-'

    const formattedDate = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(date)

    const formattedTime = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
      hour12: false,
    }).format(date).replace(':', '.')

    return `${formattedDate}, ${formattedTime} WIB`
  } catch {
    return '-'
  }
}
