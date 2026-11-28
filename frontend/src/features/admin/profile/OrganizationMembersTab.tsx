import React, { useState, useEffect, useCallback } from 'react'
import {
  UserPlus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Camera,
  AlertTriangle,
} from 'lucide-react'
import {
  Button,
  Badge,
  DataTable,
  Modal,
  ConfirmDialog,
  Input,
  Textarea,
  ImageUploadField,
  type DataTableColumn,
} from '@/components/ui'
import {
  getAdminMembers,
  createAdminMember,
  updateAdminMember,
  deleteAdminMember,
  uploadMemberPhoto,
  deleteMemberPhoto,
  reorderAdminMembers,
  type OrganizationMemberData,
  type MemberPayload,
  ApiError,
} from '@/lib/api'

interface OrganizationMembersTabProps {
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

const INITIAL_MEMBER_FORM: MemberPayload = {
  name: '',
  position: '',
  division: '',
  period: '',
  bio: '',
  is_visible: true,
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export default function OrganizationMembersTab({
  onSuccess,
  onError,
}: OrganizationMembersTabProps) {
  const [members, setMembers] = useState<OrganizationMemberData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  // Modal Tambah / Ubah
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<OrganizationMemberData | null>(null)
  const [form, setForm] = useState<MemberPayload>(INITIAL_MEMBER_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)

  // Modal Foto
  const [photoTarget, setPhotoTarget] = useState<OrganizationMemberData | null>(null)

  // Konfirmasi Hapus
  const [deleteTarget, setDeleteTarget] = useState<OrganizationMemberData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await getAdminMembers()
      setMembers(res.data)
    } catch (err: unknown) {
      setLoadError(err instanceof ApiError ? err.message : 'Gagal memuat daftar pengurus.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const openAddModal = () => {
    setEditingMember(null)
    setForm(INITIAL_MEMBER_FORM)
    setFormError(null)
    setFieldErrors({})
    setIsFormOpen(true)
  }

  const openEditModal = (member: OrganizationMemberData) => {
    setEditingMember(member)
    setForm({
      name: member.name,
      position: member.position,
      division: member.division || '',
      period: member.period || '',
      bio: member.bio || '',
      is_visible: Boolean(member.is_visible),
    })
    setFormError(null)
    setFieldErrors({})
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setIsSubmittingForm(true)

    const payload: MemberPayload = {
      name: form.name.trim(),
      position: form.position.trim(),
      division: form.division?.trim() || null,
      period: form.period?.trim() || null,
      bio: form.bio?.trim() || null,
      is_visible: form.is_visible,
    }

    try {
      if (editingMember && editingMember.id) {
        const res = await updateAdminMember(editingMember.id, payload)
        onSuccess(res.message || 'Data pengurus berhasil diperbarui.')
      } else {
        const res = await createAdminMember(payload)
        onSuccess(res.message || 'Pengurus baru berhasil ditambahkan.')
      }
      setIsFormOpen(false)
      await loadMembers()
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 422) {
        const data = err.data as { message?: string; errors?: Record<string, string[]> }
        setFormError(data.message || 'Periksa kembali isian formulir.')
        if (data.errors) setFieldErrors(data.errors)
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Gagal menyimpan data pengurus.')
      }
    } finally {
      setIsSubmittingForm(false)
    }
  }

  const handleToggleVisible = async (member: OrganizationMemberData) => {
    if (!member.id) return
    try {
      const next = !member.is_visible
      await updateAdminMember(member.id, { is_visible: next })
      onSuccess(
        next
          ? `${member.name} sekarang ditampilkan di halaman publik.`
          : `${member.name} disembunyikan dari halaman publik.`,
      )
      await loadMembers()
    } catch (err: unknown) {
      onError(err instanceof ApiError ? err.message : 'Gagal mengubah status tampil.')
    }
  }

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= members.length) return

    const reordered = [...members]
    const temp = reordered[index]
    reordered[index] = reordered[targetIndex]
    reordered[targetIndex] = temp

    const ids = reordered.map((m) => m.id).filter((id): id is number => typeof id === 'number')
    setMembers(reordered)
    setIsReordering(true)

