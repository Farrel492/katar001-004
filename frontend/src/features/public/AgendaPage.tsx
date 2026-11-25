import { Calendar } from 'lucide-react'
import { Container, EmptyState, PageHeader } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function AgendaPage() {
  useDocumentTitle('Agenda Kegiatan')

  return (
    <div className="py-10">
      <Container>
        <PageHeader
          title="Agenda Kegiatan Mendatang"
          description="Jadwal acara, kerja bakti, dan agenda pemuda di lingkungan RT 001 RW 004."
        />

        <EmptyState
          icon={<Calendar className="w-8 h-8 text-[#22D3EE]" />}
          title="Belum Ada Agenda Mendatang"
          description="Saat ini belum ada jadwal kegiatan baru yang dipublikasikan. Informasi acara mendatang akan diumumkan di halaman ini."
        />
      </Container>
    </div>
  )
}
