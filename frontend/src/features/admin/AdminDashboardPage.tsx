import { Users, Calendar, Wallet, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, PageHeader, StatCard, Badge } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function AdminDashboardPage() {
  // noIndex = true menambahkan <meta name="robots" content="noindex, nofollow" />
  useDocumentTitle('Dashboard Admin', true)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ringkasan Administrasi"
        description="Pusat kendali status konten, agenda, transparansi kas, dan moderasi saran warga RT 001 RW 004."
        badge={<Badge variant="preview">Admin Area</Badge>}
      />

      {/* Ringkasan Status Konten */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Anggota Pengurus"
          value="[Belum diisi]"
          description="Status: Menunggu input data"
          icon={<Users className="w-5 h-5 text-blue-400" />}
        />
        <StatCard
          title="Agenda Mendatang"
          value="[Belum diisi]"
          description="Status: Belum ada jadwal"
          icon={<Calendar className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          title="Saldo Kas Terkini"
          value="Rp [Belum diisi]"
          description="Kas RT & Karang Taruna"
          icon={<Wallet className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          title="Aspirasi Masuk"
          value="[0]"
          description="Kotak moderasi admin"
          icon={<MessageSquare className="w-5 h-5 text-cyan-400" />}
        />
      </div>

      {/* Kartu Informasi Panduan Alur Konten */}
      <Card>
        <CardHeader>
          <CardTitle>Alur Kerja Publikasi Konten (PRD Bagian 8)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-[#9AA8C4]">
          <p>
            Sistem menggunakan 3 status konten untuk mencegah kesalahan tayang ke warga:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#E6ECF8]">
            <li>
              <strong className="text-slate-300">Draft:</strong> Konten baru/koreksi sedang disiapkan, hanya terlihat oleh admin.
            </li>
            <li>
              <strong className="text-violet-300">Preview:</strong> Pratinjau konten pada rute internal sebelum resmi dipublikasikan.
            </li>
            <li>
              <strong className="text-emerald-300">Published:</strong> Konten resmi tayang di halaman publik warga.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
