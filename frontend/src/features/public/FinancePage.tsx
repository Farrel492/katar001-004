import { Wallet, DollarSign } from 'lucide-react'
import { Container, EmptyState, PageHeader, StatCard } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatRupiah } from '@/lib/format'

export default function FinancePage() {
  useDocumentTitle('Transparansi Keuangan')

  return (
    <div className="py-10">
      <Container>
        <PageHeader
          title="Transparansi Keuangan Warga"
          description="Pencatatan kas terbuka antara Kas RT 001 dan Kas Karang Taruna secara terpisah."
        />

        {/* Placeholder StatCards Ringkasan Saldo (Data Terbuka) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Saldo Awal Kas RT"
            value={formatRupiah(0)}
            description="[Data belum dipublikasikan]"
            icon={<Wallet className="w-5 h-5" />}
          />
          <StatCard
            title="Pemasukan Bulan Ini"
            value={formatRupiah(0)}
            description="[Data belum dipublikasikan]"
            icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          />
          <StatCard
            title="Pengeluaran Bulan Ini"
            value={formatRupiah(0)}
            description="[Data belum dipublikasikan]"
            icon={<DollarSign className="w-5 h-5 text-rose-400" />}
          />
          <StatCard
            title="Saldo Akhir Kas RT"
            value={formatRupiah(0)}
            description="[Data belum dipublikasikan]"
            icon={<Wallet className="w-5 h-5 text-cyan-400" />}
            featured
          />
        </div>

        <EmptyState
          icon={<Wallet className="w-8 h-8 text-[#22D3EE]" />}
          title="Laporan Transaksi Belum Dipublikasikan"
          description="Rincian buku kas transaksi masuk dan keluar serta file unduhan laporan (PDF/Excel) akan tersedia setelah disetujui dan dipublikasikan oleh penanggung jawab keuangan."
        />
      </Container>
    </div>
  )
}
