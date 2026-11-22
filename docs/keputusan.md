# Catatan Keputusan Proyek

Perbarui file ini setiap ada keputusan baru. Agen tidak boleh mengubah keputusan "Final" tanpa persetujuan pemilik proyek.

## Final (disepakati)
| Topik | Keputusan |
|---|---|
| Frontend | React + Vite |
| Visual | Elegant Futuristic, dark navy, aksen electric blue/cyan, dashboard admin sebagai acuan |
| Akses admin | URL login khusus (mis. /loginadminkatar), tanpa tautan di halaman publik. Bukan pengaman utama. |
| Akun warga | Tidak ada. Informasi publik tanpa login |
| Role | Satu role admin di versi awal |
| Status konten | Draft, Preview, Published |
| Keuangan | Kas RT 001 dan Kas Karang Taruna terpisah; database = sumber data utama; ekspor dari data terkini |
| Aspirasi | Masuk antrean moderasi; label status + tanggapan pengurus |
| Konfirmasi ulang aspirasi | Ditunda (kandidat pengembangan berikutnya) |
| Lingkungan lokal | Laragon |
| Version control | Git |

## Rekomendasi teknis (menunggu konfirmasi)
- [ ] Backend: Laravel REST API + Sanctum SPA (cookie + CSRF), API dan frontend satu domain
- [ ] Bahasa frontend: TypeScript
- [ ] Styling: Tailwind CSS + design tokens (CSS variables)
- [ ] Data fetching: TanStack Query; Form: React Hook Form + Zod
- [ ] Chart: Recharts atau ECharts
- [ ] Excel: PhpSpreadsheet (Laravel Excel); PDF: DomPDF
- [ ] Gambar: Intervention Image, konversi WebP saat unggah
- [ ] Anti-spam aspirasi: honeypot + rate limit + Cloudflare Turnstile
- [ ] Uang disimpan sebagai integer Rupiah; transaksi di-void, bukan dihapus
- [ ] Preview = rute admin yang memakai komponen publik, tanpa tautan rahasia yang bisa dibagikan

## Belum diputuskan
- [ ] Engine database lokal: MySQL atau MariaDB, dan versi PHP (hasil `php -v`, `mysql --version`)
- [ ] Hosting dan domain (shared hosting / VPS / lainnya), anggaran
- [ ] Kebijakan koreksi laporan keuangan yang sudah Published (kunci + transaksi koreksi / edit langsung / snapshot)
- [ ] Siapa yang menyetujui publikasi laporan; siapa mengelola Kas RT
- [ ] Format impor Excel (butuh contoh file dari bendahara)
- [ ] Aspirasi tampil anonim atau bernama; masa simpan data
- [ ] Siapa admin, jumlah akun, admin cadangan, prosedur pemulihan akun
- [ ] Bukti transaksi (foto nota) boleh tampil publik atau tidak
- [ ] Prioritas SEO dan preview tautan WhatsApp sejak awal
- [ ] Target performa dan kapasitas (ukuran file, waktu muat)
- [ ] Domain tampilan: tema gelap saja atau ada mode terang untuk keterbacaan lansia
- [ ] Istilah "Genjutsu": referensi visual atau tool (belum jelas; bukan dependensi inti)

## Potensi pengembangan berikutnya
Role terpisah (bendahara/editor/superadmin) dan persetujuan dua langkah, 2FA, pengumuman/banner penting,
iCal agenda, tombol bagikan WhatsApp, statistik ramah privasi, konfirmasi ulang aspirasi, tren/kategori keuangan,
mode terang/kontras tinggi, Informasi Layanan Warga, Direktori UMKM.

## Riwayat perubahan
- 2026-11-22: dokumen dibuat.