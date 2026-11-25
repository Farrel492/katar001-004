import { Image } from 'lucide-react'
import { Container, EmptyState, PageHeader } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function DocumentationPage() {
  useDocumentTitle('Dokumentasi')

  return (
    <div className="py-10">
      <Container>
        <PageHeader
          title="Dokumentasi Acara & Kegiatan"
          description="Galeri foto dan arsip kegiatan Karang Taruna RT 001 RW 004 yang telah terlaksana."
        />

        <EmptyState
          icon={<Image className="w-8 h-8 text-[#22D3EE]" />}
          title="Belum Ada Dokumentasi Kegiatan"
          description="Foto dan rangkuman kegiatan yang telah selesai diselenggarakan akan diunggah dan ditampilkan pada arsip dokumentasi ini."
        />
      </Container>
    </div>
  )
}
