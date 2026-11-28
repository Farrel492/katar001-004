import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Target,
  CheckCircle2,
  History,
  MapPin,
  Phone,
  Mail,
  Globe,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import {
  Container,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  EmptyState,
  ErrorState,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  getPublicProfile,
  getPublicMembers,
  type OrganizationProfileData,
  type OrganizationMemberData,
  ApiError,
} from '@/lib/api'

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export default function ProfilePage() {
  useDocumentTitle('Profil & Struktur')

  const [profile, setProfile] = useState<OrganizationProfileData | null>(null)
  const [members, setMembers] = useState<OrganizationMemberData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const [profileRes, membersRes] = await Promise.all([
        getPublicProfile(),
        getPublicMembers(),
      ])
      setProfile(profileRes.data)
      setMembers(membersRes.data)
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : 'Gagal memuat informasi profil organisasi. Silakan coba beberapa saat lagi.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="py-10 sm:py-14">
      <Container>
        {isLoading ? (
          <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-56 w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-60 w-full" />
              ))}
            </div>
          </div>
        ) : errorMsg ? (
          <ErrorState
            title="Gagal Memuat Profil Organisasi"
            message={errorMsg}
            retryLabel="Coba lagi"
            onRetry={loadData}
          />
        ) : !profile ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-[#22D3EE]" />}
            title="Profil Organisasi Belum Tersedia"
            description="Informasi profil dan struktur pengurus akan tampil setelah diperbarui oleh pengurus."
          />
        ) : (
          <div className="space-y-12">
            {/* 1. Pengantar / Hero Profil */}
            <section aria-labelledby="profile-heading">
              <Card featured className="overflow-hidden">
                <CardContent className="p-6 sm:p-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8">
                    {profile.logo_url ? (
                      <img
                        src={profile.logo_url}
                        alt={`Logo ${profile.name}`}
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-[var(--radius-lg)] object-cover border border-[var(--border-strong)] shrink-0"
                        loading="lazy"
                      />
                    ) : (
                        <div className="w-24 h-24 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-main)] font-extrabold text-2xl shrink-0">
                          {profile.short_name?.slice(0, 3).toUpperCase() || 'KT'}
                        </div>
                        )}

                        <div className="space-y-3 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="info">{profile.region_label}</Badge>
                          </div>
                          <h1
                            id="profile-heading"
                            className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#E6ECF8]"
                          >
                            {profile.name}
                          </h1>
                          {profile.tagline && (
                            <p className="text-base sm:text-lg font-medium text-[#22D3EE]">
                              {profile.tagline}
                            </p>
                          )}
                          <p className="text-base sm:text-[17px] text-[#9AA8C4] leading-relaxed max-w-3xl whitespace-pre-line">
                            {profile.about}
                          </p>
                        </div>
                      </div>
                </CardContent>
              </Card>
            </section>

            {/* 2. Visi, Misi & Nilai Utama */}
            <section aria-labelledby="vision-mission-heading" className="space-y-6">
              <h2
                id="vision-mission-heading"
                className="text-xl sm:text-2xl font-bold text-[#E6ECF8] flex items-center gap-2.5"
              >
                <Target className="w-6 h-6 text-[#22D3EE]" aria-hidden="true" />
                Visi, Misi & Nilai Utama
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visi */}
                <Card className="lg:col-span-5">
                  <CardHeader>
                    <CardTitle>Visi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base sm:text-[17px] text-[#E6ECF8] leading-relaxed whitespace-pre-line">
                      {profile.vision}
                    </p>
                  </CardContent>
                </Card>

                {/* Misi */}
                <Card className="lg:col-span-7">
                  <CardHeader>
                    <CardTitle>Misi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.missions && profile.missions.length > 0 ? (
                      <ol className="space-y-3">
                        {profile.missions.map((mission, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="w-7 h-7 rounded-lg bg-[#111B33] border border-cyan-800/60 text-[#22D3EE] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                              {idx + 1}
                            </span>
                            <span className="text-base text-[#E6ECF8] leading-relaxed">
                              {mission}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-[#9AA8C4]">Belum ada daftar misi.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Nilai Utama */}
              {profile.values && profile.values.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Sparkles className="w-5 h-5 text-[#8B7CF6]" aria-hidden="true" />
                      Nilai Utama Organisasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2.5">
                      {profile.values.map((val, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111B33] border border-slate-700/70 text-sm font-medium text-[#E6ECF8]"
                        >
                          <CheckCircle2
                            className="w-4 h-4 text-[#34D399] shrink-0"
                            aria-hidden="true"
                          />
                          <span>{val}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* 3. Sejarah Singkat */}
            {profile.history && (
              <section aria-labelledby="history-heading">
                <Card>
                  <CardHeader>
                    <CardTitle
                      id="history-heading"
                      className="flex items-center gap-2.5"
                    >
                      <History className="w-5 h-5 text-[#22D3EE]" aria-hidden="true" />
                      Sejarah Singkat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base sm:text-[17px] text-[#9AA8C4] leading-relaxed whitespace-pre-line">
                      {profile.history}
                    </p>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* 4. Struktur Pengurus */}
            <section aria-labelledby="members-heading" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h2
                    id="members-heading"
                    className="text-xl sm:text-2xl font-bold text-[#E6ECF8] flex items-center gap-2.5"
                  >
                    <Users className="w-6 h-6 text-[#22D3EE]" aria-hidden="true" />
                    Struktur Kepengurusan
                  </h2>
                  <p className="text-sm sm:text-base text-[#9AA8C4] mt-1">
                    Susunan pembina dan pengurus aktif Karang Taruna {profile.short_name}.
                  </p>
                </div>
              </div>

              {members.length === 0 ? (
                <EmptyState
                  icon={<Users className="w-8 h-8 text-[#22D3EE]" />}
                  title="Susunan Pengurus Belum Dipublikasikan"
                  description="Daftar pengurus sedang disiapkan oleh admin."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {members.map((member, idx) => (
                    <Card key={`${member.name}-${idx}`} className="flex flex-col">
                      <CardContent className="p-6 flex-1 flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          {member.photo_url ? (
                            <img
                              src={member.photo_url}
                              alt={`Foto ${member.name}`}
                              width={56}
                              height={56}
                              className="w-14 h-14 rounded-[var(--radius-sm)] object-cover border border-[var(--border-strong)] shrink-0"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="w-14 h-14 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center text-base font-bold text-[var(--accent)] shrink-0"
                              aria-hidden="true"
                            >
                              {getInitials(member.name)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <h3 className="font-bold text-base sm:text-lg text-[#E6ECF8] leading-snug break-words">
                              {member.name}
                            </h3>
                            <p className="text-sm font-semibold text-[#22D3EE] mt-0.5 break-words">
                              {member.position}
                            </p>
                          </div>
                        </div>

                        {(member.division || member.period) && (
                          <div className="flex flex-wrap gap-2">
                            {member.division && (
                              <Badge variant="draft">{member.division}</Badge>
                            )}
                            {member.period && (
                              <Badge variant="preview">Periode {member.period}</Badge>
                            )}
                          </div>
                        )}

                        {member.bio && (
                          <p className="text-sm text-[#9AA8C4] leading-relaxed">
                            {member.bio}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* 5. Kontak Resmi */}
            <section aria-labelledby="contact-heading">
              <Card>
                <CardHeader>
                  <CardTitle id="contact-heading" className="flex items-center gap-2.5">
                    <Phone className="w-5 h-5 text-[#22D3EE]" aria-hidden="true" />
                    Kontak & Alamat Resmi
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#9AA8C4]">
                          Alamat Sekretariat
                        </div>
                        <p className="text-sm sm:text-base text-[#E6ECF8] mt-1 leading-relaxed">
                          {profile.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#9AA8C4]">
                          Email Resmi
                        </div>
                        <a
                          href={`mailto:${profile.email}`}
                          className="inline-flex items-center min-h-[44px] text-sm sm:text-base text-[#E6ECF8] hover:text-[#22D3EE] transition-colors break-all"
                        >
                          {profile.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#9AA8C4]">
                      Kanal Resmi Komunikasi
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {profile.whatsapp && (
                        <a
                          href={`https://wa.me/${profile.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-950/60 border border-emerald-800/70 text-emerald-300 hover:bg-emerald-900/60 text-sm font-medium transition-colors"
                        >
                          <Phone className="w-4 h-4" aria-hidden="true" />
                          <span>WhatsApp Resmi</span>
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}

                      {profile.instagram && (
                        <a
                          href={profile.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#111B33] border border-slate-700/70 text-[#E6ECF8] hover:border-[#22D3EE] hover:text-[#22D3EE] text-sm font-medium transition-colors"
                        >
                          <Globe className="w-4 h-4" aria-hidden="true" />
                          <span>Instagram</span>
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}

                      {profile.facebook && (
                        <a
                          href={profile.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#111B33] border border-slate-700/70 text-[#E6ECF8] hover:border-[#22D3EE] hover:text-[#22D3EE] text-sm font-medium transition-colors"
                        >
                          <Globe className="w-4 h-4" aria-hidden="true" />
                          <span>Facebook</span>
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}

                      {profile.youtube && (
                        <a
                          href={profile.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#111B33] border border-slate-700/70 text-[#E6ECF8] hover:border-[#22D3EE] hover:text-[#22D3EE] text-sm font-medium transition-colors"
                        >
                          <Globe className="w-4 h-4" aria-hidden="true" />
                          <span>YouTube</span>
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </Container>
    </div>
  )
}
