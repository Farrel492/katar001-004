import React, { useState, useEffect, useCallback } from 'react'
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Building2,
  FileText,
  Target,
  Phone,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Skeleton,
  ErrorState,
  ImageUploadField,
  Badge,
} from '@/components/ui'
import {
  getAdminProfile,
  updateAdminProfile,
  uploadAdminLogo,
  deleteAdminLogo,
  type OrganizationProfileData,
  type UpdateProfilePayload,
  ApiError,
} from '@/lib/api'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'

interface OrganizationProfileTabProps {
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

const EMPTY_FORM: UpdateProfilePayload = {
  name: '',
  short_name: '',
  tagline: '',
  about: '',
  history: '',
  vision: '',
  missions: [''],
  values: [],
  address: '',
  region_label: '',
  whatsapp: '',
  email: '',
  instagram: '',
  facebook: '',
  youtube: '',
}

export default function OrganizationProfileTab({
  onSuccess,
  onError,
}: OrganizationProfileTabProps) {
  const [profile, setProfile] = useState<OrganizationProfileData | null>(null)
  const [form, setForm] = useState<UpdateProfilePayload>(EMPTY_FORM)
  const [initialSnapshot, setInitialSnapshot] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const isDirty = initialSnapshot !== '' && JSON.stringify(form) !== initialSnapshot
  useUnsavedChanges(isDirty)

  const applyProfileToForm = useCallback((data: OrganizationProfileData) => {
    const nextForm: UpdateProfilePayload = {
      name: data.name || '',
      short_name: data.short_name || '',
      tagline: data.tagline || '',
      about: data.about || '',
      history: data.history || '',
      vision: data.vision || '',
      missions: data.missions && data.missions.length > 0 ? data.missions : [''],
      values: data.values || [],
      address: data.address || '',
      region_label: data.region_label || '',
      whatsapp: data.whatsapp || '',
      email: data.email || '',
      instagram: data.instagram || '',
      facebook: data.facebook || '',
      youtube: data.youtube || '',
    }
    setProfile(data)
    setForm(nextForm)
    setInitialSnapshot(JSON.stringify(nextForm))
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await getAdminProfile()
      applyProfileToForm(res.data)
    } catch (err: unknown) {
      setLoadError(
        err instanceof ApiError ? err.message : 'Gagal memuat data profil organisasi.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [applyProfileToForm])

  useEffect(() => {
    loadData()
  }, [loadData])

  const updateField = <K extends keyof UpdateProfilePayload>(
    key: K,
    value: UpdateProfilePayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Manipulasi daftar Misi / Nilai
  const handleArrayChange = (
    key: 'missions' | 'values',
    index: number,
    value: string,
  ) => {
    const arr = [...(form[key] || [])]
    arr[index] = value
    updateField(key, arr)
  }

  const handleAddArrayItem = (key: 'missions' | 'values') => {
    updateField(key, [...(form[key] || []), ''])
  }

  const handleRemoveArrayItem = (key: 'missions' | 'values', index: number) => {
    const arr = [...(form[key] || [])]
    if (key === 'missions' && arr.length <= 1) return
    arr.splice(index, 1)
    updateField(key, arr)
  }

  const handleMoveArrayItem = (
    key: 'missions' | 'values',
    index: number,
    direction: -1 | 1,
  ) => {
    const arr = [...(form[key] || [])]
    const target = index + direction
    if (target < 0 || target >= arr.length) return
    const temp = arr[index]
    arr[index] = arr[target]
    arr[target] = temp
    updateField(key, arr)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    setFieldErrors({})
    setIsSaving(true)

    try {
      const payload: UpdateProfilePayload = {
        ...form,
        tagline: form.tagline?.trim() || null,
        history: form.history?.trim() || null,
        missions: form.missions.map((m) => m.trim()).filter(Boolean),
        values: (form.values || []).map((v) => v.trim()).filter(Boolean),
        instagram: form.instagram?.trim() || null,
        facebook: form.facebook?.trim() || null,
        youtube: form.youtube?.trim() || null,
      }

      const res = await updateAdminProfile(payload)
      applyProfileToForm(res.data)
      onSuccess(res.message || 'Profil organisasi berhasil disimpan.')
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 422) {
        const data = err.data as { message?: string; errors?: Record<string, string[]> }
        setServerError(data.message || 'Periksa kembali isian formulir Anda.')
        if (data.errors) setFieldErrors(data.errors)
      } else {
        const msg = err instanceof ApiError ? err.message : 'Gagal menyimpan profil.'
        setServerError(msg)
        onError(msg)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (file: File) => {
    const res = await uploadAdminLogo(file)
    setProfile(res.data)
    onSuccess(res.message || 'Logo berhasil diperbarui.')
  }

  const handleLogoDelete = async () => {
    const res = await deleteAdminLogo()
    setProfile(res.data)
    onSuccess(res.message || 'Logo berhasil dihapus.')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (loadError) {
    return <ErrorState message={loadError} onRetry={loadData} retryLabel="Coba lagi" />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Indikator Perubahan Belum Disimpan */}
      {isDirty && (
        <div
          className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-800/80 text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-3"
          role="status"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
            <span>Anda memiliki perubahan yang belum disimpan.</span>
          </div>
          <Badge variant="warning">Belum Disimpan</Badge>
        </div>
      )}

      {serverError && (
        <div
          className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-sm flex items-start gap-2.5"
          role="alert"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      {/* 1. Logo Organisasi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#22D3EE]" aria-hidden="true" />
            Logo & Identitas Organisasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ImageUploadField
            label="Logo Organisasi"
            currentUrl={profile?.logo_url ?? null}
            onUpload={handleLogoUpload}
            onDelete={profile?.logo_url ? handleLogoDelete : undefined}
            fallbackText={form.short_name?.slice(0, 3).toUpperCase() || 'KT'}
            helperText="Unggah logo resmi (JPG, PNG, WebP, maks. 2 MB). Metadata EXIF otomatis dibersihkan."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Lengkap Organisasi"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              errorMessage={fieldErrors.name?.[0]}
              maxLength={120}
              required
            />
            <Input
              label="Nama Singkat"
              value={form.short_name}
              onChange={(e) => updateField('short_name', e.target.value)}
              errorMessage={fieldErrors.short_name?.[0]}
              maxLength={50}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tagline / Slogan"
              value={form.tagline ?? ''}
              onChange={(e) => updateField('tagline', e.target.value)}
              errorMessage={fieldErrors.tagline?.[0]}
              maxLength={150}
              placeholder="Contoh: Muda, Bergerak, Bermakna"
            />
            <Input
              label="Label Wilayah"
              value={form.region_label}
              onChange={(e) => updateField('region_label', e.target.value)}
              errorMessage={fieldErrors.region_label?.[0]}
              maxLength={150}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Tentang & Sejarah */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#22D3EE]" aria-hidden="true" />
            Tentang & Sejarah
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Tentang Organisasi (Tampil di Pengantar)"
            value={form.about}
            onChange={(e) => updateField('about', e.target.value)}
            errorMessage={fieldErrors.about?.[0]}
            rows={4}
            maxLength={3000}
            required
          />
          <Textarea
            label="Sejarah Singkat Organisasi"
            value={form.history ?? ''}
            onChange={(e) => updateField('history', e.target.value)}
            errorMessage={fieldErrors.history?.[0]}
            rows={4}
            maxLength={3000}
          />
        </CardContent>
      </Card>

      {/* 3. Visi, Misi & Nilai Utama */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#22D3EE]" aria-hidden="true" />
            Visi, Misi & Nilai Utama
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Textarea
            label="Visi Organisasi"
            value={form.vision}
            onChange={(e) => updateField('vision', e.target.value)}
            errorMessage={fieldErrors.vision?.[0]}
            rows={3}
            maxLength={1000}
            required
          />

          {/* Daftar Misi */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-[#E6ECF8]">
                Daftar Misi Organisasi
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAddArrayItem('missions')}
                className="min-h-[44px]"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Tambah Misi
              </Button>
            </div>

            {fieldErrors.missions?.[0] && (
              <p className="text-xs text-red-400" role="alert">
                {fieldErrors.missions[0]}
              </p>
            )}

            <div className="space-y-2.5">
              {form.missions.map((mission, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="min-w-[28px] h-[44px] flex items-center justify-center text-xs font-bold text-[#9AA8C4] tabular-nums">
                    {idx + 1}.
                  </span>
                  <div className="flex-1">
                    <Input
                      aria-label={`Poin misi nomor ${idx + 1}`}
                      value={mission}
                      onChange={(e) => handleArrayChange('missions', idx, e.target.value)}
                      errorMessage={fieldErrors[`missions.${idx}`]?.[0]}
                      maxLength={300}
                      placeholder={`Masukkan poin misi ke-${idx + 1}`}
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={idx === 0}
                      onClick={() => handleMoveArrayItem('missions', idx, -1)}
                      className="min-w-[44px] min-h-[44px] px-0"
                      aria-label={`Naikkan misi ${idx + 1}`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={idx === form.missions.length - 1}
                      onClick={() => handleMoveArrayItem('missions', idx, 1)}
                      className="min-w-[44px] min-h-[44px] px-0"
                      aria-label={`Turunkan misi ${idx + 1}`}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={form.missions.length <= 1}
                      onClick={() => handleRemoveArrayItem('missions', idx)}
                      className="min-w-[44px] min-h-[44px] px-0 text-[#F87171] hover:bg-red-950/30"
                      aria-label={`Hapus misi ${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daftar Nilai Utama */}
          <div className="space-y-3 pt-4 border-t border-slate-800/70">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-[#E6ECF8]">
                Nilai Utama Organisasi
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAddArrayItem('values')}
                className="min-h-[44px]"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Tambah Nilai
              </Button>
            </div>

            {(!form.values || form.values.length === 0) && (
              <p className="text-xs text-[#9AA8C4]">
                Belum ada nilai utama ditambahkan (opsional).
              </p>
            )}

            <div className="space-y-2.5">
              {(form.values || []).map((val, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      aria-label={`Nilai utama nomor ${idx + 1}`}
                      value={val}
                      onChange={(e) => handleArrayChange('values', idx, e.target.value)}
                      errorMessage={fieldErrors[`values.${idx}`]?.[0]}
                      maxLength={150}
                      placeholder="Contoh: Transparansi & Gotong Royong"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveArrayItem('values', idx)}
                    className="min-w-[44px] min-h-[44px] px-0 text-[#F87171] hover:bg-red-950/30"
                    aria-label={`Hapus nilai ${idx + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Kontak & Media Sosial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-[#22D3EE]" aria-hidden="true" />
            Kontak & Media Sosial Resmi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Alamat Sekretariat"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            errorMessage={fieldErrors.address?.[0]}
            rows={2}
            maxLength={500}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="WhatsApp Resmi (Format Internasional)"
              value={form.whatsapp}
              onChange={(e) => updateField('whatsapp', e.target.value)}
              errorMessage={fieldErrors.whatsapp?.[0]}
              helperText="Hanya angka diawali kode negara (contoh: 6281234567890)."
              maxLength={16}
              required
            />
            <Input
              label="Email Resmi"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              errorMessage={fieldErrors.email?.[0]}
              maxLength={100}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="URL Instagram"
              type="url"
              value={form.instagram ?? ''}
              onChange={(e) => updateField('instagram', e.target.value)}
              errorMessage={fieldErrors.instagram?.[0]}
              placeholder="https://instagram.com/..."
            />
            <Input
              label="URL Facebook"
              type="url"
              value={form.facebook ?? ''}
              onChange={(e) => updateField('facebook', e.target.value)}
              errorMessage={fieldErrors.facebook?.[0]}
              placeholder="https://facebook.com/..."
            />
            <Input
              label="URL YouTube"
              type="url"
              value={form.youtube ?? ''}
              onChange={(e) => updateField('youtube', e.target.value)}
              errorMessage={fieldErrors.youtube?.[0]}
              placeholder="https://youtube.com/..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Tombol Simpan Sticky */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" isLoading={isSaving} className="min-h-[44px] px-6">
          <Save className="w-4 h-4 mr-2" />
          Simpan Profil Organisasi
        </Button>
      </div>
    </form>
  )
}
