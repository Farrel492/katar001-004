import { MessageSquare } from 'lucide-react'
import { Container, EmptyState, PageHeader } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function AspirationPage() {
  useDocumentTitle('Aspirasi Warga')

  return (
    <div className="py-10">
      <Container>
        <PageHeader
          title="Saran & Aspirasi Warga"
          description="Sampaikan gagasan, masukan, atau kritik membangun untuk kemajuan lingkungan RT 001 RW 004 tanpa kewajiban membuat akun."
        />

        <EmptyState
          icon={<MessageSquare className="w-8 h-8 text-[#22D3EE]" />}
          title="Formulir Aspirasi Warga Sedang Disiapkan"
          description="Formulir pengiriman aspirasi warga beserta antrean moderasi publik akan diaktifkan pada tahapan modul Aspirasi."
        />
      </Container>
    </div>
  )
}
