import { Users } from 'lucide-react'
import { Container, EmptyState, PageHeader } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function ProfilePage() {
  useDocumentTitle('Profil & Struktur')

  return (
    <div className="py-10">
      <Container>
        <PageHeader
          title="Visi, Misi & Struktur Organisasi"
          description="Arah pergerakan organisasi dan susunan pengurus Karang Taruna RT 001 RW 004."
        />

        <EmptyState
          icon={<Users className="w-8 h-8 text-[#22D3EE]" />}
          title="Data Struktur Pengurus Belum Diisi"
          description="Informasi susunan kepengurusan, visi-misi, dan divisi Karang Taruna akan ditampilkan setelah dipublikasikan oleh admin."
        />
      </Container>
    </div>
  )
}
