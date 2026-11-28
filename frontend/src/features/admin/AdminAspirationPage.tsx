import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  Search,
  Eye,
  Trash2,
  Copy,
  Check,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Select,
  Textarea,
  Badge,
  Modal,
  ConfirmDialog,
  FormField,
  Toast,
  type ToastType,
  Spinner,
  EmptyState,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  getAdminAspirations,
  getAdminAspirationStats,
  getAdminAspiration,
  updateAdminAspiration,
  deleteAdminAspiration,
  type AspirationData,
  type AspirationStats,
  type AspirationStatus,
  type AspirationCategory,
  ApiError,
} from '@/lib/api'
import { formatDateTime } from '@/lib/format'

const CATEGORY_LABELS: Record<AspirationCategory, string> = {
  saran: 'Saran',
  keluhan: 'Keluhan',
  pertanyaan: 'Pertanyaan',
  usulan_kegiatan: 'Usulan Kegiatan',
  lainnya: 'Lainnya',
}

const STATUS_CONFIG: Record<
  AspirationStatus,
  { label: string; variant: 'info' | 'draft' | 'warning' | 'published' | 'danger' }
> = {
  new: { label: 'Baru', variant: 'info' },
  read: { label: 'Dibaca', variant: 'draft' },
  in_progress: { label: 'Diproses', variant: 'warning' },
  done: { label: 'Selesai', variant: 'published' },
  rejected: { label: 'Ditolak', variant: 'danger' },
  spam: { label: 'Spam', variant: 'danger' },
}

