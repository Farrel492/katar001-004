import React from 'react'
import { Card, CardContent } from './Card'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  className?: string
  render: (row: T, index: number) => React.ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  keyExtractor: (row: T) => string | number
  renderMobileCard: (row: T, index: number) => React.ReactNode
  ariaLabel: string
  isLoading?: boolean
  skeletonRows?: number
  error?: string | null
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  rowClassName?: (row: T) => string | undefined
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  renderMobileCard,
  ariaLabel,
  isLoading = false,
  skeletonRows = 4,
  error = null,
  onRetry,
  emptyTitle = 'Belum Ada Data',
  emptyDescription = 'Data belum tersedia.',
  emptyAction,
  rowClassName,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3">
          {Array.from({ length: skeletonRows }).map((_, idx) => (
            <Skeleton key={idx} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} retryLabel="Coba lagi" />
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return (
    <Card className="overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm" aria-label={ariaLabel}>
          <thead className="bg-[#111B33]/80 border-b border-slate-800/80 text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider">
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={cn('px-5 py-4', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.map((row, index) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  'hover:bg-[#111B33]/40 transition-colors',
                  rowClassName?.(row),
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-5 py-4 align-middle', col.className)}>
                    {col.render(row, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="md:hidden divide-y divide-slate-800/80">
        {data.map((row, index) => (
          <div key={keyExtractor(row)} className="p-4">
            {renderMobileCard(row, index)}
          </div>
        ))}
      </div>
    </Card>
  )
}
