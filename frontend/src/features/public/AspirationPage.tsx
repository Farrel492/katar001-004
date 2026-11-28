import React, { useState, useEffect, useCallback } from 'react'
import {
  Send,
  Search,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  User,
  Inbox,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Select,
  Textarea,
  Badge,
  FormField,
  Toast,
  type ToastType,
  Spinner,
  EmptyState,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  submitAspiration,
  trackAspiration,
  getPublicAspirations,
  type PublicAspirationData,
  type AspirationTrackingData,
  type AspirationStatus,
  type AspirationCategory,
  ApiError,
} from '@/lib/api'
import { formatDateTime } from '@/lib/format'

const CATEGORY_OPTIONS = [
  { value: 'saran', label: 'Saran & Masukan' },
  { value: 'keluhan', label: 'Keluhan Lingkungan' },
  { value: 'pertanyaan', label: 'Pertanyaan' },
  { value: 'usulan_kegiatan', label: 'Usulan Kegiatan' },
  { value: 'lainnya', label: 'Lainnya' },
]

const CATEGORY_NAMES: Record<AspirationCategory, string> = {
  saran: 'Saran',
  keluhan: 'Keluhan',
  pertanyaan: 'Pertanyaan',
  usulan_kegiatan: 'Usulan Kegiatan',
  lainnya: 'Lainnya',
}

const STATUS_BADGES: Record<
  AspirationStatus,
  { label: string; variant: 'info' | 'draft' | 'warning' | 'published' | 'danger' }
> = {
  new: { label: 'Terkirim (Menunggu Verifikasi)', variant: 'info' },
  read: { label: 'Ditinjau Pengurus', variant: 'draft' },
  in_progress: { label: 'Sedang Ditindaklanjuti', variant: 'warning' },
  done: { label: 'Selesai / Terlaksana', variant: 'published' },
  rejected: { label: 'Tidak Dapat Diproses', variant: 'danger' },
  spam: { label: 'Tidak Valid', variant: 'danger' },
}

