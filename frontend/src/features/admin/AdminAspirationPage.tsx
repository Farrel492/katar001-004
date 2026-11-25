import { MessageSquare } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function AdminAspirationPage() {
  useDocumentTitle('Moderasi Aspirasi', true)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kotak Moderasi Aspirasi Warga"
        description="Saring masukan warga, beri label status (Diterima / Sedang Dibahas / Terlaksana), dan tambahkan tanggapan resmi pengurus."
      />

      <EmptyState
        icon={<MessageSquare className="w-8 h-8 text-[#22D3EE]" />}
        title="Antrean Moderasi Aspirasi"
        description="Daftar kiriman ide dan saran warga yang menunggu persetujuan publikasi akan muncul di sini pada modul Aspirasi."
      />
    </div>
  )
}
