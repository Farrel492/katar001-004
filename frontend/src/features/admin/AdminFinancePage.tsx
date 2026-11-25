import { Wallet } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function AdminFinancePage() {
  useDocumentTitle('Kelola Keuangan', true)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Kas & Transparansi Keuangan"
        description="Pencatatan transaksi kas masuk/keluar, impor data awal dari Excel, dan ekspor laporan."
      />

      <EmptyState
        icon={<Wallet className="w-8 h-8 text-[#22D3EE]" />}
        title="Panel Pengelolaan Buku Kas"
        description="Formulir input transaksi Rupiah, pemisahan Kas RT 001 dan Kas Karang Taruna, serta kalkulator saldo database akan dihubungkan pada modul Keuangan."
      />
    </div>
  )
}
