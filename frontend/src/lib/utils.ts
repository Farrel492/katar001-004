import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utilitas untuk menggabungkan class Tailwind secara aman
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
