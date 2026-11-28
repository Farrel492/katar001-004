import { useState, useEffect, useCallback } from 'react'
import {
  Wallet,
  Plus,
  Search,
  Download,
  Settings,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Receipt,
  ExternalLink,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
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
  getAdminFinanceTransactions,
  getAdminFinanceCategories,
  createAdminFinanceCategory,
  updateAdminFinanceCategory,
  deleteAdminFinanceCategory,
  getAdminFinanceSettings,
  updateAdminFinanceSettings,
  createAdminFinanceTransaction,
  updateAdminFinanceTransaction,
  deleteAdminFinanceTransaction,
  publishAdminFinanceTransaction,
  unpublishAdminFinanceTransaction,
  uploadAdminFinanceProof,
  deleteAdminFinanceProof,
  getAdminFinanceProofUrl,
  type FinanceTransactionData,
  type FinanceCategoryData,
  type FinanceSettingData,
  type FinanceType,
  ApiError,
} from '@/lib/api'
import { formatRupiah, formatDate } from '@/lib/format'

export default function AdminFinancePage() {
  useDocumentTitle('Kelola Keuangan', true)

  const [transactions, setTransactions] = useState<FinanceTransactionData[]>([])
  const [categories, setCategories] = useState<FinanceCategoryData[]>([])
  const [settings, setSettings] = useState<FinanceSettingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Filter & Pencarian
  const [filterMonth, setFilterMonth] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 4000)
  }, [])

  // Modal State: Tambah/Ubah Transaksi
  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<FinanceTransactionData | null>(null)
  const [txType, setTxType] = useState<FinanceType>('income')
  const [txCategoryId, setTxCategoryId] = useState<string>('')
  const [txAmount, setTxAmount] = useState<string>('')
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [txDescription, setTxDescription] = useState<string>('')
  const [txCounterparty, setTxCounterparty] = useState<string>('')
  const [txCounterpartyPublic, setTxCounterpartyPublic] = useState<boolean>(false)
  const [txSubmitting, setTxSubmitting] = useState(false)

  // Modal State: Kelola Kategori
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatType, setNewCatType] = useState<FinanceType>('income')
  const [catSubmitting, setCatSubmitting] = useState(false)
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<FinanceCategoryData | null>(null)
  const [deleteCatLoading, setDeleteCatLoading] = useState(false)

  // Modal State: Pengaturan Saldo Awal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [openingBalanceInput, setOpeningBalanceInput] = useState<string>('0')
  const [openingDateInput, setOpeningDateInput] = useState<string>(new Date().toISOString().slice(0, 10))
  const [settingsSubmitting, setSettingsSubmitting] = useState(false)

  // Modal State: Pratinjau / Upload Bukti Nota
  const [isProofModalOpen, setIsProofModalOpen] = useState(false)
  const [activeProofTx, setActiveProofTx] = useState<FinanceTransactionData | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofSubmitting, setProofSubmitting] = useState(false)

  // Dialog Konfirmasi Terbit / Tarik Kembali / Hapus
  const [confirmPublishId, setConfirmPublishId] = useState<number | null>(null)
  const [confirmUnpublishId, setConfirmUnpublishId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [txRes, catRes, setRes] = await Promise.all([
        getAdminFinanceTransactions({
          month: filterMonth || undefined,
          type: filterType || undefined,
          category_id: filterCategory ? Number(filterCategory) : undefined,
          status: filterStatus || undefined,
          search: searchQuery || undefined,
          page: currentPage,
        }),
        getAdminFinanceCategories(),
        getAdminFinanceSettings(),
      ])

      setTransactions(txRes.data)
      setCurrentPage(txRes.current_page)
      setLastPage(txRes.last_page)
      setTotalItems(txRes.total)
      setCategories(catRes)
      setSettings(setRes)
      setOpeningBalanceInput(String(setRes.opening_balance))
      setOpeningDateInput(setRes.opening_date)
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal memuat data keuangan.'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [filterMonth, filterType, filterCategory, filterStatus, searchQuery, currentPage, showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Hitung Ringkasan dari daftar yang tampil / total
  const totalIncome = transactions
    .filter((t) => t.status === 'published' && t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0)

  const totalExpense = transactions
    .filter((t) => t.status === 'published' && t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0)

  // Handler Buka Modal Tambah Transaksi
  const handleOpenAddTx = () => {
    setEditingTx(null)
    setTxType('income')
    const defaultCat = categories.find((c) => c.type === 'income' && c.is_active)
    setTxCategoryId(defaultCat ? String(defaultCat.id) : '')
    setTxAmount('')
    setTxDate(new Date().toISOString().slice(0, 10))
    setTxDescription('')
    setTxCounterparty('')
    setTxCounterpartyPublic(false)
    setIsTxModalOpen(true)
  }

  // Handler Buka Modal Ubah Transaksi
  const handleOpenEditTx = (tx: FinanceTransactionData) => {
    setEditingTx(tx)
    setTxType(tx.type)
    setTxCategoryId(String(tx.category_id))
    setTxAmount(String(tx.amount))
    setTxDate(tx.transaction_date.slice(0, 10))
    setTxDescription(tx.description)
    setTxCounterparty(tx.counterparty || '')
    setTxCounterpartyPublic(tx.counterparty_public)
    setIsTxModalOpen(true)
  }

  // Simpan Transaksi Baru / Ubah
  const handleSaveTx = async (publishImmediately = false) => {
    const rawAmount = Number(txAmount.replace(/[^\d]/g, ''))
    if (!rawAmount || rawAmount <= 0) {
      showToast('Nominal transaksi harus lebih dari Rp 0.', 'error')
      return
    }
    if (rawAmount > 1000000000) {
      showToast('Nominal transaksi maksimal Rp 1.000.000.000 (1 milyar).', 'error')
      return
    }
    if (!txCategoryId) {
      showToast('Kategori transaksi wajib dipilih.', 'error')
      return
    }
    if (!txDescription.trim()) {
      showToast('Keterangan transaksi wajib diisi.', 'error')
      return
    }

    try {
      setTxSubmitting(true)
      if (editingTx) {
        await updateAdminFinanceTransaction(editingTx.id, {
          type: txType,
          category_id: Number(txCategoryId),
          amount: rawAmount,
          transaction_date: txDate,
          description: txDescription.trim(),
          counterparty: txCounterparty.trim() || null,
          counterparty_public: txCounterpartyPublic,
        })
        showToast('Transaksi berhasil diperbarui.', 'success')
      } else {
        await createAdminFinanceTransaction({
          type: txType,
          category_id: Number(txCategoryId),
          amount: rawAmount,
          transaction_date: txDate,
          description: txDescription.trim(),
          counterparty: txCounterparty.trim() || null,
          counterparty_public: txCounterpartyPublic,
          status: publishImmediately ? 'published' : 'draft',
        })
        showToast(
          publishImmediately ? 'Transaksi berhasil diterbitkan.' : 'Transaksi draft berhasil disimpan.',
          'success',
        )
      }

      setIsTxModalOpen(false)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menyimpan transaksi.'
      showToast(msg, 'error')
    } finally {
      setTxSubmitting(false)
    }
  }

  // Publish Transaksi
  const handleConfirmPublish = async () => {
    if (!confirmPublishId) return
    try {
      setActionLoading(true)
      await publishAdminFinanceTransaction(confirmPublishId)
      showToast('Transaksi berhasil diterbitkan. Data kini tampil di buku kas publik.', 'success')
      setConfirmPublishId(null)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menerbitkan transaksi.'
      showToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Tarik Kembali ke Draf
  const handleConfirmUnpublish = async () => {
    if (!confirmUnpublishId) return
    try {
      setActionLoading(true)
      await unpublishAdminFinanceTransaction(confirmUnpublishId)
      showToast('Transaksi berhasil ditarik kembali ke draf.', 'success')
      setConfirmUnpublishId(null)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menarik kembali transaksi.'
      showToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Hapus Transaksi (Soft Delete)
  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return
    try {
      setActionLoading(true)
      await deleteAdminFinanceTransaction(confirmDeleteId)
      showToast('Transaksi berhasil dihapus.', 'success')
      setConfirmDeleteId(null)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menghapus transaksi.'
      showToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }
  // Kelola Kategori: Tambah Kategori
  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      showToast('Nama kategori wajib diisi.', 'error')
      return
    }

    try {
      setCatSubmitting(true)
      await createAdminFinanceCategory({
        name: newCatName.trim(),
        type: newCatType,
        is_active: true,
      })
      showToast('Kategori baru berhasil ditambahkan.', 'success')
      setNewCatName('')
      const catRes = await getAdminFinanceCategories()
      setCategories(catRes)
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menambahkan kategori.'
      showToast(msg, 'error')
    } finally {
      setCatSubmitting(false)
    }
  }

  // Kelola Kategori: Toggle Aktif
  const handleToggleCategoryActive = async (cat: FinanceCategoryData) => {
    try {
      await updateAdminFinanceCategory(cat.id, {
        is_active: !cat.is_active,
      })
      showToast(`Kategori "${cat.name}" berhasil ${!cat.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`, 'success')
      const catRes = await getAdminFinanceCategories()
      setCategories(catRes)
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal mengubah status kategori.'
      showToast(msg, 'error')
    }
  }

  // Kelola Kategori: Hapus Kategori
  const handleDeleteCategory = async () => {
    if (!confirmDeleteCat) return
    try {
      setDeleteCatLoading(true)
      await deleteAdminFinanceCategory(confirmDeleteCat.id)
      showToast(`Kategori "${confirmDeleteCat.name}" berhasil dihapus.`, 'success')
      setConfirmDeleteCat(null)
      const catRes = await getAdminFinanceCategories()
      setCategories(catRes)
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menghapus kategori.'
      showToast(msg, 'error')
    } finally {
      setDeleteCatLoading(false)
    }
  }

  // Simpan Saldo Awal
  const handleSaveSettings = async () => {
    const rawBalance = Number(openingBalanceInput.replace(/[^\d-]/g, ''))
    if (isNaN(rawBalance)) {
      showToast('Nominal saldo awal tidak valid.', 'error')
      return
    }
    if (!openingDateInput) {
      showToast('Tanggal saldo awal wajib diisi.', 'error')
      return
    }

    try {
      setSettingsSubmitting(true)
      const res = await updateAdminFinanceSettings({
        opening_balance: rawBalance,
        opening_date: openingDateInput,
      })
      showToast('Pengaturan saldo awal kas berhasil disimpan.', 'success')
      setSettings(res)
      setIsSettingsModalOpen(false)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menyimpan saldo awal.'
      showToast(msg, 'error')
    } finally {
      setSettingsSubmitting(false)
    }
  }

  // Bukti Nota: Upload
  const handleUploadProof = async () => {
    if (!activeProofTx || !proofFile) return

    try {
      setProofSubmitting(true)
      await uploadAdminFinanceProof(activeProofTx.id, proofFile)
      showToast('Bukti nota berhasil disimpan ke penyimpanan privat.', 'success')
      setIsProofModalOpen(false)
      setProofFile(null)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal mengunggah bukti nota.'
      showToast(msg, 'error')
    } finally {
      setProofSubmitting(false)
    }
  }

  // Bukti Nota: Hapus
  const handleDeleteProof = async (txId: number) => {
    try {
      setProofSubmitting(true)
      await deleteAdminFinanceProof(txId)
      showToast('Bukti nota berhasil dihapus.', 'success')
      setIsProofModalOpen(false)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menghapus bukti nota.'
      showToast(msg, 'error')
    } finally {
      setProofSubmitting(false)
    }
  }

  // Ekspor CSV
  const handleExportCsv = () => {
    const params = new URLSearchParams()
    if (filterMonth) params.set('month', filterMonth)
    window.location.href = `/api/admin/finance/export?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#E6ECF8] tracking-tight">
            Pengelolaan Kas & Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-[#9AA8C4] mt-1">
            Pencatatan kas transparan RT 001 RW 004 dengan integritas bilangan bulat Rupiah dan audit log.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            className="min-h-[44px] cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2" />
            Ekspor CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
            className="min-h-[44px] cursor-pointer"
          >
            <Tag className="w-4 h-4 mr-2" />
            Kategori
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsSettingsModalOpen(true)}
            className="min-h-[44px] cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-2" />
            Saldo Awal
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddTx}
            className="min-h-[44px] cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {/* Kartu Ringkasan Keuangan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Awal */}
        <Card className="bg-[#0C1427] border-slate-800/80">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider block">
              Saldo Awal Kas
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-[#E6ECF8] mt-1 block">
              {formatRupiah(settings?.opening_balance ?? 0)}
            </span>
            <span className="text-[11px] text-[#9AA8C4] block mt-1">
              Per {settings?.opening_date ? formatDate(settings.opening_date) : '-'}
            </span>
          </CardContent>
        </Card>

        {/* Pemasukan Terbit */}
        <Card className="bg-[#0C1427] border-slate-800/80">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider">
                Total Pemasukan (Terbit)
              </span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1 block">
              {formatRupiah(totalIncome)}
            </span>
            <span className="text-[11px] text-[#9AA8C4] block mt-1">
              Daftar tersaring saat ini
            </span>
          </CardContent>
        </Card>

        {/* Pengeluaran Terbit */}
        <Card className="bg-[#0C1427] border-slate-800/80">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider">
                Total Pengeluaran (Terbit)
              </span>
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-rose-400 mt-1 block">
              {formatRupiah(totalExpense)}
            </span>
            <span className="text-[11px] text-[#9AA8C4] block mt-1">
              Daftar tersaring saat ini
            </span>
          </CardContent>
        </Card>

        {/* Saldo Kas Berjalan */}
        <Card className="bg-[#0C1427] border-[#2F6BFF]/40 shadow-lg shadow-blue-950/20">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#22D3EE] uppercase tracking-wider">
                Saldo Kas Berjalan
              </span>
              <Wallet className="w-4 h-4 text-[#22D3EE]" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-[#22D3EE] mt-1 block">
              {formatRupiah((settings?.opening_balance ?? 0) + totalIncome - totalExpense)}
            </span>
            <span className="text-[11px] text-[#9AA8C4] block mt-1">
              Akumulasi tersaring
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter dan Pencarian */}
      <Card className="bg-[#0C1427] border-slate-800/80">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Cari */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA8C4]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Cari transaksi / pihak..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#060B18] border border-slate-700/80 rounded-xl text-sm text-[#E6ECF8] placeholder-[#9AA8C4]/60 focus:outline-none focus:border-[#2F6BFF] min-h-[44px]"
              />
            </div>

            {/* Bulan */}
            <div>
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }}
                className="min-h-[44px]"
              />
            </div>

            {/* Jenis */}
            <div>
              <Select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                options={[
                  { value: '', label: 'Semua Jenis' },
                  { value: 'income', label: 'Pemasukan' },
                  { value: 'expense', label: 'Pengeluaran' },
                ]}
              />
            </div>

            {/* Kategori */}
            <div>
              <Select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                options={[
                  { value: '', label: 'Semua Kategori' },
                  ...categories.map((c) => ({
                    value: String(c.id),
                    label: `${c.name} (${c.type === 'income' ? 'Masuk' : 'Keluar'})`,
                  })),
                ]}
              />
            </div>

            {/* Status */}
            <div>
              <Select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                options={[
                  { value: '', label: 'Semua Status' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Terbit' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Transaksi */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <Spinner />
          <p className="text-sm text-[#9AA8C4]">Memuat transaksi kas...</p>
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Wallet className="w-8 h-8 text-[#22D3EE]" />}
          title="Tidak ada transaksi ditemukan"
          description="Belum ada transaksi yang sesuai dengan filter atau kata kunci saat ini."
          action={
            <Button variant="primary" size="sm" onClick={handleOpenAddTx} className="min-h-[44px]">
              <Plus className="w-4 h-4 mr-1.5" />
              Catat Transaksi Pertama
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-[#0C1427] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-[#080E1E] text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Jenis & Kategori</th>
                    <th className="py-3.5 px-4">Keterangan & Pihak</th>
                    <th className="py-3.5 px-4 text-right">Nominal (Rp)</th>
                    <th className="py-3.5 px-4 text-center">Nota</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {transactions.map((tx) => {
                    const isIncome = tx.type === 'income'
                    const isCorrection = tx.corrects_id !== null
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap text-xs text-[#9AA8C4] font-medium">
                          {formatDate(tx.transaction_date)}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isIncome
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                                }`}
                            >
                              {isIncome ? 'Masuk' : 'Keluar'}
                            </span>
                            <span className="text-xs text-[#E6ECF8] font-medium">
                              {tx.category ? tx.category.name : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 max-w-xs">
                          <p className="font-semibold text-[#E6ECF8] truncate">{tx.description}</p>
                          {tx.counterparty && (
                            <p className="text-[11px] text-[#9AA8C4] truncate">
                              Pihak: {tx.counterparty}{' '}
                              {tx.counterparty_public ? (
                                <span className="text-cyan-400 font-medium">(Tampil di publik)</span>
                              ) : (
                                <span className="text-slate-500">(Internal)</span>
                              )}
                            </p>
                          )}
                          {isCorrection && tx.correction_reason && (
                            <p className="text-[11px] text-amber-400/90 italic truncate">
                              Koreksi: {tx.correction_reason}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap font-mono font-bold">
                          <span className={isIncome ? 'text-emerald-400' : 'text-rose-400'}>
                            {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {tx.proof_path ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveProofTx(tx)
                                setIsProofModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1 text-xs text-[#22D3EE] hover:underline cursor-pointer"
                              title="Lihat bukti nota privat"
                            >
                              <Receipt className="w-4 h-4" />
                              Ada Nota
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveProofTx(tx)
                                setIsProofModalOpen(true)
                              }}
                              className="text-xs text-slate-500 hover:text-[#22D3EE] cursor-pointer"
                              title="Unggah bukti nota"
                            >
                              + Nota
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isCorrection ? (
                            <Badge variant="warning">Koreksi</Badge>
                          ) : tx.status === 'published' ? (
                            <Badge variant="published">Terbit</Badge>
                          ) : (
                            <Badge variant="draft">Draft</Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Ubah: langsung edit data transaksi ini */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditTx(tx)}
                              className="text-[#9AA8C4] hover:text-[#22D3EE] min-h-[38px] px-2"
                              title="Ubah transaksi ini"
                              aria-label="Ubah transaksi ini"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            {/* Tombol Publikasi / Tarik Kembali ke Draf */}
                            {tx.status === 'draft' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmPublishId(tx.id)}
                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 min-h-[38px] px-2"
                                title="Terbitkan transaksi"
                                aria-label="Terbitkan transaksi"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmUnpublishId(tx.id)}
                                className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 min-h-[38px] px-2"
                                title="Tarik kembali ke draf"
                                aria-label="Tarik kembali ke draf"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Tombol Hapus: tersedia untuk semua transaksi */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDeleteId(tx.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/30 min-h-[38px] px-2"
                              title="Hapus transaksi"
                              aria-label="Hapus transaksi"
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

          {/* Paginasi */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between p-3 bg-[#0C1427] border border-slate-800/80 rounded-xl text-xs text-[#9AA8C4]">
              <span>
                Menampilkan halaman {currentPage} dari {lastPage} (Total {totalItems} transaksi)
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
      )
      }

      {/* Modal 1: Tambah / Ubah Transaksi */}
      <Modal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title={editingTx ? 'Ubah Transaksi' : 'Catat Transaksi Kas Baru'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Radio Jenis Transaksi */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setTxType('income')
                const first = categories.find((c) => c.type === 'income' && c.is_active)
                if (first) setTxCategoryId(String(first.id))
              }}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${txType === 'income'
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                : 'bg-[#060B18] border-slate-800 text-slate-400 hover:text-white'
                }`}
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Pemasukan (Kas Masuk)
            </button>

            <button
              type="button"
              onClick={() => {
                setTxType('expense')
                const first = categories.find((c) => c.type === 'expense' && c.is_active)
                if (first) setTxCategoryId(String(first.id))
              }}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${txType === 'expense'
                ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                : 'bg-[#060B18] border-slate-800 text-slate-400 hover:text-white'
                }`}
            >
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
              Pengeluaran (Kas Keluar)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kategori */}
            <FormField htmlFor="tx-category" label="Kategori Transaksi" required>
              <Select
                value={txCategoryId}
                onChange={(e) => setTxCategoryId(e.target.value)}
                options={categories
                  .filter((c) => c.type === txType && c.is_active)
                  .map((c) => ({ value: String(c.id), label: c.name }))}
              />
            </FormField>

            {/* Nominal (Rupiah integer) */}
            <FormField htmlFor="tx-amount" label="Nominal (Rupiah)" required helperText="Bilangan bulat tanpa desimal">
              <Input
                id="tx-amount"
                type="text"
                value={txAmount ? formatRupiah(txAmount).replace('Rp ', '') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '')
                  setTxAmount(raw)
                }}
                placeholder="Contoh: 150.000"
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal */}
            <FormField htmlFor="tx-date" label="Tanggal Transaksi" required>
              <Input
                id="tx-date"
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                required
              />
            </FormField>

            {/* Pihak Terkait */}
            <FormField htmlFor="tx-counterparty" label="Pihak Terkait (Warga / Toko / Rekanan)">
              <Input
                id="tx-counterparty"
                type="text"
                value={txCounterparty}
                onChange={(e) => setTxCounterparty(e.target.value)}
                placeholder="Contoh: Toko Bangunan Berkah / Bpk. Joko"
                maxLength={80}
              />
            </FormField>
          </div>

          {/* Checkbox Publikasi Pihak */}
          {txCounterparty && (
            <label className="flex items-center gap-2.5 p-3 bg-[#060B18] border border-slate-800 rounded-xl cursor-pointer text-xs text-[#9AA8C4]">
              <input
                type="checkbox"
                checked={txCounterpartyPublic}
                onChange={(e) => setTxCounterpartyPublic(e.target.checked)}
                className="w-4 h-4 rounded text-[#2F6BFF] bg-slate-800 border-slate-700"
              />
              <span>Tampilkan nama pihak &quot;{txCounterparty}&quot; pada laporan transparansi warga.</span>
            </label>
          )}

          {/* Keterangan */}
          <FormField htmlFor="tx-desc" label="Keterangan Rinci Transaksi" required helperText="Maksimal 200 karakter">
            <Input
              id="tx-desc"
              type="text"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              placeholder="Contoh: Pembelian 3 roll kabel & stopkontak untuk perbaikan pos RT"
              maxLength={200}
              required
            />
          </FormField>

          {/* Tombol Simpan */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsTxModalOpen(false)}
              disabled={txSubmitting}
              className="min-h-[44px]"
            >
              Batal
            </Button>

            {!editingTx && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSaveTx(true)}
                disabled={txSubmitting}
                className="min-h-[44px] bg-emerald-600 hover:bg-emerald-500"
              >
                {txSubmitting ? 'Memproses...' : 'Simpan & Terbitkan Langsung'}
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSaveTx(false)}
              disabled={txSubmitting}
              className="min-h-[44px]"
            >
              {txSubmitting ? 'Menyimpan...' : editingTx ? 'Simpan Perubahan' : 'Simpan sebagai Draft'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Kelola Kategori */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Kelola Kategori Keuangan"
        size="md"
      >
        <div className="space-y-6">
          {/* Form Tambah Kategori */}
          <div className="p-4 bg-[#060B18] border border-slate-800 rounded-xl space-y-3">
            <span className="text-xs font-bold text-[#E6ECF8] uppercase tracking-wider block">
              Tambah Kategori Baru
            </span>
            <div className="flex gap-2">
              <div className="w-1/3">
                <Select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as FinanceType)}
                  options={[
                    { value: 'income', label: 'Pemasukan' },
                    { value: 'expense', label: 'Pengeluaran' },
                  ]}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nama kategori..."
                  maxLength={80}
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddCategory}
                disabled={catSubmitting}
                className="min-h-[44px] shrink-0"
              >
                {catSubmitting ? <Spinner className="w-4 h-4" /> : 'Tambah'}
              </Button>
            </div>
          </div>

          {/* Daftar Kategori */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            <span className="text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider block">
              Daftar Kategori Tersedia:
            </span>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 bg-[#060B18] border border-slate-800/80 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${cat.type === 'income' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}
                  >
                    {cat.type === 'income' ? 'Masuk' : 'Keluar'}
                  </span>
                  <span className={`font-medium ${cat.is_active ? 'text-[#E6ECF8]' : 'text-slate-500 line-through'}`}>
                    {cat.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleCategoryActive(cat)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${cat.is_active
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950/40'
                      }`}
                  >
                    {cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteCat(cat)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-900/50"
                    title={`Hapus kategori ${cat.name}`}
                    aria-label={`Hapus kategori ${cat.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal 4: Pengaturan Saldo Awal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Pengaturan Saldo Awal Kas"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#9AA8C4] leading-relaxed">
            Saldo awal adalah angka saldo pembuka buku kas sebelum transaksi dicatat. Seluruh admin dan superadmin memiliki akses penuh untuk memperbarui nilai ini.
          </p>

          <FormField htmlFor="opening-balance" label="Nominal Saldo Awal (Rupiah)" required>
            <Input
              id="opening-balance"
              type="text"
              value={formatRupiah(openingBalanceInput).replace('Rp ', '')}
              onChange={(e) => setOpeningBalanceInput(e.target.value.replace(/[^\d-]/g, ''))}
              placeholder="Contoh: 5.000.000"
              required
            />
          </FormField>

          <FormField htmlFor="opening-date" label="Tanggal Pembukuan Saldo Awal" required>
            <Input
              id="opening-date"
              type="date"
              value={openingDateInput}
              onChange={(e) => setOpeningDateInput(e.target.value)}
              required
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSettingsModalOpen(false)}
              disabled={settingsSubmitting}
              className="min-h-[44px]"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveSettings}
              disabled={settingsSubmitting}
              className="min-h-[44px]"
            >
              {settingsSubmitting ? 'Menyimpan...' : 'Simpan Saldo Awal'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 5: Pratinjau / Upload Bukti Nota */}
      <Modal
        isOpen={isProofModalOpen}
        onClose={() => {
          setIsProofModalOpen(false)
          setActiveProofTx(null)
          setProofFile(null)
        }}
        title="Bukti Nota / Kwitansi Transaksi"
        size="md"
      >
        {activeProofTx && (
          <div className="space-y-4">
            <div className="text-xs text-[#9AA8C4]">
              Transaksi: <strong>{activeProofTx.description}</strong> ({formatRupiah(activeProofTx.amount)})
            </div>

            {/* Jika Bukti Nota Sudah Ada */}
            {activeProofTx.proof_path ? (
              <div className="space-y-3">
                <div className="p-2 bg-[#060B18] border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center max-h-80">
                  <img
                    src={getAdminFinanceProofUrl(activeProofTx.id)}
                    alt="Bukti Nota Kas"
                    className="max-h-72 object-contain rounded-lg"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <a
                    href={getAdminFinanceProofUrl(activeProofTx.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#22D3EE] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Ukuran Penuh
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProof(activeProofTx.id)}
                    disabled={proofSubmitting}
                    className="text-red-400 hover:text-red-300 min-h-[40px]"
                  >
                    Hapus Bukti
                  </Button>
                </div>
              </div>
            ) : (
              /* Unggah Bukti Baru */
              <div className="space-y-3">
                <FormField htmlFor="proof-upload" label="Pilih Berkas Bukti (JPG, PNG, atau WebP, maks 2MB)">
                  <Input
                    id="proof-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setProofFile(e.target.files[0])
                    }}
                  />
                </FormField>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleUploadProof}
                    disabled={!proofFile || proofSubmitting}
                    className="min-h-[44px]"
                  >
                    {proofSubmitting ? 'Mengunggah...' : 'Unggah Bukti Nota'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      {/* Dialog Konfirmasi Terbitkan Transaksi */}
      <ConfirmDialog
        isOpen={confirmPublishId !== null}
        onClose={() => setConfirmPublishId(null)}
        onConfirm={handleConfirmPublish}
        title="Terbitkan Transaksi Kas"
        description="Apakah Anda yakin ingin menerbitkan transaksi ini? Transaksi yang terbit akan tampil di buku kas transparansi warga dan mempengaruhi saldo publik."
        confirmLabel={actionLoading ? 'Menerbitkan...' : 'Ya, Terbitkan'}
        variant="primary"
      />

      {/* Dialog Konfirmasi Tarik Kembali ke Draf */}
      <ConfirmDialog
        isOpen={confirmUnpublishId !== null}
        onClose={() => setConfirmUnpublishId(null)}
        onConfirm={handleConfirmUnpublish}
        title="Tarik Kembali ke Draf"
        description="Apakah Anda yakin ingin menarik kembali transaksi ini ke status draf? Transaksi berstatus draf tidak akan tampil di buku kas publik maupun mempengaruhi saldo publik warga."
        confirmLabel={actionLoading ? 'Menarik...' : 'Ya, Tarik ke Draf'}
        variant="primary"
      />

      {/* Dialog Konfirmasi Hapus Transaksi */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Transaksi Kas"
        description="Apakah Anda yakin ingin menghapus transaksi ini? Data akan dipindahkan ke arsip sementara (soft-delete)."
        confirmLabel={actionLoading ? 'Menghapus...' : 'Ya, Hapus'}
        variant="danger"
      />

      {/* Dialog Konfirmasi Hapus Kategori */}
      <ConfirmDialog
        isOpen={confirmDeleteCat !== null}
        onClose={() => setConfirmDeleteCat(null)}
        onConfirm={handleDeleteCategory}
        title="Hapus Kategori Keuangan"
        description={`Apakah Anda yakin ingin menghapus kategori "${confirmDeleteCat?.name}"? Tindakan ini tidak dapat dibatalkan. Kategori hanya dapat dihapus jika belum pernah digunakan pada transaksi kas.`}
        confirmLabel={deleteCatLoading ? 'Menghapus...' : 'Ya, Hapus Kategori'}
        variant="danger"
      />
    </div>
  )
}