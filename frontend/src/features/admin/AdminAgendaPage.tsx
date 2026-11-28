import { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  MapPin,
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
  ImageUploadField,
  Toast,
  type ToastType,
  Spinner,
  EmptyState,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import {
  getAdminEvents,
  createAdminEvent,
  updateAdminEvent,
  deleteAdminEvent,
  uploadEventCover,
  deleteEventCover,
  publishAdminEvent,
  unpublishAdminEvent,
  type EventData,
} from '@/lib/api'
import { formatDateTime } from '@/lib/format'

export default function AdminAgendaPage() {
  useDocumentTitle('Manajemen Agenda', true)

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type })
    window.setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr))
    }, 4500)
  }

  const [events, setEvents] = useState<EventData[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [eventSearch, setEventSearch] = useState('')
  const [eventStatusFilter, setEventStatusFilter] = useState('')
  const [eventPage, setEventPage] = useState(1)
  const [eventTotalPages, setEventTotalPages] = useState(1)

  // Modal Event Form
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null)
  const [eventFormData, setEventFormData] = useState({
    title: '',
    summary: '',
    description: '',
    category: 'Kegiatan',
    starts_at: '',
    ends_at: '',
    location: '',
    status: 'draft' as 'draft' | 'published',
  })
  const [isSavingEvent, setIsSavingEvent] = useState(false)
  const [eventFormErrors, setEventFormErrors] = useState<Record<string, string>>({})
  const [isEventDirty, setIsEventDirty] = useState(false)
  useUnsavedChanges(isEventDirty)

  // Dialog Konfirmasi Event
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<EventData | null>(null)

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true)
    try {
      const res = await getAdminEvents({
        search: eventSearch,
        status: eventStatusFilter,
        page: eventPage,
      })
      setEvents(res.data)
      setEventTotalPages(res.last_page)
    } catch {
      showToast('Gagal memuat daftar agenda.', 'error')
    } finally {
      setIsLoadingEvents(false)
    }
  }, [eventSearch, eventStatusFilter, eventPage])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const openCreateEventModal = () => {
    setEditingEvent(null)
    setEventFormData({
      title: '',
      summary: '',
      description: '',
      category: 'Kegiatan',
      starts_at: '',
      ends_at: '',
      location: '',
      status: 'draft',
    })
    setEventFormErrors({})
    setIsEventDirty(false)
    setIsEventModalOpen(true)
  }

  const openEditEventModal = (event: EventData) => {
    setEditingEvent(event)
    const formatForInput = (iso: string | null) => {
      if (!iso) return ''
      const d = new Date(iso)
      const tzOffset = d.getTimezoneOffset() * 60000
      const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
      return localISOTime
    }

    setEventFormData({
      title: event.title,
      summary: event.summary,
      description: event.description,
      category: event.category,
      starts_at: formatForInput(event.starts_at),
      ends_at: formatForInput(event.ends_at),
      location: event.location || '',
      status: event.status,
    })
    setEventFormErrors({})
    setIsEventDirty(false)
    setIsEventModalOpen(true)
  }

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setEventFormErrors({})

    if (!eventFormData.title.trim()) {
      setEventFormErrors((prev) => ({ ...prev, title: 'Judul agenda wajib diisi.' }))
      return
    }
    if (!eventFormData.starts_at) {
      setEventFormErrors((prev) => ({ ...prev, starts_at: 'Waktu mulai acara wajib diisi.' }))
      return
    }

    setIsSavingEvent(true)
    try {
      const payload = {
        title: eventFormData.title.trim(),
        summary: eventFormData.summary.trim(),
        description: eventFormData.description.trim(),
        category: eventFormData.category,
        starts_at: new Date(eventFormData.starts_at).toISOString(),
        ends_at: eventFormData.ends_at ? new Date(eventFormData.ends_at).toISOString() : null,
        location: eventFormData.location.trim() || null,
        status: eventFormData.status,
      }

      if (editingEvent) {
        await updateAdminEvent(editingEvent.id, payload)
        showToast('Agenda berhasil diperbarui.', 'success')
      } else {
        await createAdminEvent(payload)
        showToast('Agenda berhasil dibuat.', 'success')
      }

      setIsEventDirty(false)
      setIsEventModalOpen(false)
      fetchEvents()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan agenda.'
      showToast(msg, 'error')
    } finally {
      setIsSavingEvent(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!confirmDeleteEvent) return
    try {
      await deleteAdminEvent(confirmDeleteEvent.id)
      showToast('Agenda berhasil dihapus.', 'success')
      setConfirmDeleteEvent(null)
      fetchEvents()
    } catch {
      showToast('Gagal menghapus agenda.', 'error')
    }
  }

  const handleTogglePublishEvent = async (event: EventData) => {
    try {
      if (event.status === 'published') {
        await unpublishAdminEvent(event.id)
        showToast(`Publikasi "${event.title}" dibatalkan.`, 'info')
      } else {
        await publishAdminEvent(event.id)
        showToast(`Agenda "${event.title}" berhasil diterbitkan.`, 'success')
      }
      fetchEvents()
    } catch {
      showToast('Gagal mengubah status publikasi agenda.', 'error')
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
            <Calendar className="w-6 h-6 text-[#2F6BFF]" />
            Manajemen Agenda Kegiatan
          </h1>
          <p className="text-sm text-[#9AA8C4] mt-1">
            Kelola jadwal kegiatan, rapat, dan kerja bakti warga RT 001 RW 004.
          </p>
        </div>

        <Button onClick={openCreateEventModal} className="flex items-center gap-2 shadow-md">
          <Plus className="w-4 h-4" />
          Tambah Agenda Baru
        </Button>
      </div>

      {/* Bar Filter & Pencarian */ }
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0C1427]/60 p-4 rounded-2xl border border-slate-800/80">
    <div className="relative sm:col-span-2">
      <Search className="w-4 h-4 text-[#9AA8C4] absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        placeholder="Cari judul kegiatan..."
        value={eventSearch}
        onChange={(e) => {
          setEventSearch(e.target.value)
          setEventPage(1)
        }}
        className="w-full bg-[#060B18] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#2F6BFF]"
      />
    </div>
    <div>
      <Select
        value={eventStatusFilter}
        onChange={(e) => {
          setEventStatusFilter(e.target.value)
          setEventPage(1)
        }}
        options={[
          { value: '', label: 'Semua Status' },
          { value: 'published', label: 'Terbit (Published)' },
          { value: 'draft', label: 'Draft' },
        ]}
      />
    </div>
  </div>

      {/* Konten Agenda */}
      {isLoadingEvents ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[#9AA8C4]">Memuat daftar agenda...</p>
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8 text-[#2F6BFF]" />}
          title="Belum Ada Agenda Kegiatan"
          description="Buat agenda baru untuk mengumumkan rencana kegiatan warga RT 001."
          action={
            <Button onClick={openCreateEventModal} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Buat Agenda Pertama
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isUpcoming = new Date(event.starts_at) >= new Date()
            return (
              <Card key={event.id} className="flex flex-col justify-between border-slate-800/80 bg-[#0C1427]/50 hover:border-slate-700 transition-all">
                <div>
                  <div className="relative aspect-video w-full rounded-t-2xl overflow-hidden bg-slate-900 border-b border-slate-800">
                    {event.cover_url ? (
                      <img
                        src={event.cover_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Calendar className="w-10 h-10 opacity-30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      <Badge variant={event.status === 'published' ? 'published' : 'draft'}>
                        {event.status === 'published' ? 'Terbit' : 'Draft'}
                      </Badge>
                      <Badge variant="info">
                        {event.category}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-xs text-[#22D3EE] font-medium mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(event.starts_at)}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${isUpcoming ? 'bg-blue-950 text-blue-300' : 'bg-slate-800 text-slate-400'}`}>
                        {isUpcoming ? 'Akan Datang' : 'Sudah Lewat'}
                      </span>
                    </div>
                    <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">{event.summary}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-2 text-xs text-[#9AA8C4]">
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 border-t border-slate-800/80 flex items-center justify-between gap-2 bg-[#060B18]/40">
                  <Button
                    variant={event.status === 'published' ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleTogglePublishEvent(event)}
                    className="text-xs"
                  >
                    {event.status === 'published' ? 'Batal Terbit' : 'Terbitkan'}
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditEventModal(event)}
                      title="Ubah Agenda"
                    >
                      <Edit className="w-4 h-4 text-blue-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDeleteEvent(event)}
                      title="Hapus Agenda"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Paginasi Event */}
      {eventTotalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={eventPage <= 1}
            onClick={() => setEventPage((p) => Math.max(1, p - 1))}
          >
            Sebelumnya
          </Button>
          <span className="text-xs text-[#9AA8C4] px-2">
            Halaman {eventPage} dari {eventTotalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={eventPage >= eventTotalPages}
            onClick={() => setEventPage((p) => Math.min(eventTotalPages, p + 1))}
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {/* Modal Form Tambah / Ubah Event */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEvent ? 'Ubah Agenda Kegiatan' : 'Tambah Agenda Kegiatan Baru'}
        size="lg"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <FormField label="Judul Agenda" required errorMessage={eventFormErrors.title}>
            <Input
              value={eventFormData.title}
              onChange={(e) => {
                setEventFormData({ ...eventFormData, title: e.target.value })
                setIsEventDirty(true)
              }}
              placeholder="Contoh: Kerja Bakti Akbar Lingkungan RT 001"
              maxLength={150}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Kategori" required>
              <Select
                value={eventFormData.category}
                onChange={(e) => {
                  setEventFormData({ ...eventFormData, category: e.target.value })
                  setIsEventDirty(true)
                }}
                options={[
                  { value: 'Kegiatan', label: 'Kegiatan Umum' },
                  { value: 'Bakti Sosial', label: 'Bakti Sosial' },
                  { value: 'Rapat', label: 'Rapat Koordinasi' },
                  { value: 'Olahraga', label: 'Olahraga / Seni' },
                  { value: 'Lainnya', label: 'Lainnya' },
                ]}
              />
            </FormField>

            <FormField label="Status Publikasi">
              <Select
                value={eventFormData.status}
                onChange={(e) => {
                  setEventFormData({ ...eventFormData, status: e.target.value as 'draft' | 'published' })
                  setIsEventDirty(true)
                }}
                options={[
                  { value: 'draft', label: 'Draft (Belum Tampil di Publik)' },
                  { value: 'published', label: 'Terbitkan Langsung' },
                ]}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Waktu Mulai" required errorMessage={eventFormErrors.starts_at}>
              <Input
                type="datetime-local"
                value={eventFormData.starts_at}
                onChange={(e) => {
                  setEventFormData({ ...eventFormData, starts_at: e.target.value })
                  setIsEventDirty(true)
                }}
              />
            </FormField>

            <FormField label="Waktu Selesai (Opsional)">
              <Input
                type="datetime-local"
                value={eventFormData.ends_at}
                onChange={(e) => {
                  setEventFormData({ ...eventFormData, ends_at: e.target.value })
                  setIsEventDirty(true)
                }}
              />
            </FormField>
          </div>

          <FormField label="Lokasi Acara">
            <Input
              value={eventFormData.location}
              onChange={(e) => {
                setEventFormData({ ...eventFormData, location: e.target.value })
                setIsEventDirty(true)
              }}
              placeholder="Contoh: Balai Warga RW 004 / Sepanjang Jalan Utama RT 001"
              maxLength={150}
            />
          </FormField>

          <FormField label="Ringkasan Singkat (maks 300 karakter)" required>
            <Textarea
              value={eventFormData.summary}
              onChange={(e) => {
                setEventFormData({ ...eventFormData, summary: e.target.value })
                setIsEventDirty(true)
              }}
              placeholder="Ringkasan singkat yang akan muncul pada kartu kegiatan..."
              maxLength={300}
              rows={2}
            />
          </FormField>

          <FormField label="Deskripsi Lengkap Acara" required>
            <Textarea
              value={eventFormData.description}
              onChange={(e) => {
                setEventFormData({ ...eventFormData, description: e.target.value })
                setIsEventDirty(true)
              }}
              placeholder="Jelaskan detail susunan acara, perlengkapan yang perlu dibawa, dll..."
              rows={4}
            />
          </FormField>

          {editingEvent && (
            <ImageUploadField
              label="Foto Sampul Acara (JPG/PNG/WebP, maks 2 MB)"
              currentUrl={editingEvent.cover_url}
              aspect="wide"
              onUpload={async (file) => {
                await uploadEventCover(editingEvent.id, file)
                showToast('Foto sampul berhasil diperbarui.', 'success')
                fetchEvents()
              }}
              onDelete={async () => {
                await deleteEventCover(editingEvent.id)
                showToast('Foto sampul berhasil dihapus.', 'success')
                fetchEvents()
              }}
            />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsEventModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSavingEvent}>
              {isSavingEvent && <Spinner size="sm" className="mr-2" />}
              {editingEvent ? 'Simpan Perubahan' : 'Buat Agenda'}
            </Button>
          </div>
        </form>
      </Modal>

  {/* Dialog Konfirmasi Hapus Event */ }
  <ConfirmDialog
    isOpen={!!confirmDeleteEvent}
    title="Hapus Agenda Kegiatan?"
    description={`Apakah Anda yakin ingin menghapus agenda "${confirmDeleteEvent?.title}"? Tindakan ini akan mengarsipkan agenda (soft delete).`}
    confirmLabel="Hapus Agenda"
    variant="danger"
    onConfirm={handleDeleteEvent}
    onClose={() => setConfirmDeleteEvent(null)}
  />
    </div >
  )
}
