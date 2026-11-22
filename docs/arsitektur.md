# Arsitektur dan Konvensi Teknis

## Gambaran
Browser -> React (Vite) -> Laravel REST API -> MySQL/MariaDB.
Frontend tidak mengakses database. Validasi, autentikasi, otorisasi, dan aturan bisnis ada di backend.

## Struktur backend (Laravel)
- app/Http/Controllers/Public/   : endpoint publik (hanya data published)
- app/Http/Controllers/Admin/    : endpoint admin (auth + policy)
- app/Http/Requests/             : validasi input (FormRequest)
- app/Http/Resources/            : bentuk respons JSON
- app/Models/                    : model Eloquent (+ scope published())
- app/Policies/                  : otorisasi
- app/Enums/                     : ContentStatus, TransactionType, SuggestionStatus, dst.
- app/Services/                  : logika bisnis (mis. Finance/BalanceCalculator, ImageOptimizer)
- database/migrations, database/seeders
- routes/api.php                 : /api/public/* dan /api/admin/*

## Struktur frontend (React + TS)
src/
- app/            : router, providers, layout (PublicLayout, AdminLayout)
- features/public/<modul>/  : halaman + komponen publik
- features/admin/<modul>/   : halaman + komponen admin
- components/ui/            : komponen dasar (Button, Card, Input, Modal, Table, Badge)
- components/charts/        : grafik
- components/three/         : elemen 3D (lazy-load, fallback)
- lib/                      : api client, format Rupiah/tanggal, util
- hooks/                    : custom hooks
- styles/tokens.css         : design tokens
- types/                    : tipe TypeScript bersama

## Konvensi API
- Prefix: /api/public/... (tanpa login) dan /api/admin/... (wajib login)
- JSON, huruf snake_case pada field, pesan validasi dalam bahasa Indonesia
- Daftar memakai pagination
- Kode status: 200/201 sukses, 401 belum login, 403 tidak berwenang, 404 tidak ada/tidak terbit, 422 validasi, 429 rate limit
- Resource draft/preview tidak boleh bocor ke endpoint publik; kembalikan 404

## Status konten
Enum: draft | preview | published. Kolom status + published_at.
Scope `published()` dipakai oleh semua query publik.

## Konvensi database
- Tabel: snake_case jamak (organization_members, transactions)
- Primary key bigint, timestamps, soft delete bila relevan
- Foreign key dengan aturan hapus yang jelas
- Uang: BIGINT (Rupiah, tanpa desimal)
- Tanggal disimpan UTC; tampil Asia/Jakarta
- Index pada kolom filter (status, tanggal, cash_book_id)

## Entitas (konseptual, lihat PRD bagian 13)
Admin, OrganizationProfile, OrganizationMember, Event, EventMedia, CashBook, Transaction,
FinancialPeriod/OpeningBalance, Suggestion, ServiceInfo, BusinessDirectory, AuditLog.

## Setup lokal
Prasyarat: Laragon (PHP, MySQL/MariaDB, Composer), Node.js, Git.
1. Buat database `karang_taruna` (utf8mb4_unicode_ci) di HeidiSQL/phpMyAdmin Laragon.
2. composer create-project laravel/laravel backend
3. Atur backend/.env (hanya lokal, jangan di-commit):
   APP_URL=http://localhost:8000
   FRONTEND_URL=http://localhost:5173
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=karang_taruna
   DB_USERNAME=<user>
   DB_PASSWORD=<password>
   SANCTUM_STATEFUL_DOMAINS=localhost:5173
   SESSION_DOMAIN=localhost
   Salin juga kunci yang sama (tanpa nilai rahasia) ke backend/.env.example.
4. php artisan migrate
5. npm create vite@latest frontend -- --template react-ts, lalu npm install
6. Vite dev proxy: teruskan /api dan /sanctum ke http://localhost:8000 (satu origin, meniru produksi)
7. Uji koneksi: endpoint GET /api/health tampil di halaman React

## Pengujian
Backend: PHPUnit/Pest (fokus: akses draft, otorisasi admin, perhitungan saldo, validasi impor).
Frontend: uji manual desktop dan ponsel; tambahkan uji komponen kritis bila perlu.
Lihat skenario uji di docs/PRD.md bagian 16.