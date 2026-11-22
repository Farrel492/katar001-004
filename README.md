# Website Karang Taruna RT 001 RW 004

Platform informasi dan pengelolaan digital Karang Taruna RT 001 RW 004,
Kelurahan Jatibening Baru, Kecamatan Pondok Gede, Kota Bekasi.

- Area publik: informasi organisasi, agenda, dokumentasi, transparansi keuangan, aspirasi warga.
- Area admin: dashboard pengelolaan konten, keuangan, dan moderasi (URL login khusus).

## Dokumen
- docs/PRD.md: kebutuhan produk (acuan utama)
- docs/ide-awal.md: latar belakang dan ide awal
- docs/keputusan.md: keputusan yang sudah dan belum final
- docs/arsitektur.md: arsitektur dan konvensi teknis
- docs/roadmap.md: tahapan dan progres
- docs/design-system.md: arah dan token desain

## Stack
Laravel (REST API) + MySQL/MariaDB (Laragon) | React + Vite + TypeScript + Tailwind

## Menjalankan (lokal)
1. Jalankan Laragon (Start All).
2. Backend:
   cd backend
   php artisan serve        -> http://localhost:8000
3. Frontend (terminal lain):
   cd frontend
   npm run dev              -> http://localhost:5173

## Setup awal
Lihat bagian "Setup lokal" di docs/arsitektur.md.