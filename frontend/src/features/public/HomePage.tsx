import { Link } from 'react-router-dom'
import {
  Users,
  Calendar,
  Wallet,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Container } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function HomePage() {
  useDocumentTitle('Beranda')

  const features = [
    {
      to: '/profil',
      title: 'Profil & Struktur',
      desc: 'Mengenal arah visi, misi, dan susunan kepengurusan Karang Taruna RT 001.',
      icon: Users,
    },
    {
      to: '/agenda',
      title: 'Agenda Kegiatan',
      desc: 'Informasi rencana kegiatan kepemudaan dan lingkungan mendatang.',
      icon: Calendar,
    },
    {
      to: '/keuangan',
      title: 'Transparansi Keuangan',
      desc: 'Laporan kas terbuka dan terpisah antara Kas RT 001 dan Karang Taruna.',
      icon: Wallet,
    },
    {
      to: '/aspirasi',
      title: 'Aspirasi Warga',
      desc: 'Kanal saran dan ide warga tanpa perlu login untuk kemajuan lingkungan.',
      icon: MessageSquare,
    },
  ]

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section (Pure CSS Gradient, No 3D) */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-800/60 gradient-hero-bg">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/70 text-cyan-300 text-xs sm:text-sm font-semibold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-[#22D3EE]" />
              <span>Portal Resmi RT 001 RW 004 &bull; Kelurahan Jatibening Baru</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Membangun Sinergi, Menguatkan Transparansi Lingkungan
            </h1>

            <p className="text-base sm:text-lg text-[#9AA8C4] leading-relaxed max-w-2xl mx-auto">
              Platform keterbukaan informasi publik untuk warga lingkungan RT 001 RW 004. Akses profil pengurus, agenda kegiatan, laporan keuangan terbuka, serta kanal aspirasi tanpa perlu akun.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button size="lg" to="/keuangan">
                Lihat Laporan Keuangan <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="secondary" to="/aspirasi">
                Sampaikan Aspirasi
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Feature Cards Section */}
      <section>
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Layanan Informasi Publik
            </h2>
            <p className="text-sm sm:text-base text-[#9AA8C4]">
              Semua modul dapat diakses langsung oleh seluruh lapisan masyarakat secara terbuka.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group focus-visible:outline-2 focus-visible:outline-[#22D3EE] rounded-2xl block"
                >
                  <Card className="h-full hover:border-slate-700 hover:bg-[#0E172C] transition-all duration-200">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-[#111B33] border border-slate-700/60 flex items-center justify-center text-[#22D3EE] mb-4 group-hover:scale-105 transition-transform duration-200">
                        <Icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="group-hover:text-[#22D3EE] transition-colors">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-[#9AA8C4] leading-relaxed">
                        {item.desc}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </Container>
      </section>
    </div>
  )
}