    try {
      const res = await reorderAdminMembers(ids)
      setMembers(res.data)
      onSuccess('Urutan pengurus berhasil diperbarui.')
    } catch (err: unknown) {
      onError(err instanceof ApiError ? err.message : 'Gagal menyimpan urutan.')
      await loadMembers()
    } finally {
      setIsReordering(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await deleteAdminMember(deleteTarget.id)
      setDeleteTarget(null)
      onSuccess(res.message || 'Pengurus berhasil dihapus.')
      await loadMembers()
    } catch (err: unknown) {
      setDeleteError(err instanceof ApiError ? err.message : 'Gagal menghapus pengurus.')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: DataTableColumn<OrganizationMemberData>[] = [
    {
      key: 'order',
      header: 'Urutan',
      render: (row, index) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={index === 0 || isReordering}
            onClick={() => handleMove(index, -1)}
            className="min-w-[44px] min-h-[44px] px-0"
            aria-label={`Naikkan urutan ${row.name}`}
            title="Naikkan urutan"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={index === members.length - 1 || isReordering}
            onClick={() => handleMove(index, 1)}
            className="min-w-[44px] min-h-[44px] px-0"
            aria-label={`Turunkan urutan ${row.name}`}
            title="Turunkan urutan"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Pengurus',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.photo_url ? (
            <img
              src={row.photo_url}
              alt={row.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-700/60 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#111B33] border border-slate-700/60 flex items-center justify-center text-xs font-bold text-[#22D3EE] shrink-0">
              {getInitials(row.name)}
            </div>
          )}
          <div>
            <div className="font-semibold text-[#E6ECF8]">{row.name}</div>
            <div className="text-xs text-[#9AA8C4]">{row.position}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'division',
      header: 'Divisi / Periode',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="text-[#E6ECF8]">{row.division || '-'}</div>
          <div className="text-[#9AA8C4]">{row.period || '-'}</div>
        </div>
      ),
    },
    {
      key: 'visibility',
      header: 'Publikasi',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleVisible(row)}
          className="min-h-[44px] inline-flex items-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#22D3EE] rounded-full"
          aria-label={`Ubah visibilitas ${row.name}`}
        >
          {row.is_visible ? (
            <Badge variant="published">
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              Tampil
            </Badge>
          ) : (
            <Badge variant="draft">
              <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
              Tersembunyi
            </Badge>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setPhotoTarget(row)}
            className="min-h-[44px] min-w-[44px] px-2.5"
            aria-label={`Atur foto ${row.name}`}
            title="Atur foto"
          >
            <Camera className="w-4 h-4 text-amber-400" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => openEditModal(row)}
            className="min-h-[44px] min-w-[44px] px-2.5"
            aria-label={`Ubah ${row.name}`}
            title="Ubah data"
          >
            <Edit2 className="w-4 h-4 text-[#22D3EE]" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setDeleteError(null)
              setDeleteTarget(row)
            }}
            className="min-h-[44px] min-w-[44px] px-2.5 hover:bg-red-950/40 hover:border-red-800"
            aria-label={`Hapus ${row.name}`}
            title="Hapus pengurus"
          >
            <Trash2 className="w-4 h-4 text-[#F87171]" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#E6ECF8]">Daftar Pengurus Organisasi</h2>
          <p className="text-xs text-[#9AA8C4]">
            Atur urutan agar Pembina & Ketua berada di posisi teratas. Gunakan tombol Naik/Turun.
          </p>
        </div>
        <Button type="button" onClick={openAddModal} className="min-h-[44px]">
          <UserPlus className="w-4 h-4 mr-2" />
          Tambah Pengurus
        </Button>
      </div>

      <DataTable
        data={members}
        columns={columns}
        keyExtractor={(row) => row.id ?? row.name}
        ariaLabel="Tabel Struktur Pengurus"
        isLoading={isLoading}
        error={loadError}
        onRetry={loadMembers}
        emptyTitle="Belum Ada Pengurus"
        emptyDescription="Tambahkan anggota pengurus pertama untuk ditampilkan pada struktur organisasi."
        emptyAction={
          <Button type="button" onClick={openAddModal}>
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Pengurus
          </Button>
        }
        renderMobileCard={(row, index) => (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {row.photo_url ? (
                  <img
                    src={row.photo_url}
                    alt={row.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700/60 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#111B33] border border-slate-700/60 flex items-center justify-center text-sm font-bold text-[#22D3EE] shrink-0">
                    {getInitials(row.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-[#E6ECF8] truncate">{row.name}</h3>
                  <p className="text-xs text-[#22D3EE] truncate">{row.position}</p>
                  <p className="text-xs text-[#9AA8C4] truncate">
                    {[row.division, row.period].filter(Boolean).join(' • ') || '-'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleVisible(row)}
                className="min-h-[44px] shrink-0 flex items-center"
                aria-label={`Ubah visibilitas ${row.name}`}
              >
                {row.is_visible ? (
                  <Badge variant="published">Tampil</Badge>
                ) : (
                  <Badge variant="draft">Sembunyi</Badge>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === 0 || isReordering}
                  onClick={() => handleMove(index, -1)}
                  className="min-w-[44px] min-h-[44px] px-0"
                  aria-label={`Naikkan ${row.name}`}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === members.length - 1 || isReordering}
                  onClick={() => handleMove(index, 1)}
                  className="min-w-[44px] min-h-[44px] px-0"
                  aria-label={`Turunkan ${row.name}`}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPhotoTarget(row)}
                  className="min-h-[44px] min-w-[44px]"
                  aria-label={`Foto ${row.name}`}
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditModal(row)}
                  className="min-h-[44px] min-w-[44px]"
                  aria-label={`Ubah ${row.name}`}
                >
                  <Edit2 className="w-4 h-4 text-[#22D3EE]" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDeleteError(null)
                    setDeleteTarget(row)
                  }}
                  className="min-h-[44px] min-w-[44px]"
                  aria-label={`Hapus ${row.name}`}
                >
                  <Trash2 className="w-4 h-4 text-[#F87171]" />
                </Button>
              </div>
            </div>
          </div>
        )}
      />

      {/* Modal Tambah / Ubah Pengurus */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => !isSubmittingForm && setIsFormOpen(false)}
        title={editingMember ? `Ubah Pengurus: ${editingMember.name}` : 'Tambah Pengurus Baru'}
        closeOnOverlayClick={!isSubmittingForm}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div
              className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-start gap-2"
              role="alert"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Nama Lengkap"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            errorMessage={fieldErrors.name?.[0]}
            maxLength={100}
            required
          />

          <Input
            label="Jabatan"
            value={form.position}
            onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
            errorMessage={fieldErrors.position?.[0]}
            placeholder="Contoh: Ketua Umum, Sekretaris, Koordinator Olahraga"
            maxLength={100}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Divisi / Bidang"
              value={form.division ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, division: e.target.value }))}
              errorMessage={fieldErrors.division?.[0]}
              placeholder="Contoh: Pengurus Harian"
              maxLength={100}
            />
            <Input
              label="Periode Kepengurusan"
              value={form.period ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))}
              errorMessage={fieldErrors.period?.[0]}
              placeholder="Contoh: 2025-2028"
              maxLength={50}
            />
          </div>

          <Textarea
            label="Bio / Tugas Singkat"
            value={form.bio ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            errorMessage={fieldErrors.bio?.[0]}
            helperText="Maksimal 300 karakter."
            maxLength={300}
            rows={3}
          />

          <label className="flex items-center gap-3 p-3 rounded-xl bg-[#060B18] border border-slate-800 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={form.is_visible}
              onChange={(e) => setForm((p) => ({ ...p, is_visible: e.target.checked }))}
              className="w-4 h-4 rounded text-[#2F6BFF] focus:ring-2 focus:ring-[#22D3EE]"
            />
            <span className="text-sm text-[#E6ECF8]">
              Tampilkan di halaman publik warga
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/60">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmittingForm}
              onClick={() => setIsFormOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmittingForm}>
              {editingMember ? 'Simpan Perubahan' : 'Tambah Pengurus'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Foto Pengurus */}
      <Modal
        isOpen={Boolean(photoTarget)}
        onClose={() => setPhotoTarget(null)}
        title={`Foto Pengurus: ${photoTarget?.name || ''}`}
        size="sm"
      >
        {photoTarget && photoTarget.id && (
          <div className="space-y-4">
            <ImageUploadField
              label="Unggah Foto Profil"
              currentUrl={photoTarget.photo_url}
              fallbackText={getInitials(photoTarget.name)}
              onUpload={async (file) => {
                const res = await uploadMemberPhoto(photoTarget.id!, file)
                setPhotoTarget(res.data)
                onSuccess(res.message || 'Foto pengurus berhasil diperbarui.')
                await loadMembers()
              }}
              onDelete={
                photoTarget.photo_url
                  ? async () => {
                      const res = await deleteMemberPhoto(photoTarget.id!)
                      setPhotoTarget(res.data)
                      onSuccess(res.message || 'Foto pengurus berhasil dihapus.')
                      await loadMembers()
                    }
                  : undefined
              }
            />
            <div className="flex justify-end pt-2 border-t border-slate-800/60">
              <Button type="button" variant="secondary" onClick={() => setPhotoTarget(null)}>
                Selesai
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Pengurus?"
        description={
          <>
            Anda yakin ingin menghapus <strong className="text-white">{deleteTarget?.name}</strong>{' '}
            ({deleteTarget?.position})? Foto pengurus juga akan dihapus permanen dari penyimpanan.
          </>
        }
        confirmLabel="Hapus Pengurus"
        variant="danger"
        isLoading={isDeleting}
        errorMessage={deleteError}
      />
    </div>
  )
}
