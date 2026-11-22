# Roadmap dan Progres

Centang setelah selesai dan diuji.

## Fase 0 — Keputusan dan persiapan
- [ ] Cek lingkungan Laragon (php -v, composer -V, node -v, mysql --version)
- [ ] Jawab keputusan "menghambat" di docs/keputusan.md
- [ ] Kumpulkan referensi dashboard admin dan contoh Excel keuangan (dummy)
- [ ] Repo Git dan struktur folder siap

## Fase 1 — Desain
- [ ] Design system (warna, tipografi, spacing, radius, komponen)
- [ ] Mockup halaman publik (beranda, struktur, agenda, galeri, keuangan, aspirasi)
- [ ] Mockup admin (login, dashboard, keuangan, moderasi)
- [ ] Strategi tabel di ponsel
- [ ] Persetujuan desain

## Fase 2 — Fondasi (MVP 1)
- [ ] Setup backend + frontend + koneksi DB, endpoint /api/health
- [ ] Layout publik dan admin, routing
- [ ] Login admin aman (Sanctum, rate limit, logout), audit log dasar
- [ ] Irisan vertikal: Struktur Organisasi (DB -> API -> admin -> publik, status Draft/Preview/Published)
- [ ] Deploy staging awal (uji hosting)

## Fase 3 — Konten (MVP 2)
- [ ] Agenda
- [ ] Dokumentasi/galeri + upload + kompresi gambar
- [ ] Alur Draft/Preview/Published untuk semua konten

## Fase 4 — Keuangan (MVP 3)
- [ ] Buku kas terpisah + transaksi + saldo awal periode
- [ ] Filter, ringkasan (4 kartu), void transaksi + audit
- [ ] Impor Excel dengan pratinjau dan validasi
- [ ] Ekspor Excel dan PDF dari data terkini
- [ ] Kunci/koreksi periode sesuai kebijakan

## Fase 5 — Aspirasi (MVP 4)
- [ ] Form publik + anti-spam
- [ ] Moderasi admin, status, tanggapan

## Fase 6 — Pengerasan dan rilis
- [ ] Uji keamanan (IDOR, akses draft, upload, endpoint tanpa login)
- [ ] Uji perangkat nyata dan tanpa WebGL
- [ ] Backup dan uji restore
- [ ] Kebijakan privasi, panduan admin
- [ ] Deploy produksi (HTTPS)

## Fase 7 — Lanjutan
- [ ] Informasi Layanan Warga
- [ ] Direktori UMKM
- [ ] 2FA, role terpisah, penyempurnaan 3D/animasi