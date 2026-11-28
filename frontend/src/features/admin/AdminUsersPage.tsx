import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  KeyRound,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Shield,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  PageHeader,
  Input,
  Select,
  Skeleton,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  type ManagedUser,
  ApiError,
} from '@/lib/api';
import { cn } from '@/lib/utils';

function formatIndonesianDate(isoString: string | null): string {
  if (!isoString) return 'Belum pernah';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Belum pernah';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return 'Belum pernah';
  }
}

export default function AdminUsersPage() {
  useDocumentTitle('Manajemen Akun Pengguna', true);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Notifikasi sukses
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Tambah
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addRole, setAddRole] = useState<'admin' | 'superadmin'>('admin');
  const [addError, setAddError] = useState<string | null>(null);
  const [addValidationErrors, setAddValidationErrors] = useState<Record<string, string[]>>({});
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Modal Kata Sandi Sementara (Memory State ONLY - dihapus saat modal ditutup)
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempPasswordOwner, setTempPasswordOwner] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Modal Edit
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'superadmin'>('admin');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [editValidationErrors, setEditValidationErrors] = useState<Record<string, string[]>>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Dialog Konfirmasi Reset Sandi
  const [resetTargetUser, setResetTargetUser] = useState<ManagedUser | null>(null);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Dialog Konfirmasi Hapus
  const [deleteTargetUser, setDeleteTargetUser] = useState<ManagedUser | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Ref untuk aksesibilitas fokus tombol pemicu
  const addTriggerRef = useRef<HTMLButtonElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setLoadError(err.message);
      } else {
        setLoadError('Gagal memuat daftar akun. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Keyboard trap & Escape listener untuk modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (tempPassword) {
          closeTempPasswordModal();
        } else if (isAddOpen) {
          setIsAddOpen(false);
        } else if (editingUser) {
          setEditingUser(null);
        } else if (resetTargetUser) {
          setResetTargetUser(null);
        } else if (deleteTargetUser) {
          setDeleteTargetUser(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tempPassword, isAddOpen, editingUser, resetTargetUser, deleteTargetUser]);

  // Handler Buka Tambah
  const handleOpenAdd = () => {
    lastActiveElementRef.current = document.activeElement as HTMLElement;
    setAddName('');
    setAddUsername('');
    setAddRole('admin');
    setAddError(null);
    setAddValidationErrors({});
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    lastActiveElementRef.current?.focus();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddValidationErrors({});
    setIsSubmittingAdd(true);

    try {
      const res = await createUser({
        name: addName.trim(),
        username: addUsername.trim(),
        role: addRole,
      });

      setIsAddOpen(false);
      // Tampilkan modal kata sandi sementara (hanya di memori)
      setTempPassword(res.temporary_password);
      setTempPasswordOwner(res.data.name);
      setIsCopied(false);
      showToast(`Akun ${res.data.name} berhasil dibuat.`);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 422) {
        const payload = err.data as { message?: string; errors?: Record<string, string[]> };
        setAddError(payload.message || 'Validasi gagal. Periksa isian form.');
        if (payload.errors) {
          setAddValidationErrors(payload.errors);
        }
      } else if (err instanceof ApiError) {
        setAddError(err.message);
      } else {
        setAddError('Terjadi kesalahan saat menambahkan akun.');
      }
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handler Modal Kata Sandi Sementara
  const closeTempPasswordModal = () => {
    setTempPassword(null);
    setTempPasswordOwner('');
    setIsCopied(false);
    lastActiveElementRef.current?.focus();
  };

  const handleCopyPassword = async () => {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Handler Buka Edit
  const handleOpenEdit = (user: ManagedUser) => {
    lastActiveElementRef.current = document.activeElement as HTMLElement;
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditIsActive(user.is_active);
    setEditError(null);
    setEditValidationErrors({});
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
    lastActiveElementRef.current?.focus();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditError(null);
    setEditValidationErrors({});
    setIsSubmittingEdit(true);

    try {
      await updateUser(editingUser.id, {
        name: editName.trim(),
        role: editRole,
        is_active: editIsActive,
      });

      setEditingUser(null);
      showToast(`Akun ${editName} berhasil diperbarui.`);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 422) {
        const payload = err.data as { message?: string; errors?: Record<string, string[]> };
        setEditError(payload.message || 'Gagal memperbarui akun.');
        if (payload.errors) {
          setEditValidationErrors(payload.errors);
        }
      } else if (err instanceof ApiError) {
        setEditError(err.message);
      } else {
        setEditError('Terjadi kesalahan saat menyimpan perubahan.');
      }
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handler Reset Sandi
  const handleOpenReset = (user: ManagedUser) => {
    lastActiveElementRef.current = document.activeElement as HTMLElement;
    setResetTargetUser(user);
    setResetError(null);
  };

  const handleCloseReset = () => {
    setResetTargetUser(null);
    lastActiveElementRef.current?.focus();
  };

  const handleConfirmReset = async () => {
    if (!resetTargetUser) return;
    setIsSubmittingReset(true);
    setResetError(null);

    try {
      const res = await resetUserPassword(resetTargetUser.id);
      setResetTargetUser(null);
      setTempPassword(res.temporary_password);
      setTempPasswordOwner(resetTargetUser.name);
      setIsCopied(false);
      showToast(`Kata sandi untuk ${resetTargetUser.name} berhasil diatur ulang.`);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setResetError(err.message);
      } else {
        setResetError('Gagal mereset kata sandi akun.');
      }
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Handler Hapus Akun
  const handleOpenDelete = (user: ManagedUser) => {
    lastActiveElementRef.current = document.activeElement as HTMLElement;
    setDeleteTargetUser(user);
    setDeleteError(null);
  };

  const handleCloseDelete = () => {
    setDeleteTargetUser(null);
    lastActiveElementRef.current?.focus();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetUser) return;
    setIsSubmittingDelete(true);
    setDeleteError(null);

    try {
      await deleteUser(deleteTargetUser.id);
      setDeleteTargetUser(null);
      showToast(`Akun ${deleteTargetUser.name} berhasil dihapus.`);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setDeleteError(err.message);
      } else {
        setDeleteError('Gagal menghapus akun.');
      }
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const activeSuperadminCount = users.filter((u) => u.role === 'superadmin' && u.is_active).length;

  return (
    <div className="space-y-6">
      {/* Toast Notifikasi Sukses */}
      {toastMessage && (
        <div
          className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-sm flex items-center justify-between shadow-lg"
          role="status"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-emerald-400 hover:text-white rounded-lg focus-visible:outline-2 focus-visible:outline-cyan-400"
            aria-label="Tutup pemberitahuan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Halaman */}
      <PageHeader
        title="Manajemen Akun"
        description="Kelola akun pengurus Karang Taruna RT 001 RW 004, atur peran otorisasi, status aktif, dan reset kata sandi."
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border select-none bg-purple-950/60 text-purple-300 border-purple-800/70">
            <ShieldCheck className="w-3.5 h-3.5" />
            Khusus Superadmin
          </span>
        }
        actions={
          <Button
            ref={addTriggerRef}
            onClick={handleOpenAdd}
            className="min-h-[44px] cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Akun
          </Button>
        }
      />

      {/* Konten Utama */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : loadError ? (
        <ErrorState
          title="Gagal Memuat Akun Pengguna"
          message={loadError}
          retryLabel="Coba Lagi"
          onRetry={loadData}
        />
      ) : users.length === 0 ? (
        <EmptyState
          title="Belum Ada Akun Pengguna"
          description="Tambahkan akun pengurus pertama untuk mulai mengelola akses sistem."
          icon={<Users className="w-8 h-8 text-[#9AA8C4]" />}
          action={
            <Button onClick={handleOpenAdd} className="min-h-[44px]">
              <UserPlus className="w-4 h-4 mr-2" />
              Tambah Akun Sekarang
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Tabel Manajemen Akun">
              <thead className="bg-[#111B33]/80 border-b border-slate-800/80 text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Nama Pengurus</th>
                  <th scope="col" className="px-6 py-4">Username</th>
                  <th scope="col" className="px-6 py-4">Peran</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Login Terakhir</th>
                  <th scope="col" className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isLastActiveSuperadmin =
                    u.role === 'superadmin' && u.is_active && activeSuperadminCount <= 1;

                  return (
                    <tr
                      key={u.id}
                      className={cn(
                        'hover:bg-[#111B33]/40 transition-colors',
                        u.is_self && 'bg-blue-950/10',
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#E6ECF8]">{u.name}</span>
                          {u.is_self && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-950/80 border border-blue-700/80 text-blue-300">
                              Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-[#9AA8C4]">
                        @{u.username}
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'superadmin' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border select-none bg-purple-950/80 border-purple-700 text-purple-300">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Superadmin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border select-none bg-cyan-950/60 border-cyan-800/70 text-[#22D3EE]">
                            <Shield className="w-3.5 h-3.5" />
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-950/60 text-emerald-300 border-emerald-800/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-800/80 text-slate-400 border-slate-700/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#9AA8C4]">
                        {formatIndonesianDate(u.last_login_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ubah */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEdit(u)}
                            className="min-h-[44px] px-2.5 cursor-pointer"
                            title={`Ubah profil ${u.name}`}
                            aria-label={`Ubah akun ${u.name}`}
                          >
                            <Edit2 className="w-4 h-4 text-[#22D3EE]" />
                          </Button>

                          {/* Reset Kata Sandi */}
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={u.is_self}
                            onClick={() => handleOpenReset(u)}
                            className="min-h-[44px] px-2.5 cursor-pointer disabled:opacity-40"
                            title={
                              u.is_self
                                ? 'Gunakan menu Pengaturan Kata Sandi untuk akun sendiri'
                                : `Reset kata sandi ${u.name}`
                            }
                            aria-label={`Reset kata sandi ${u.name}`}
                          >
                            <KeyRound className="w-4 h-4 text-amber-400" />
                          </Button>

                          {/* Hapus */}
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={u.is_self || isLastActiveSuperadmin}
                            onClick={() => handleOpenDelete(u)}
                            className="min-h-[44px] px-2.5 cursor-pointer hover:bg-red-950/40 hover:border-red-800 disabled:opacity-40"
                            title={
                              u.is_self
                                ? 'Tidak dapat menghapus akun sendiri'
                                : isLastActiveSuperadmin
                                ? 'Tidak dapat menghapus superadmin aktif terakhir'
                                : `Hapus akun ${u.name}`
                            }
                            aria-label={`Hapus akun ${u.name}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="md:hidden divide-y divide-slate-800/80">
            {users.map((u) => {
              const isLastActiveSuperadmin =
                u.role === 'superadmin' && u.is_active && activeSuperadminCount <= 1;

              return (
                <div key={u.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#E6ECF8] text-base">{u.name}</h4>
                        {u.is_self && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-950/80 border border-blue-700/80 text-blue-300">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-[#9AA8C4] mt-0.5">@{u.username}</p>
                    </div>

                    <div>
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-950/60 text-emerald-300 border-emerald-800/70">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-800/80 text-slate-400 border-slate-700/60">
                          Nonaktif
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#9AA8C4] pt-1">
                    <div>
                      {u.role === 'superadmin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border select-none bg-purple-950/80 border-purple-700 text-purple-300">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Superadmin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border select-none bg-cyan-950/60 border-cyan-800/70 text-[#22D3EE]">
                          <Shield className="w-3.5 h-3.5" />
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-[11px]">
                      Login: {formatIndonesianDate(u.last_login_at)}
                    </span>
                  </div>

                  {/* Tombol Aksi Mobile (Target sentuh min 44px) */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenEdit(u)}
                      className="flex-1 min-h-[44px] text-xs cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5 text-[#22D3EE]" />
                      Ubah
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={u.is_self}
                      onClick={() => handleOpenReset(u)}
                      className="flex-1 min-h-[44px] text-xs cursor-pointer disabled:opacity-40"
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                      Reset
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={u.is_self || isLastActiveSuperadmin}
                      onClick={() => handleOpenDelete(u)}
                      className="min-h-[44px] px-3.5 cursor-pointer text-red-400 hover:bg-red-950/40 disabled:opacity-40"
                      aria-label={`Hapus ${u.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* 1. Modal Tambah Akun                                     */}
      {/* ======================================================== */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-add-title"
        >
          <div className="bg-[#0C1427] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-800/80">
              <h2 id="modal-add-title" className="text-lg font-bold text-[#E6ECF8]">
                Tambah Akun Pengurus Baru
              </h2>
              <button
                type="button"
                onClick={handleCloseAdd}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9AA8C4] hover:text-white hover:bg-slate-800/60 focus-visible:outline-2 focus-visible:outline-cyan-400"
                aria-label="Tutup dialog tambah akun"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {addError && (
                <div
                  className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5"
                  role="alert"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>{addError}</div>
                </div>
              )}

              <Input
                label="Nama Lengkap Pengurus"
                placeholder="Contoh: Muhammad Budi"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                errorMessage={addValidationErrors.name?.[0]}
                required
                maxLength={100}
                autoFocus
              />

              <Input
                label="Username"
                placeholder="contoh: budi.katar"
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                helperText="Format: 3-50 karakter (huruf kecil, angka, titik, strip, underscore)."
                errorMessage={addValidationErrors.username?.[0]}
                required
              />

              <Select
                label="Peran Akun"
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as 'admin' | 'superadmin')}
                options={[
                  { value: 'admin', label: 'Admin (Pengelola Konten, Agenda, Kas)' },
                  { value: 'superadmin', label: 'Superadmin (Akses Penuh & Manajemen Akun)' },
                ]}
                errorMessage={addValidationErrors.role?.[0]}
              />

              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/50 text-blue-200 text-xs">
                Kata sandi sementara akan dibuat otomatis oleh sistem dan ditampilkan kepada Anda setelah akun berhasil disimpan.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/60">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseAdd}
                  disabled={isSubmittingAdd}
                  className="min-h-[44px]"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="min-h-[44px]"
                >
                  {isSubmittingAdd ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Akun'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. Modal Kata Sandi Sementara                            */}
      {/* ======================================================== */}
      {tempPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-temp-pw-title"
        >
          <div className="bg-[#0C1427] border border-cyan-800/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 text-[#22D3EE] flex items-center justify-center mx-auto shadow-lg shadow-cyan-950/50">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 id="modal-temp-pw-title" className="text-xl font-bold text-[#E6ECF8]">
                Kata Sandi Sementara
              </h2>
              {tempPasswordOwner && (
                <p className="text-xs text-[#9AA8C4]">
                  Untuk akun: <strong className="text-white">{tempPasswordOwner}</strong>
                </p>
              )}

              {/* Box Kata Sandi */}
              <div className="mt-4 p-4 rounded-xl bg-[#060B18] border border-cyan-600/60 text-center space-y-2">
                <span className="block text-xl font-mono font-bold tracking-wider text-cyan-300 select-all">
                  {tempPassword}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyPassword}
                  className="w-full min-h-[44px] cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      Berhasil Disalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Salin Kata Sandi
                    </>
                  )}
                </Button>
              </div>

              {/* Peringatan Wajib PRD */}
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs text-left leading-relaxed">
                <strong className="block text-amber-100 font-semibold mb-1">
                  Penting:
                </strong>
                Hanya ditampilkan sekali. Serahkan langsung ke pemilik akun; ia wajib menggantinya saat login pertama.
              </div>

              <div className="pt-3">
                <Button
                  onClick={closeTempPasswordModal}
                  className="w-full min-h-[44px]"
                >
                  Saya Sudah Menyimpan Sandi Ini
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. Modal Ubah Akun                                       */}
      {/* ======================================================== */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-title"
        >
          <div className="bg-[#0C1427] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-800/80">
              <h2 id="modal-edit-title" className="text-lg font-bold text-[#E6ECF8]">
                Ubah Data Akun: {editingUser.name}
              </h2>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9AA8C4] hover:text-white hover:bg-slate-800/60 focus-visible:outline-2 focus-visible:outline-cyan-400"
                aria-label="Tutup dialog ubah akun"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div
                  className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5"
                  role="alert"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>{editError}</div>
                </div>
              )}

              <Input
                label="Nama Lengkap"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                errorMessage={editValidationErrors.name?.[0]}
                required
                maxLength={100}
                autoFocus
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#E6ECF8]">
                  Username
                </label>
                <input
                  type="text"
                  value={editingUser.username}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B18]/60 text-slate-400 border border-slate-800 text-sm cursor-not-allowed min-h-[44px]"
                />
                <p className="text-xs text-[#7182A4]">
                  Username bersifat permanen dan tidak dapat diubah setelah dibuat.
                </p>
              </div>

              <Select
                label="Peran Akun"
                value={editRole}
                disabled={editingUser.is_self}
                onChange={(e) => setEditRole(e.target.value as 'admin' | 'superadmin')}
                helperText={
                  editingUser.is_self
                    ? 'Anda tidak dapat mengubah peran akun Anda sendiri.'
                    : undefined
                }
                options={[
                  { value: 'admin', label: 'Admin (Pengelola Konten, Agenda, Kas)' },
                  { value: 'superadmin', label: 'Superadmin (Akses Penuh & Manajemen Akun)' },
                ]}
              />

              {/* Status Aktif */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-sm font-medium text-[#E6ECF8]">
                  Status Akun
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[#E6ECF8]">
                    <input
                      type="radio"
                      name="is_active"
                      checked={editIsActive === true}
                      onChange={() => setEditIsActive(true)}
                      disabled={editingUser.is_self}
                      className="w-4 h-4 text-[#2F6BFF] focus:ring-cyan-400"
                    />
                    <span>Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[#E6ECF8]">
                    <input
                      type="radio"
                      name="is_active"
                      checked={editIsActive === false}
                      onChange={() => setEditIsActive(false)}
                      disabled={
                        editingUser.is_self ||
                        (editingUser.role === 'superadmin' &&
                          editingUser.is_active &&
                          activeSuperadminCount <= 1)
                      }
                      className="w-4 h-4 text-[#2F6BFF] focus:ring-cyan-400"
                    />
                    <span>Nonaktif</span>
                  </label>
                </div>
                {editingUser.is_self && (
                  <p className="text-xs text-[#7182A4]">
                    Anda tidak dapat menonaktifkan akun Anda sendiri.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/60">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseEdit}
                  disabled={isSubmittingEdit}
                  className="min-h-[44px]"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="min-h-[44px]"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. Dialog Konfirmasi Reset Sandi                         */}
      {/* ======================================================== */}
      {resetTargetUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-reset-title"
        >
          <div className="bg-[#0C1427] border border-amber-800/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-400 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 id="modal-reset-title" className="text-base font-bold text-[#E6ECF8]">
                  Reset Kata Sandi Pengurus?
                </h2>
                <p className="text-xs text-[#9AA8C4] mt-1 leading-relaxed">
                  Kata sandi baru sementara akan dibuat untuk akun{' '}
                  <strong className="text-white">@{resetTargetUser.username}</strong> ({resetTargetUser.name}).
                  Semua sesi aktif akun tersebut akan segera dikeluarkan demi keamanan.
                </p>
              </div>
            </div>

            {resetError && (
              <div
                className="p-3 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-start gap-2"
                role="alert"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>{resetError}</div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={handleCloseReset}
                disabled={isSubmittingReset}
                className="min-h-[44px]"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmReset}
                disabled={isSubmittingReset}
                className="min-h-[44px] bg-amber-600 hover:bg-amber-500 text-white"
              >
                {isSubmittingReset ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Ya, Reset Kata Sandi'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. Dialog Konfirmasi Hapus Akun                          */}
      {/* ======================================================== */}
      {deleteTargetUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-title"
        >
          <div className="bg-[#0C1427] border border-red-800/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/80 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 id="modal-delete-title" className="text-base font-bold text-[#E6ECF8]">
                  Hapus Akun Pengurus?
                </h2>
                <p className="text-xs text-[#9AA8C4] mt-1 leading-relaxed">
                  Anda akan menghapus akun <strong className="text-white">{deleteTargetUser.name}</strong> (@{deleteTargetUser.username}).
                  Akun akan dinonaktifkan, seluruh sesi login akan ditutup, dan dicatat pada audit log.
                </p>
              </div>
            </div>

            {deleteError && (
              <div
                className="p-3 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-start gap-2"
                role="alert"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>{deleteError}</div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={handleCloseDelete}
                disabled={isSubmittingDelete}
                className="min-h-[44px]"
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
                className="min-h-[44px]"
              >
                {isSubmittingDelete ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Hapus Akun Sekarang'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