export default function AspirationPage() {
  useDocumentTitle('Saran & Aspirasi Warga')

  // State Form Pengiriman
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [category, setCategory] = useState('saran')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('') // Field "website" untuk bot

  const [submitting, setSubmitting] = useState(false)
  const [submittedCode, setSubmittedCode] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  // State Pelacakan
  const [trackingInput, setTrackingInput] = useState('')
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingResult, setTrackingResult] = useState<AspirationTrackingData | null>(null)
  const [trackingError, setTrackingError] = useState<string | null>(null)

  // State Daftar Aspirasi Publik
  const [publicList, setPublicList] = useState<PublicAspirationData[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    setToast({ message: msg, type })
    window.setTimeout(() => setToast(null), 4000)
  }, [])

  // Muat daftar aspirasi publik
  const loadPublicAspirations = useCallback(async (page: number) => {
    try {
      setListLoading(true)
      const res = await getPublicAspirations(page)
      setPublicList(res.data)
      setCurrentPage(res.current_page)
      setLastPage(res.last_page)
      setTotalItems(res.total)
    } catch {
      // Abaikan error jaringan awal
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPublicAspirations(currentPage)
  }, [loadPublicAspirations, currentPage])

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim()) {
      showToast('Subjek aspirasi wajib diisi.', 'error')
      return
    }

    if (message.trim().length < 10) {
      showToast('Isi aspirasi minimal 10 karakter.', 'error')
      return
    }

    try {
      setSubmitting(true)
      const res = await submitAspiration({
        name: name.trim() || undefined,
        contact: contact.trim() || undefined,
        category,
        subject: subject.trim(),
        message: message.trim(),
        website: honeypot || undefined,
      })

      setSubmittedCode(res.tracking_code)
      showToast('Aspirasi Anda berhasil dikirim!', 'success')

      // Reset form
      setName('')
      setContact('')
      setCategory('saran')
      setSubject('')
      setMessage('')
      setHoneypot('')
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal mengirim aspirasi. Silakan coba lagi.'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Lacak Status
  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = trackingInput.trim().toUpperCase()
    if (!code) {
      setTrackingError('Silakan masukkan kode pelacakan.')
      return
    }

    try {
      setTrackingLoading(true)
      setTrackingError(null)
      const data = await trackAspiration(code)
      setTrackingResult(data)
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Kode pelacakan tidak ditemukan atau terjadi kesalahan.'
      setTrackingError(msg)
      setTrackingResult(null)
    } finally {
      setTrackingLoading(false)
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="py-8 sm:py-12 space-y-12 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        </div>
      )}

          {/* Header Halaman */}
          <div className="space-y-2 max-w-[70ch]">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
              Saran & Aspirasi Warga
            </h1>
              <p className="text-base sm:text-[17px] text-[var(--text-muted)] leading-relaxed">
                Sampaikan masukan untuk lingkungan RT 001 RW 004 dan pantau tindak lanjutnya menggunakan kode pelacakan.
              </p>
          </div>

          {/* Bagian 1: Sukses Kirim / Form Kirim */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Kolom Kiri: Form Pengiriman Aspirasi (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {submittedCode ? (
                <Card className="bg-[#0C1427] border border-emerald-500/40 shadow-2xl overflow-hidden">
                  <CardContent className="p-6 sm:p-8 space-y-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-[#E6ECF8]">
                        Aspirasi Anda Berhasil Dikirim!
                      </h2>
                      <p className="text-xs sm:text-sm text-[#9AA8C4] max-w-md mx-auto">
                        Terima kasih atas kepedulian Anda. Mohon catat dan simpan kode pelacakan di bawah ini untuk memeriksa status tindak lanjut pengurus sewaktu-waktu.
                      </p>
                    </div>

                    {/* Kode Pelacakan Besar */}
                    <div className="p-4 bg-[#060B18] border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-center sm:text-left">
                        <span className="text-[11px] text-[#9AA8C4] block uppercase tracking-wider font-semibold">
                          Kode Pelacakan Anda:
                        </span>
                        <span className="font-mono text-xl sm:text-2xl font-black text-[#22D3EE] tracking-widest">
                          {submittedCode}
                        </span>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCopy(submittedCode)}
                        className="min-h-[44px] px-4 cursor-pointer shrink-0"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="w-4 h-4 mr-1.5 text-emerald-300" />
                            Tersalin!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1.5" />
                            Salin Kode
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex justify-center pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSubmittedCode(null)
                        }}
                        className="min-h-[44px]"
                      >
                        Kirim Aspirasi Lainnya
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-[#0C1427] border-slate-800/80 shadow-xl">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-xl font-bold text-[#E6ECF8]">
                      Formulir Aspirasi Warga
                    </CardTitle>
                    <CardDescription className="text-xs text-[#9AA8C4]">
                      Isi formulir di bawah. Nama dan kontak bersifat opsional demi kenyamanan privasi Anda.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6 pt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Honeypot Field (Tersembunyi total dari warga & screen reader) */}
                      <div
                        aria-hidden="true"
                        style={{
                          opacity: 0,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: 0,
                          width: 0,
                          zIndex: -1,
                          overflow: 'hidden',
                        }}
                      >
                        <label htmlFor="hp_website">Website</label>
                        <input
                          id="hp_website"
                          type="text"
                          name="website"
                          tabIndex={-1}
                          autoComplete="off"
                          value={honeypot}
                          onChange={(e) => setHoneypot(e.target.value)}
                        />
                      </div>

                      {/* Kategori */}
                      <FormField htmlFor="category" label="Kategori Aspirasi" required>
                        <Select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          options={CATEGORY_OPTIONS}
                        />
                      </FormField>

                      {/* Subjek */}
                      <FormField htmlFor="subject" label="Subjek / Judul Ringkas" required>
                        <Input
                          id="subject"
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Contoh: Perbaikan Lampu Jalan Gang 2 / Usulan Kerja Bakti"
                          maxLength={120}
                          required
                        />
                      </FormField>

                      {/* Pesan */}
                      <FormField
                        htmlFor="message"
                        label="Isi Aspirasi atau Masukan"
                        required
                        helperText={`${message.length} / 2000 karakter (minimal 10 karakter)`}
                      >
                        <Textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Uraikan secara jelas saran, keluhan, atau ide kegiatan yang ingin Anda sampaikan..."
                          rows={5}
                          maxLength={2000}
                          required
                        />
                      </FormField>

                      {/* Nama (Opsional) & Kontak (Opsional) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <FormField htmlFor="name" label="Nama Anda (Opsional)">
                          <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Budi (RT 001)"
                            maxLength={80}
                          />
                        </FormField>

                        <FormField htmlFor="contact" label="Kontak WhatsApp / Email (Opsional)">
                          <Input
                            id="contact"
                            type="text"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            placeholder="0812xxxx / email@anda.com"
                            maxLength={100}
                          />
                        </FormField>
                      </div>

                      {/* Penjelasan Privasi */}
                      <div className="p-3 bg-[#060B18] border border-slate-800/80 rounded-xl flex items-start gap-2.5 text-xs text-[#9AA8C4]">
                        <ShieldCheck className="w-4 h-4 text-[#22D3EE] shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          <strong>Privasi Terjamin:</strong> Identitas Anda tidak akan dibagikan ke pihak luar. Kontak hanya digunakan jika pengurus perlu mengonfirmasi rincian usulan Anda.
                        </p>
                      </div>

                      {/* Tombol Kirim */}
                      <div className="pt-2">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={submitting}
                          className="w-full min-h-[46px] cursor-pointer text-sm font-semibold"
                        >
                          {submitting ? (
                            <>
                              <Spinner className="w-4 h-4 mr-2" />
                              Mengirimkan Aspirasi...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Kirim Aspirasi Sekarang
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Kolom Kanan: Cek Status Pelacakan (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-[#0C1427] border-slate-800/80 shadow-xl">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-xl font-bold text-[#E6ECF8] flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#22D3EE]" />
                    Cek Status Aspirasi
                  </CardTitle>
                  <CardDescription className="text-xs text-[#9AA8C4]">
                    Pantau proses verifikasi dan tindak lanjut dari pengurus menggunakan kode pelacakan.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-4 space-y-4">
                  <form onSubmit={handleTrack} className="space-y-3">
                    <FormField htmlFor="track_code" label="Masukkan Kode Pelacakan">
                      <div className="flex gap-2">
                        <Input
                          id="track_code"
                          type="text"
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                          placeholder="Contoh: ASP-ABCD-1234"
                          className="font-mono"
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={trackingLoading}
                          className="shrink-0 min-h-[44px] px-4 cursor-pointer"
                        >
                          {trackingLoading ? <Spinner className="w-4 h-4" /> : 'Lacak'}
                        </Button>
                      </div>
                    </FormField>
                  </form>

                  {/* Error Pelacakan */}
                  {trackingError && (
                    <div className="p-3.5 bg-red-950/40 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                      <span>{trackingError}</span>
                    </div>
                  )}

                  {/* Hasil Pelacakan */}
                  {trackingResult && (
                    <div className="p-4 bg-[#060B18] border border-cyan-500/30 rounded-2xl space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <span className="font-mono text-xs font-bold text-[#22D3EE]">
                          {trackingResult.tracking_code}
                        </span>
                        <Badge variant={STATUS_BADGES[trackingResult.status]?.variant || 'draft'}>
                          {STATUS_BADGES[trackingResult.status]?.label || trackingResult.status}
                        </Badge>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-[#9AA8C4] uppercase tracking-wider block">
                          {CATEGORY_NAMES[trackingResult.category] || trackingResult.category}
                        </span>
                        <h3 className="text-sm font-bold text-[#E6ECF8] mt-0.5">
                          {trackingResult.subject}
                        </h3>
                        <span className="text-[11px] text-[#9AA8C4] block mt-1">
                          Diajukan pada: {formatDateTime(trackingResult.created_at)}
                        </span>
                      </div>

                      {/* Tanggapan Resmi Pengurus */}
                      {trackingResult.public_reply ? (
                        <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl space-y-1">
                          <span className="text-xs font-bold text-[#22D3EE] block">
                            Tanggapan Pengurus:
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {trackingResult.public_reply}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-[#9AA8C4] italic">
                          Aspirasi Anda sedang dalam antrean pemeriksaan oleh pengurus RT 001 RW 004.
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bagian 2: Aspirasi yang Ditampilkan (Transparansi Publik) */}
          <div className="space-y-6 pt-6 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-[#E6ECF8] tracking-tight">
                  Aspirasi & Tindak Lanjut Publik
                </h2>
                <p className="text-xs sm:text-sm text-[#9AA8C4]">
                  Daftar masukan warga yang telah disetujui untuk ditampilkan secara terbuka sebagai bukti transparansi.
                </p>
              </div>
              <span className="text-xs text-[#9AA8C4] self-start sm:self-auto px-3 py-1 bg-[#0C1427] border border-slate-800 rounded-lg">
                Total {totalItems} Aspirasi Terpublikasi
              </span>
            </div>

            {listLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Spinner />
                <p className="text-sm text-[#9AA8C4]">Memuat daftar aspirasi warga...</p>
              </div>
            ) : publicList.length === 0 ? (
              <EmptyState
                icon={<Inbox className="w-8 h-8 text-[#22D3EE]" />}
                title="Belum Ada Aspirasi yang Dipublikasikan"
                description="Aspirasi warga yang telah disetujui dan ditindaklanjuti akan muncul di bagian ini."
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publicList.map((item) => (
                    <Card
                      key={item.id}
                      className="bg-[#0C1427] border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
                    >
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800/80 text-[#22D3EE]">
                            {CATEGORY_NAMES[item.category] || item.category}
                          </span>
                          <span className="text-xs text-[#9AA8C4]">
                            {formatDateTime(item.created_at)}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-[#E6ECF8]">
                            {item.subject}
                          </h3>
                          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed whitespace-pre-wrap break-words line-clamp-4">
                            {item.message}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-[#9AA8C4]">
                          <span className="flex items-center gap-1 font-medium text-slate-400">
                            <User className="w-3.5 h-3.5" />
                            Oleh: {item.author_name}
                          </span>
                        </div>

                        {/* Balasan Pengurus */}
                        {item.public_reply && (
                          <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl space-y-1">
                            <span className="text-[11px] font-bold text-[#22D3EE] block">
                              Tanggapan Pengurus:
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {item.public_reply}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Paginasi Daftar Publik */}
                {lastPage > 1 && (
                  <div className="flex items-center justify-between p-3 bg-[#0C1427] border border-slate-800/80 rounded-xl text-xs text-[#9AA8C4]">
                    <span>
                      Halaman {currentPage} dari {lastPage}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="min-h-[40px]"
                      >
                        Sebelumnya
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentPage >= lastPage}
                        onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                        className="min-h-[40px]"
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
      )
}