export default function AdminAspirationPage() {
  useDocumentTitle('Moderasi Aspirasi', true)

  const [aspirations, setAspirations] = useState<AspirationData[]>([])
  const [stats, setStats] = useState<AspirationStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [lastPage, setLastPage] = useState<number>(1)
  const [totalItems, setTotalItems] = useState<number>(0)

  // Filter & Pencarian
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // State Modal Detail / Edit
  const [selectedAspiration, setSelectedAspiration] = useState<AspirationData | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)
  const [detailLoading, setDetailLoading] = useState<boolean>(false)
  const [copiedCode, setCopiedCode] = useState<boolean>(false)

  // Form State dalam Modal
  const [formStatus, setFormStatus] = useState<AspirationStatus>('new')
  const [formInternalNote, setFormInternalNote] = useState<string>('')
  const [formPublicReply, setFormPublicReply] = useState<string>('')
  const [formIsPublic, setFormIsPublic] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Confirm Delete
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 4000)
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [res, resStats] = await Promise.all([
        getAdminAspirations({
          status: selectedStatus || undefined,
          category: selectedCategory || undefined,
          search: searchQuery || undefined,
          page: currentPage,
        }),
        getAdminAspirationStats().catch(() => null),
      ])

      setAspirations(res.data)
      setCurrentPage(res.current_page)
      setLastPage(res.last_page)
      setTotalItems(res.total)
      if (resStats) setStats(resStats)
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal memuat daftar aspirasi.'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedStatus, selectedCategory, searchQuery, currentPage, showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenDetail = async (item: AspirationData) => {
    try {
      setDetailLoading(true)
      setIsDetailOpen(true)
      // Mengambil detail lengkap (backend otomatis menandai new -> read)
      const full = await getAdminAspiration(item.id)
      setSelectedAspiration(full)
      setFormStatus(full.status)
      setFormInternalNote(full.internal_note || '')
      setFormPublicReply(full.public_reply || '')
      setFormIsPublic(full.is_public)

      // Perbarui status lokal di list jika berubah dari new ke read
      if (item.status === 'new') {
        setAspirations((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, status: 'read' } : a)),
        )
        if (stats && stats.new > 0) {
          setStats({ ...stats, new: stats.new - 1, read: stats.read + 1 })
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal memuat rincian aspirasi.'
      showToast(msg, 'error')
      setIsDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSaveDetail = async () => {
    if (!selectedAspiration) return

    // Validasi is_public vs spam/rejected
    if (formIsPublic && (formStatus === 'spam' || formStatus === 'rejected')) {
      showToast('Aspirasi dengan status spam atau ditolak tidak boleh ditampilkan ke publik.', 'error')
      return
    }

    try {
      setSubmitting(true)
      const updated = await updateAdminAspiration(selectedAspiration.id, {
        status: formStatus,
        internal_note: formInternalNote.trim() || null,
        public_reply: formPublicReply.trim() || null,
        is_public: formIsPublic,
      })

      showToast('Aspirasi berhasil diperbarui.', 'success')
      setSelectedAspiration(updated)
      setIsDetailOpen(false)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal memperbarui aspirasi.'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkSpam = async () => {
    if (!selectedAspiration) return
    try {
      setSubmitting(true)
      const updated = await updateAdminAspiration(selectedAspiration.id, {
        status: 'spam',
        is_public: false,
      })
      showToast('Aspirasi ditandai sebagai spam.', 'success')
      setSelectedAspiration(updated)
      setIsDetailOpen(false)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menandai spam.'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      setDeleteSubmitting(true)
      await deleteAdminAspiration(deletingId)
      showToast('Aspirasi berhasil dihapus.', 'success')
      setIsDeleteOpen(false)
      if (selectedAspiration?.id === deletingId) {
        setIsDetailOpen(false)
      }
      setDeletingId(null)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menghapus aspirasi.'
      showToast(msg, 'error')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        </div>
      )}

        {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#E6ECF8] tracking-tight">
            Kotak Saran & Aspirasi Warga
          </h1>
          <p className="text-xs sm:text-sm text-[#9AA8C4] mt-1">
            Moderasi ide, keluhan, dan masukan dari warga RT 001 RW 004 secara aman dan transparan.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="min-h-[44px] cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </Button>
      </div>

      {/* Kartu Ringkasan Status */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card
          className={`cursor-pointer transition-all border ${selectedStatus === '' ? 'border-[#2F6BFF] bg-[#111B33]' : 'border-slate-800/80 bg-[#0C1427]'
            }`}
          onClick={() => { setSelectedStatus(''); setCurrentPage(1); }}
        >
          <CardContent className="p-4">
            <span className="text-xs text-[#9AA8C4] block">Semua</span>
            <span className="text-2xl font-extrabold text-[#E6ECF8] mt-1 block">
              {stats?.total ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border ${selectedStatus === 'new' ? 'border-cyan-500 bg-cyan-950/20' : 'border-slate-800/80 bg-[#0C1427]'
            }`}
          onClick={() => { setSelectedStatus('new'); setCurrentPage(1); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9AA8C4]">Baru</span>
              {stats && stats.new > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
              )}
            </div>
            <span className="text-2xl font-extrabold text-[#22D3EE] mt-1 block">
              {stats?.new ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border ${selectedStatus === 'in_progress' ? 'border-amber-500 bg-amber-950/20' : 'border-slate-800/80 bg-[#0C1427]'
            }`}
          onClick={() => { setSelectedStatus('in_progress'); setCurrentPage(1); }}
        >
          <CardContent className="p-4">
            <span className="text-xs text-[#9AA8C4] block">Diproses</span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
              {stats?.in_progress ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border ${selectedStatus === 'done' ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800/80 bg-[#0C1427]'
            }`}
          onClick={() => { setSelectedStatus('done'); setCurrentPage(1); }}
        >
          <CardContent className="p-4">
            <span className="text-xs text-[#9AA8C4] block">Selesai</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
              {stats?.done ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border ${selectedStatus === 'rejected' ? 'border-red-500 bg-red-950/20' : 'border-slate-800/80 bg-[#0C1427]'
            }`}
          onClick={() => { setSelectedStatus('rejected'); setCurrentPage(1); }}
        >
          <CardContent className="p-4">
            <span className="text-xs text-[#9AA8C4] block">Ditolak</span>
            <span className="text-2xl font-extrabold text-red-400 mt-1 block">
              {stats?.rejected ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border ${selectedStatus === 'spam' ? 'border-slate-600 bg-slate-900/40' : 'border-slate-800/80 bg-[#0C1427]'
            }`}
          onClick={() => { setSelectedStatus('spam'); setCurrentPage(1); }}
        >
          <CardContent className="p-4">
            <span className="text-xs text-[#9AA8C4] block">Spam</span>
            <span className="text-2xl font-extrabold text-[#9AA8C4] mt-1 block">
              {stats?.spam ?? 0}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter dan Kotak Pencarian */}
      <Card className="bg-[#0C1427] border-slate-800/80">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Input Pencarian */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA8C4]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Cari subjek, isi, atau kode..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#060B18] border border-slate-700/80 rounded-xl text-sm text-[#E6ECF8] placeholder-[#9AA8C4]/60 focus:outline-none focus:border-[#2F6BFF] min-h-[44px]"
              />
            </div>

            {/* Filter Status */}
            <div>
              <Select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                options={[
                  { value: '', label: 'Semua Status' },
                  { value: 'new', label: 'Baru' },
                  { value: 'read', label: 'Dibaca' },
                  { value: 'in_progress', label: 'Diproses' },
                  { value: 'done', label: 'Selesai' },
                  { value: 'rejected', label: 'Ditolak' },
                  { value: 'spam', label: 'Spam' },
                ]}
              />
            </div>

            {/* Filter Kategori */}
            <div>
              <Select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                options={[
                  { value: '', label: 'Semua Kategori' },
                  { value: 'saran', label: 'Saran' },
                  { value: 'keluhan', label: 'Keluhan' },
                  { value: 'pertanyaan', label: 'Pertanyaan' },
                  { value: 'usulan_kegiatan', label: 'Usulan Kegiatan' },
                  { value: 'lainnya', label: 'Lainnya' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daftar Aspirasi */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <Spinner />
          <p className="text-sm text-[#9AA8C4]">Memuat data aspirasi warga...</p>
        </div>
      ) : aspirations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-8 h-8 text-[#22D3EE]" />}
          title="Tidak ada aspirasi ditemukan"
          description="Belum ada kiriman aspirasi yang sesuai dengan kriteria filter atau pencarian saat ini."
        />
      ) : (
        <div className="space-y-4">
          {/* Tampilan Desktop Tabel & Mobile Card */}
          <div className="bg-[#0C1427] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-[#080E1E] text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Kode Pelacakan</th>
                    <th className="py-3.5 px-4">Kategori & Subjek</th>
                    <th className="py-3.5 px-4">Pengirim</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Publikasi</th>
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {aspirations.map((item) => {
                    const statusInfo = STATUS_CONFIG[item.status] || { label: item.status, variant: 'draft' }
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-800/20 transition-colors cursor-pointer group"
                        onClick={() => handleOpenDetail(item)}
                      >
                        <td className="py-4 px-4 font-mono text-xs text-[#22D3EE] font-semibold whitespace-nowrap">
                          {item.tracking_code}
                        </td>
                        <td className="py-4 px-4 max-w-xs">
                          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800/60 text-[#9AA8C4] mr-2">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </span>
                          <p className="font-semibold text-[#E6ECF8] truncate group-hover:text-[#22D3EE] transition-colors mt-0.5">
                            {item.subject}
                          </p>
                          <p className="text-xs text-[#9AA8C4] truncate mt-0.5 line-clamp-1">
                            {item.message}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-xs text-[#9AA8C4] whitespace-nowrap">
                          <span className="font-medium text-[#E6ECF8] block">
                            {item.name || 'Anonim (Warga)'}
                          </span>
                          <span className="text-[11px] text-[#9AA8C4]">
                            {item.contact || 'Tanpa Kontak'}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {item.is_public ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                              <Eye className="w-3.5 h-3.5" />
                              Publik
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Internal</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-xs text-[#9AA8C4] whitespace-nowrap">
                          {formatDateTime(item.created_at)}
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDetail(item)}
                              className="text-[#9AA8C4] hover:text-[#22D3EE] min-h-[40px] px-2.5"
                              title="Buka rincian & moderasi"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Detail
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletingId(item.id)
                                setIsDeleteOpen(true)
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/30 min-h-[40px] px-2"
                              title="Hapus aspirasi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kontrol Paginasi */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between p-3 bg-[#0C1427] border border-slate-800/80 rounded-xl text-xs text-[#9AA8C4]">
              <span>
                Menampilkan halaman {currentPage} dari {lastPage} (Total {totalItems} aspirasi)
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

      {/* Modal Detail & Moderasi */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Moderasi & Rincian Aspirasi Warga"
        size="lg"
      >
        {detailLoading || !selectedAspiration ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Spinner />
            <p className="text-sm text-[#9AA8C4]">Memuat detail aspirasi...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Rincian */}
            <div className="p-4 bg-[#060B18] border border-slate-800 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9AA8C4]">Kode Pelacakan:</span>
                  <span className="font-mono text-sm font-bold text-[#22D3EE] bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/60">
                    {selectedAspiration.tracking_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(selectedAspiration.tracking_code)}
                    className="text-[#9AA8C4] hover:text-white p-1 rounded transition-colors"
                    title="Salin kode pelacakan"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_CONFIG[selectedAspiration.status]?.variant || 'draft'}>
                    {STATUS_CONFIG[selectedAspiration.status]?.label || selectedAspiration.status}
                  </Badge>
                  {selectedAspiration.is_public && (
                    <Badge variant="published">Tampil di Publik</Badge>
                  )}
                </div>
              </div>

              {/* Data Pengirim */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-[#9AA8C4] block">Pengirim:</span>
                  <span className="text-[#E6ECF8] font-medium">
                    {selectedAspiration.name || 'Anonim (Warga)'}
                  </span>
                </div>
                <div>
                  <span className="text-[#9AA8C4] block">Kontak:</span>
                  <span className="text-[#E6ECF8] font-medium">
                    {selectedAspiration.contact || 'Tidak dicantumkan'}
                  </span>
                </div>
                <div>
                  <span className="text-[#9AA8C4] block">Waktu Pengiriman:</span>
                  <span className="text-[#E6ECF8]">
                    {formatDateTime(selectedAspiration.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Isi Pesan Warga */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider block">
                Subjek & Isi Pesan Warga:
              </span>
              <div className="p-4 bg-[#060B18] border border-slate-800/80 rounded-xl space-y-2">
                <h3 className="text-base font-bold text-[#E6ECF8]">
                  {selectedAspiration.subject}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                  {selectedAspiration.message}
                </p>
              </div>
            </div>

            {/* Form Moderasi Admin */}
            <div className="p-4 bg-slate-900/30 border border-slate-800/80 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-[#22D3EE] uppercase tracking-wider">
                Panel Tindakan Moderasi
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ubah Status */}
                <FormField htmlFor="moderation-status" label="Ubah Status Penanganan" required>
                  <Select
                    value={formStatus}
                    onChange={(e) => {
                      const newStat = e.target.value as AspirationStatus
                      setFormStatus(newStat)
                      if (formIsPublic && (newStat === 'spam' || newStat === 'rejected')) {
                        setFormIsPublic(false)
                      }
                    }}
                    options={[
                      { value: 'new', label: 'Baru' },
                      { value: 'read', label: 'Dibaca' },
                      { value: 'in_progress', label: 'Sedang Diproses' },
                      { value: 'done', label: 'Selesai / Terlaksana' },
                      { value: 'rejected', label: 'Ditolak' },
                      { value: 'spam', label: 'Spam' },
                    ]}
                  />
                </FormField>

                {/* Toggle Publikasi */}
                <div className="flex flex-col justify-end pb-1.5">
                  <label className="flex items-center gap-3 p-3 bg-[#060B18] border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={formIsPublic}
                      onChange={(e) => {
                        if (e.target.checked && (formStatus === 'spam' || formStatus === 'rejected')) {
                          showToast('Aspirasi spam atau ditolak tidak boleh dipublikasikan.', 'error')
                          return
                        }
                        setFormIsPublic(e.target.checked)
                      }}
                      disabled={formStatus === 'spam' || formStatus === 'rejected'}
                      className="w-4 h-4 rounded text-[#2F6BFF] focus:ring-0 bg-slate-800 border-slate-700"
                    />
                    <div>
                      <span className="text-sm font-semibold text-[#E6ECF8] block">
                        Tampilkan di Publik
                      </span>
                      <span className="text-[11px] text-[#9AA8C4] block">
                        Nama warga disamarkan menjadi &quot;Warga&quot; di halaman publik.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Balasan Publik */}
              <FormField
                htmlFor="moderation-reply"
                label="Balasan Resmi Pengurus (Tampil jika dipublikasikan)"
                helperText="Maksimal 1000 karakter. Ditampilkan saat warga melacak atau melihat di halaman publik."
              >
                <Textarea
                  value={formPublicReply}
                  onChange={(e) => setFormPublicReply(e.target.value)}
                  placeholder="Tuliskan tanggapan atau solusi dari pengurus RT / Karang Taruna..."
                  rows={3}
                  maxLength={1000}
                />
              </FormField>

              {/* Catatan Internal */}
              <FormField
                htmlFor="moderation-internal-note"
                label="Catatan Internal Pengurus (Hanya Admin)"
                helperText="Maksimal 1000 karakter. Rahasia, tidak pernah terlihat oleh publik atau pelacak warga."
              >
                <Textarea
                  value={formInternalNote}
                  onChange={(e) => setFormInternalNote(e.target.value)}
                  placeholder="Catatan diskusi pengurus, tindak lanjut, nomor RT/RW terkait..."
                  rows={2}
                  maxLength={1000}
                />
              </FormField>

              {/* Riwayat Penanganan Terakhir */}
              {selectedAspiration.handler && (
                <p className="text-[11px] text-slate-500 italic">
                  Terakhir ditangani oleh: {selectedAspiration.handler.name} ({selectedAspiration.handler.username})
                </p>
              )}
            </div>

            {/* Tombol Aksi Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkSpam}
                  disabled={submitting || formStatus === 'spam'}
                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 min-h-[44px]"
                >
                  <ShieldAlert className="w-4 h-4 mr-1.5" />
                  Tandai Spam
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeletingId(selectedAspiration.id)
                    setIsDeleteOpen(true)
                  }}
                  disabled={submitting}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/30 min-h-[44px]"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Hapus
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsDetailOpen(false)}
                  disabled={submitting}
                  className="min-h-[44px]"
                >
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveDetail}
                  disabled={submitting}
                  className="min-h-[44px]"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Aspirasi Warga"
        description="Apakah Anda yakin ingin menghapus aspirasi ini? Data yang dihapus akan dipindahkan ke arsip sementara (soft-delete)."
        confirmLabel={deleteSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
        variant="danger"
      />
    </div>
  )
}
