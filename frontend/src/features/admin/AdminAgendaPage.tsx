import { Calendar } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function AdminAgendaPage() {
  useDocumentTitle('Kelola Agenda & Galeri', true)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Agenda & Arsip Dokumentasi"
        description="Buat agenda baru, unggah foto kegiatan, dan atur status Draft/Preview/Published."
      />

      <EmptyState
        icon={<Calendar className="w-8 h-8 text-[#22D3EE]" />}
        title="Formulir Kelola Agenda & Dokumentasi"
        description="Fitur unggah multi-foto, optimasi gambar otomatis, dan jadwal kegiatan akan dihubungkan ke API backend pada modul Acara & Dokumentasi."
      />
    </div>
  )
}
