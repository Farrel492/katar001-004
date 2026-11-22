# Aturan Kerja Agen — Karang Taruna RT 001 RW 004

Baca docs/PRD.md, docs/keputusan.md, dan docs/arsitektur.md sebelum mengerjakan tugas apa pun.

## Konteks
Website informasi dan pengelolaan digital untuk satu RT. Dua area: publik (tanpa login) dan admin (login).
Pemilik proyek ingin memahami prosesnya, jadi jelaskan keputusan teknis dengan bahasa jelas.

## Stack (lihat docs/keputusan.md untuk status final)
- backend/: Laravel REST API, auth Sanctum mode SPA (cookie + CSRF), MySQL/MariaDB via Laragon
- frontend/: React + Vite + TypeScript, Tailwind, React Router, TanStack Query, React Hook Form + Zod
- Three.js dan GSAP hanya untuk hero/animasi tertentu: lazy-load, wajib ada fallback, hormati prefers-reduced-motion

## Cara kerja
- Kerjakan SATU modul atau tugas kecil per permintaan. Jangan membuat seluruh website sekaligus.
- Periksa struktur proyek yang ada sebelum menulis kode. Jangan mengarang nama file, dependency, atau struktur.
- Jangan mengubah keputusan di docs/keputusan.md tanpa bertanya. Jika menemukan kekurangan pada PRD, usulkan dulu.
- Jangan menghapus fitur yang sudah ada tanpa alasan dan persetujuan.
- Jangan membuat asumsi atas informasi yang belum ada. Tanyakan satu hal penting jika memang menghambat.
- Berikan kode lengkap dengan path file yang jelas.

## Aturan keamanan (wajib)
- Endpoint publik HANYA mengembalikan data berstatus `published`. Gunakan scope/query terpusat, jangan filter manual per controller.
- Setiap endpoint admin: autentikasi + otorisasi (policy) di backend. Menyembunyikan tombol di frontend tidak cukup.
- Validasi input di backend (FormRequest). Validasi frontend hanya untuk kenyamanan.
- Password di-hash (bawaan Laravel). Jangan simpan secret di repository. Jangan commit .env.
- Cegah SQL injection (Eloquent/query binding), XSS (jangan render HTML mentah dari input), CSRF, dan IDOR (cek kepemilikan/status di server).
- Upload: validasi ekstensi dan MIME, batas ukuran, nama file acak, simpan di storage, gambar dikompres ke WebP. File draft tidak boleh diakses lewat URL langsung.
- Login: rate limiting, pesan error tidak membocorkan apakah akun ada.
- Catat aktivitas penting ke audit log (login, publikasi, perubahan/pembatalan transaksi, penghapusan).

## Aturan data keuangan
- Nominal disimpan sebagai bilangan bulat Rupiah (BIGINT), bukan float.
- Saldo tidak disimpan; selalu dihitung: saldo akhir = saldo awal + pemasukan - pengeluaran.
- Transaksi tidak dihapus permanen: dibatalkan (void) dengan alasan dan tercatat di audit log.
- Kas RT 001 dan Kas Karang Taruna tidak boleh tercampur dalam perhitungan maupun ekspor.
- Ekspor Excel/PDF dibuat dari data database terkini.

## Konvensi
- Kode, nama variabel, tabel, dan endpoint: bahasa Inggris. Teks yang dilihat pengguna: bahasa Indonesia.
- Komponen reusable, pisahkan logika bisnis dari presentasi, hindari duplikasi.
- Setiap perubahan database melalui migration.
- Setiap halaman/komponen data punya state: loading, kosong, sukses, error.
- Responsif (ponsel, tablet, desktop). Perhatikan aksesibilitas (label form, kontras, keyboard).
- Performa ponsel menengah: lazy-load gambar dan 3D, code splitting.

## Hal yang DILARANG tanpa izin
- Menjalankan perintah destruktif (hapus folder/database, git reset --hard, migrate:fresh pada data nyata).
- Menambahkan dependency besar tanpa menjelaskan alasannya.
- Mengubah file .env atau memasukkan kredensial ke kode.

## Setelah menyelesaikan tugas, laporkan
1. Apa yang dibuat dan cara kerjanya.
2. Daftar file yang dibuat atau diubah.
3. Cara menjalankan dan menguji.
4. Potensi bug atau risiko.
5. Pastikan modul sebelumnya tidak rusak.