import { useState, useEffect, useCallback } from 'react'
import {
  Image as ImageIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
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
  getAdminAlbums,
  createAdminAlbum,
  updateAdminAlbum,
  deleteAdminAlbum,
  publishAdminAlbum,
  unpublishAdminAlbum,
  getAdminEvents,
  type AlbumData,
  type EventData,
} from '@/lib/api'
import { formatDate } from '@/lib/format'

export default function AdminGalleryPage() {
  useDocumentTitle('Manajemen Galeri', true)

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type })
    window.setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr))
    }, 4500)
  }

  const [albums, setAlbums] = useState<AlbumData[]>([])
  const [events, setEvents] = useState<EventData[]>([])
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(true)
  const [albumSearch, setAlbumSearch] = useState('')
  const [albumStatusFilter, setAlbumStatusFilter] = useState('')
  const [albumPage, setAlbumPage] = useState(1)
  const [albumTotalPages, setAlbumTotalPages] = useState(1)

  // Modal Album Form
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<AlbumData | null>(null)
  const [albumFormData, setAlbumFormData] = useState({
    title: '',
    description: '',
    event_id: '',
    taken_at: '',
    status: 'draft' as 'draft' | 'published',
  })
  const [isSavingAlbum, setIsSavingAlbum] = useState(false)
  const [confirmDeleteAlbum, setConfirmDeleteAlbum] = useState<AlbumData | null>(null)

  const fetchAlbums = useCallback(async () => {
    setIsLoadingAlbums(true)
    try {
      const res = await getAdminAlbums({
        search: albumSearch,
        status: albumStatusFilter,
        page: albumPage,
      })
      setAlbums(res.data)
      setAlbumTotalPages(res.last_page)
    } catch {
      showToast('Gagal memuat daftar album dokumentasi.', 'error')
    } finally {
      setIsLoadingAlbums(false)
    }
  }, [albumSearch, albumStatusFilter, albumPage])

  const fetchEvents = useCallback(async () => {
    try {
      const res = await getAdminEvents({ page: 1 })
      setEvents(res.data)
    } catch {
      // Abaikan jika events gagal
    }
  }, [])

  useEffect(() => {
    fetchAlbums()
    fetchEvents()
  }, [fetchAlbums, fetchEvents])

  const openCreateAlbumModal = () => {
    setEditingAlbum(null)
    setAlbumFormData({
      title: '',
      description: '',
      event_id: '',
      taken_at: '',
      status: 'draft',
    })
    setIsAlbumModalOpen(true)
  }

  const openEditAlbumModal = (album: AlbumData) => {
    setEditingAlbum(album)
    setAlbumFormData({
      title: album.title,
      description: album.description || '',
      event_id: album.event_id ? album.event_id.toString() : '',
      taken_at: album.taken_at ? album.taken_at.slice(0, 10) : '',
      status: album.status,
    })
    setIsAlbumModalOpen(true)
  }

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!albumFormData.title.trim()) {
      showToast('Judul album wajib diisi.', 'error')
      return
    }

    setIsSavingAlbum(true)
    try {
      const payload = {
        title: albumFormData.title.trim(),
        description: albumFormData.description.trim() || null,
        event_id: albumFormData.event_id ? parseInt(albumFormData.event_id, 10) : null,
        taken_at: albumFormData.taken_at || null,
        status: albumFormData.status,
      }

      if (editingAlbum) {
        await updateAdminAlbum(editingAlbum.id, payload)
        showToast('Album berhasil diperbarui.', 'success')
      } else {
        await createAdminAlbum(payload)
        showToast('Album dokumentasi berhasil dibuat.', 'success')
      }

      setIsAlbumModalOpen(false)
      fetchAlbums()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan album.'
      showToast(msg, 'error')
    } finally {
      setIsSavingAlbum(false)
    }
  }

  const handleDeleteAlbum = async () => {
    if (!confirmDeleteAlbum) return
    try {
      await deleteAdminAlbum(confirmDeleteAlbum.id)
      showToast('Album dokumentasi berhasil dihapus.', 'success')
      setConfirmDeleteAlbum(null)
      fetchAlbums()
    } catch {
      showToast('Gagal menghapus album.', 'error')
    }
  }

  const handleTogglePublishAlbum = async (album: AlbumData) => {
    try {
      if (album.status === 'published') {
        await unpublishAdminAlbum(album.id)
        showToast(`Publikasi "${album.title}" dibatalkan.`, 'info')
      } else {
        await publishAdminAlbum(album.id)
        showToast(`Album "${album.title}" berhasil diterbitkan.`, 'success')
      }
      fetchAlbums()
    } catch {
      showToast('Gagal mengubah status publikasi album.', 'error')
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <Toast
        message={toast?.message ?? null}
        type={toast?.type}
        onDismiss={() => setToast(null)}
      />

      {/* Header Utama */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ImageIcon className="w-6 h-6 text-[#2F6BFF]" />
            Manajemen Galeri & Album Foto
          </h1>
          <p className="text-sm text-[#9AA8C4] mt-1">
            Kelola arsip dokumentasi kegiatan warga Karang Taruna RT 001 RW 004.
          </p>
        </div>

        <Button onClick={openCreateAlbumModal} className="flex items-center gap-2 shadow-md">
          <Plus className="w-4 h-4" />
          Buat Album Baru
        </Button>
      </div>

      {/* Bar Filter & Pencarian */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0C1427]/60 p-4 rounded-2xl border border-slate-800/80">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-[#9AA8C4] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul album..."
            value={albumSearch}
            onChange={(e) => {
              setAlbumSearch(e.target.value)
              setAlbumPage(1)
            }}
            className="w-full bg-[#060B18] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#2F6BFF]"
          />
        </div>
        <div>
          <Select
            value={albumStatusFilter}
            onChange={(e) => {
              setAlbumStatusFilter(e.target.value)
              setAlbumPage(1)
            }}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'published', label: 'Terbit (Published)' },
              { value: 'draft', label: 'Draft' },
            ]}
          />
        </div>
      </div>

      {/* Konten Album */}
      {isLoadingAlbums ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[#9AA8C4]">Memuat daftar album dokumentasi...</p>
        </div>
      ) : albums.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="w-8 h-8 text-[#2F6BFF]" />}
          title="Belum Ada Album Dokumentasi"
          description="Buat album dokumentasi untuk menyimpan foto dan kenangan kegiatan Karang Taruna."
          action={
            <Button onClick={openCreateAlbumModal} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Buat Album Pertama
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Card key={album.id} className="flex flex-col justify-between border-slate-800/80 bg-[#0C1427]/50 hover:border-slate-700 transition-all">
              <div>
                {/* Cover Album */}
                <div className="relative aspect-video w-full rounded-t-2xl overflow-hidden bg-slate-900 border-b border-slate-800">
                  {album.cover_url ? (
                    <img
                      src={album.cover_url}
                      alt={album.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 gap-2">
                      <ImageIcon className="w-10 h-10 opacity-30" />
                      <span className="text-xs text-slate-600">Belum ada foto</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge variant={album.status === 'published' ? 'published' : 'draft'}>
                      {album.status === 'published' ? 'Terbit' : 'Draft'}
                    </Badge>
                    <Badge variant="info">
                      {album.photos_count} Foto
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs text-[#22D3EE] font-medium mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {album.taken_at ? formatDate(album.taken_at) : 'Tanggal tidak disetel'}
                  </div>
                  <CardTitle className="text-lg line-clamp-1">{album.title}</CardTitle>
                  {album.description && (
                    <CardDescription className="line-clamp-2 mt-1">{album.description}</CardDescription>
                  )}
                </CardHeader>

                {album.event && (
                  <CardContent className="text-xs text-[#9AA8C4] pt-0">
                    <span className="text-slate-500">Terkait agenda:</span> {album.event.title}
                  </CardContent>
                )}
              </div>

              {/* Footer & Aksi Album */}
              <div className="p-4 border-t border-slate-800/80 flex items-center justify-between gap-2 bg-[#060B18]/40">
                <Button
                  to={`/admin/galeri/${album.id}`}
                  variant="primary"
                  size="sm"
                  className="text-xs flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Kelola Foto ({album.photos_count})
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePublishAlbum(album)}
                    title={album.status === 'published' ? 'Jadikan Draft' : 'Terbitkan'}
                  >
                    {album.status === 'published' ? (
                      <XCircle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditAlbumModal(album)}
                    title="Ubah Info Album"
                  >
                    <Edit className="w-4 h-4 text-blue-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDeleteAlbum(album)}
                    title="Hapus Album"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Paginasi Album */}
      {albumTotalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={albumPage <= 1}
            onClick={() => setAlbumPage((p) => Math.max(1, p - 1))}
          >
            Sebelumnya
          </Button>
          <span className="text-xs text-[#9AA8C4] px-2">
            Halaman {albumPage} dari {albumTotalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={albumPage >= albumTotalPages}
            onClick={() => setAlbumPage((p) => Math.min(albumTotalPages, p + 1))}
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {/* Modal Form Tambah / Ubah Album */}
      <Modal
        isOpen={isAlbumModalOpen}
        onClose={() => setIsAlbumModalOpen(false)}
        title={editingAlbum ? 'Ubah Informasi Album' : 'Buat Album Dokumentasi Baru'}
      >
        <form onSubmit={handleSaveAlbum} className="space-y-4">
          <FormField label="Judul Album" required>
            <Input
              value={albumFormData.title}
              onChange={(e) => setAlbumFormData({ ...albumFormData, title: e.target.value })}
              placeholder="Contoh: Dokumentasi Lomba Agustusan 2026"
              maxLength={150}
            />
          </FormField>

          <FormField label="Kaitkan dengan Agenda (Opsional)">
            <Select
              value={albumFormData.event_id}
              onChange={(e) => setAlbumFormData({ ...albumFormData, event_id: e.target.value })}
              options={[
                { value: '', label: '-- Tanpa Tautan Agenda Khusus --' },
                ...events.map((ev) => ({ value: ev.id.toString(), label: ev.title })),
              ]}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Tanggal Kegiatan">
              <Input
                type="date"
                value={albumFormData.taken_at}
                onChange={(e) => setAlbumFormData({ ...albumFormData, taken_at: e.target.value })}
              />
            </FormField>

            <FormField label="Status Publikasi">
              <Select
                value={albumFormData.status}
                onChange={(e) => setAlbumFormData({ ...albumFormData, status: e.target.value as 'draft' | 'published' })}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Terbitkan' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Deskripsi Album">
            <Textarea
              value={albumFormData.description}
              onChange={(e) => setAlbumFormData({ ...albumFormData, description: e.target.value })}
              placeholder="Rangkuman momen dan cerita kegiatan..."
              rows={3}
              maxLength={500}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsAlbumModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSavingAlbum}>
              {isSavingAlbum && <Spinner size="sm" className="mr-2" />}
              {editingAlbum ? 'Simpan Album' : 'Buat Album'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Hapus Album */}
      <ConfirmDialog
        isOpen={!!confirmDeleteAlbum}
        title="Hapus Album Dokumentasi?"
        description={`Apakah Anda yakin ingin menghapus album "${confirmDeleteAlbum?.title}"? Tindakan ini akan mengarsipkan album dan foto-fotonya.`}
        confirmLabel="Hapus Album"
        variant="danger"
        onConfirm={handleDeleteAlbum}
        onClose={() => setConfirmDeleteAlbum(null)}
      />
    </div>
  )
}
