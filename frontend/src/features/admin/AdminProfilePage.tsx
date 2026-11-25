import { Users } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function AdminProfilePage() {
  useDocumentTitle('Kelola Profil & Struktur', true)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Profil & Struktur Pengurus"
        description="Kelola susunan pengurus, visi-misi, dan urutan tampilan (Ketua/Pembina di urutan teratas)."
      />

      <EmptyState
        icon={<Users className="w-8 h-8 text-[#22D3EE]" />}
        title="Formulir Kelola Struktur Pengurus"
        description="Fitur tambah anggota, edit foto pengurus, dan pengaturan urutan divisi akan dihubungkan ke API backend pada modul Profil."
      />
    </div>
  )
}
