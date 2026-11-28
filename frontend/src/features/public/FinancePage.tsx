import { useState, useEffect, useCallback } from 'react'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Table as TableIcon,
  BarChart3,
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
  Spinner,
  EmptyState,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  getPublicFinanceSummary,
  getPublicFinanceTransactions,
  getPublicFinanceCategories,
  type FinanceSummaryData,
  type PublicFinanceTransactionData,
  type FinanceCategoryData,
} from '@/lib/api'
import { formatRupiah, formatDate } from '@/lib/format'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

const MONTH_FULL_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default function FinancePage() {
  useDocumentTitle('Transparansi Keuangan')

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [summary, setSummary] = useState<FinanceSummaryData | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  // Transaksi List State
  const [transactions, setTransactions] = useState<PublicFinanceTransactionData[]>([])
  const [categories, setCategories] = useState<FinanceCategoryData[]>([])
  const [txLoading, setTxLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Filter
  const [filterMonth, setFilterMonth] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  // Toggle Tampilan Tabel vs Grafik
  const [showAccessibleTable, setShowAccessibleTable] = useState(false)

  // Load Summary
  const loadSummary = useCallback(async (year: number) => {
    try {
      setSummaryLoading(true)
      const data = await getPublicFinanceSummary(year)
      setSummary(data)
    } catch {
      // Abaikan error awal
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  // Load Transactions
  const loadTransactions = useCallback(async (page: number) => {
    try {
      setTxLoading(true)
      const [txRes, catRes] = await Promise.all([
        getPublicFinanceTransactions({
          month: filterMonth || undefined,
          type: filterType || undefined,
          category_id: filterCategory ? Number(filterCategory) : undefined,
          page,
        }),
        categories.length === 0 ? getPublicFinanceCategories().catch(() => []) : Promise.resolve(categories),
      ])

      setTransactions(txRes.data)
      setCurrentPage(txRes.current_page)
      setLastPage(txRes.last_page)
      setTotalItems(txRes.total)
      if (catRes.length > 0) setCategories(catRes)
    } catch {
      // Abaikan error
    } finally {
      setTxLoading(false)
    }
  }, [filterMonth, filterType, filterCategory, categories])

  useEffect(() => {
    loadSummary(selectedYear)
  }, [loadSummary, selectedYear])

  useEffect(() => {
    loadTransactions(currentPage)
  }, [loadTransactions, currentPage])

  // Hitung Nilai Maksimum untuk Grafik SVG
  const monthlyData = summary?.monthly || []
  const maxMonthlyVal = Math.max(
    ...monthlyData.map((m) => Math.max(m.income, m.expense)),
    100000,
  )

  return (
    <div className="py-8 sm:py-12 space-y-12 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header Halaman */}
          <div className="space-y-2 max-w-[70ch]">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
              Transparansi Keuangan Warga
            </h1>
              <p className="text-base sm:text-[17px] text-[var(--text-muted)] leading-relaxed">
                Laporan kas resmi RT 001 RW 004 yang telah diterbitkan.{' '}
                <span className="text-[var(--accent)] font-medium">
                  {summary?.last_published_at
                    ? `Data per ${formatDate(summary.last_published_at)}.`
                    : 'Belum ada transaksi terbit.'}
                </span>
              </p>
          </div>

          {/* Bagian 1: Kartu Ringkasan Keuangan (sinkron dengan admin) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Saldo Awal Kas */}
            <Card className="bg-[#0C1427] border-slate-800/80">
              <CardContent className="p-4 sm:p-5">
                <span className="text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider block">
                  Saldo Awal Kas
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-[#E6ECF8] mt-1 block">
                  {summaryLoading ? (
                    <span className="inline-block h-7 w-36 bg-slate-800 rounded animate-pulse" />
                  ) : (
                    formatRupiah(summary?.opening_balance ?? 0)
                  )}
                </span>
                <span className="text-[11px] text-[#9AA8C4] block mt-1">
                  Per {summary?.opening_date ? formatDate(summary.opening_date) : '-'}
                </span>
              </CardContent>
            </Card>

            {/* Total Pemasukan (semua waktu, published) */}
            <Card className="bg-[#0C1427] border-slate-800/80">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider">
                    Total Pemasukan (Terbit)
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1 block">
                  {summaryLoading ? '...' : formatRupiah(summary?.total_income ?? 0)}
                </span>
                <span className="text-[11px] text-[#9AA8C4] block mt-1">
                  Daftar tersaring saat ini
                </span>
              </CardContent>
            </Card>

            {/* Total Pengeluaran (semua waktu, published) */}
            <Card className="bg-[#0C1427] border-slate-800/80">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#9AA8C4] uppercase tracking-wider">
                    Total Pengeluaran (Terbit)
                  </span>
                  <ArrowDownRight className="w-4 h-4 text-rose-400" />
                </div>
                <span className="text-xl sm:text-2xl font-extrabold text-rose-400 mt-1 block">
                  {summaryLoading ? '...' : formatRupiah(summary?.total_expense ?? 0)}
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
                  {summaryLoading ? '...' : formatRupiah(summary?.balance ?? 0)}
                </span>
                <span className="text-[11px] text-[#9AA8C4] block mt-1">
                  Akumulasi tersaring
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Bagian 2: Grafik Batang Arus Kas Bulanan (SVG Murni) & Tabel Aksesibilitas */}
          <Card className="bg-[#0C1427] border-slate-800/80 shadow-xl overflow-hidden">
            <CardHeader className="p-6 pb-2 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-[#E6ECF8] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#22D3EE]" />
                  Grafik Arus Kas Bulanan ({selectedYear})
                </CardTitle>
                <CardDescription className="text-xs text-[#9AA8C4] mt-0.5">
                  Perbandingan nominal kas masuk (biru muda) vs kas keluar (merah muda) per bulan.
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                {/* Toggle Tampilkan Tabel Alternatif */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAccessibleTable((prev) => !prev)}
                  className="text-xs min-h-[40px] cursor-pointer"
                >
                  <TableIcon className="w-3.5 h-3.5 mr-1.5" />
                  {showAccessibleTable ? 'Sembunyikan Tabel Data' : 'Tampilkan Tabel Data'}
                </Button>

                {/* Pilihan Tahun */}
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-[#060B18] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-[#E6ECF8] focus:outline-none focus:border-[#2F6BFF] min-h-[40px]"
                >
                  <option value={2026}>Tahun 2026</option>
                  <option value={2025}>Tahun 2025</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {summaryLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <Spinner />
                  <p className="text-xs text-[#9AA8C4]">Memuat visual grafik arus kas...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Visual SVG Bar Chart */}
                  <div className="w-full overflow-x-auto pb-2">
                    <div className="min-w-[680px]">
                      <svg
                        viewBox="0 0 780 230"
                        className="w-full h-60 overflow-visible"
                        role="img"
                        aria-label={`Grafik arus kas bulanan tahun ${selectedYear}`}
                      >
                        {/* Skala Sumbu Y */}
                        <text x="58" y="24" textAnchor="end" fontSize="10" fill="#9AA8C4" className="tabular-nums">
                          {formatRupiah(maxMonthlyVal)}
                        </text>
                        <text x="58" y="99" textAnchor="end" fontSize="10" fill="#9AA8C4" className="tabular-nums">
                          {formatRupiah(Math.round(maxMonthlyVal / 2))}
                        </text>
                        <text x="58" y="174" textAnchor="end" fontSize="10" fill="#9AA8C4" className="tabular-nums">
                          Rp 0
                        </text>

                        {/* Garis Bantu Grid Horizontal */}
                        <line x1="66" y1="20" x2="765" y2="20" stroke="#1E293B" strokeDasharray="4 4" />
                        <line x1="66" y1="95" x2="765" y2="95" stroke="#1E293B" strokeDasharray="4 4" />
                        <line x1="66" y1="170" x2="765" y2="170" stroke="#334155" strokeWidth="1.5" />

                        {/* Batang Per Bulan (tinggi minimum 8px untuk nilai > 0) */}
                        {monthlyData.map((m, idx) => {
                          const groupX = 82 + idx * 56
                          const barW = 15
                          const maxBarH = 145

                          const incH = m.income > 0 ? Math.max(8, (m.income / maxMonthlyVal) * maxBarH) : 0
                          const expH = m.expense > 0 ? Math.max(8, (m.expense / maxMonthlyVal) * maxBarH) : 0

                          const incY = 170 - incH
                          const expY = 170 - expH

                          return (
                              <g key={m.month}>
                                {incH > 0 && (
                                  <rect
                                    x={groupX}
                                    y={incY}
                                    width={barW}
                                    height={incH}
                                    rx={3}
                                    fill="#22D3EE"
                                  >
                                    <title>{`${MONTH_FULL_NAMES[idx]} - Masuk: ${formatRupiah(m.income)}`}</title>
                                  </rect>
                                )}
                                {expH > 0 && (
                                  <rect
                                    x={groupX + barW + 3}
                                    y={expY}
                                    width={barW}
                                    height={expH}
                                    rx={3}
                                    fill="#F87171"
                                  >
                                    <title>{`${MONTH_FULL_NAMES[idx]} - Keluar: ${formatRupiah(m.expense)}`}</title>
                                  </rect>
                                )}
                                <text
                                  x={groupX + barW}
                                  y="192"
                                  textAnchor="middle"
                                  fontSize="11"
                                  fontWeight="600"
                                  fill="#9AA8C4"
                                >
                                  {MONTH_NAMES[idx]}
                                </text>
                              </g>
                              )
                            })}
                            </svg>
                        </div>
                  </div>

                  {/* Legenda Grafik */}
                  <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#9AA8C4] pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-[#22D3EE]" />
                      <span>Pemasukan Kas Masuk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-[#F87171]" />
                      <span>Pengeluaran Kas Keluar</span>
                    </div>
                  </div>

                  {/* TABEL ALTERNATIF AKSESIBEL (Screen Reader & Toggle Pengguna) */}
                  <div className={showAccessibleTable ? 'block pt-4 border-t border-slate-800' : 'sr-only'}>
                    <h3 className="text-sm font-bold text-[#E6ECF8] mb-3">
                      Tabel Ringkasan Data Bulanan Tahun {selectedYear}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <caption className="sr-only">
                          Rincian pemasukan, pengeluaran, dan saldo bersih per bulan untuk tahun {selectedYear}
                        </caption>
                        <thead>
                          <tr className="border-b border-slate-800 text-[#9AA8C4] uppercase font-semibold">
                            <th className="py-2 px-3">Bulan</th>
                            <th className="py-2 px-3 text-right">Pemasukan</th>
                            <th className="py-2 px-3 text-right">Pengeluaran</th>
                            <th className="py-2 px-3 text-right">Selisih Bersih</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {monthlyData.map((m, i) => (
                            <tr key={m.month} className="hover:bg-slate-800/20">
                              <td className="py-2.5 px-3 font-medium text-[#E6ECF8]">
                                {MONTH_FULL_NAMES[i]}
                              </td>
                              <td className="py-2.5 px-3 text-right text-emerald-400 font-mono">
                                {formatRupiah(m.income)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-rose-400 font-mono">
                                {formatRupiah(m.expense)}
                              </td>
                              <td
                                className={`py-2.5 px-3 text-right font-mono font-semibold ${m.net >= 0 ? 'text-[#22D3EE]' : 'text-rose-400'
                                  }`}
                              >
                                {formatRupiah(m.net)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bagian 3: Daftar Transaksi Publik Terperinci */}
          <div className="space-y-6 pt-6 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#E6ECF8] tracking-tight">
                  Buku Transaksi Kas Terbuka
                </h2>
                <p className="text-xs sm:text-sm text-[#9AA8C4] mt-0.5">
                  Daftar transaksi kas resmi yang telah disetujui dan diterbitkan.
                </p>
              </div>

              <span className="text-xs text-[#9AA8C4] px-3 py-1 bg-[#0C1427] border border-slate-800 rounded-lg self-start sm:self-auto">
                Total {totalItems} Transaksi Terpublikasi
              </span>
            </div>

            {/* Filter Bar */}
            <Card className="bg-[#0C1427] border-slate-800/80">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Filter Bulan */}
                  <div>
                    <Input
                      type="month"
                      value={filterMonth}
                      onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }}
                      className="min-h-[44px]"
                    />
                  </div>

                  {/* Filter Jenis */}
                  <div>
                    <Select
                      value={filterType}
                      onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                      options={[
                        { value: '', label: 'Semua Jenis Transaksi' },
                        { value: 'income', label: 'Pemasukan Kas' },
                        { value: 'expense', label: 'Pengeluaran Kas' },
                      ]}
                    />
                  </div>

                  {/* Filter Kategori */}
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
                </div>
              </CardContent>
            </Card>

            {/* Tabel Transaksi Publik */}
            {txLoading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3">
                <Spinner />
                <p className="text-xs text-[#9AA8C4]">Memuat buku transaksi kas...</p>
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={<Wallet className="w-8 h-8 text-[#22D3EE]" />}
                title="Tidak Ada Transaksi yang Sesuai"
                description="Belum ada transaksi kas terpublikasi untuk kriteria bulan atau kategori ini."
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
                          <th className="py-3.5 px-4">Keterangan</th>
                          <th className="py-3.5 px-4">Pihak / Donatur</th>
                          <th className="py-3.5 px-4 text-right">Nominal (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm">
                        {transactions.map((tx) => {
                          const isIncome = tx.type === 'income'
                          return (
                            <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors">
                              <td className="py-4 px-4 whitespace-nowrap text-xs text-[#9AA8C4] font-medium">
                                {formatDate(tx.transaction_date)}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isIncome
                                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                      : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                                      }`}
                                  >
                                    {isIncome ? 'Masuk' : 'Keluar'}
                                  </span>
                                  <span className="text-xs text-[#E6ECF8] font-medium">
                                    {tx.category}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4 max-w-sm">
                                <p className="font-semibold text-[#E6ECF8]">{tx.description}</p>
                                {tx.is_correction && (
                                  <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/50 border border-amber-800/60 text-[11px] text-amber-300">
                                    <RotateCcw className="w-3 h-3 shrink-0" />
                                    <span>Koreksi: {tx.correction_reason || 'Penyelarasan pembukuan'}</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-xs text-[#9AA8C4]">
                                {tx.counterparty_label || '-'}
                              </td>
                              <td className="py-4 px-4 text-right whitespace-nowrap font-mono font-bold">
                                <span className={isIncome ? 'text-emerald-400' : 'text-rose-400'}>
                                  {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Paginasi Transaksi */}
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
