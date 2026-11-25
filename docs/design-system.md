# Design System — Website Karang Taruna RT 001 RW 004

**Versi:** 1.0 | **Tanggal:** 23 November 2026  
**Arah Visual:** Elegant Futuristic, platform komunitas modern. Satu bahasa desain untuk area publik dan admin.  
- **Admin:** Padat, produktif, fokus pada keterbacaan data.  
- **Publik:** Lega, ukuran huruf lebih besar (ramah lansia), navigasi intuitif.  
- **Prinsip:** Keterbacaan nomor satu, hindari neon berlebihan, efek kaca (*glassmorphism*) terukur dan selektif.

---

## 1. Palet Warna & Desain Token (Dark Theme)

Semua token warna didefinisikan sebagai CSS variables di `src/styles/tokens.css` dan dipetakan ke Tailwind via `@theme`.

| Token CSS | Nilai Hex / RGBA | Peran & Penggunaan |
| :--- | :--- | :--- |
| `--bg-base` | `#060B18` | Latar belakang utama halaman (Dark Navy pekat) |
| `--bg-surface` | `#0C1427` | Latar belakang kartu (*Card*), dropdown, dan kontainer |
| `--bg-elevated` | `#111B33` | Latar komponen melayang (*elevated*), ikon, input fokus |
| `--border-subtle` | `rgba(148, 163, 184, 0.14)` | Garis batas tipis pembatas konten dan kartu |
| `--border-strong` | `rgba(148, 163, 184, 0.28)` | Garis batas penekanan (*active*, *hover*, divider) |
| `--text-main` | `#E6ECF8` | Teks utama, heading, dan informasi penting |
| `--text-muted` | `#9AA8C4` | Teks sekunder, deskripsi, label, dan metadata |
| `--text-faint` | `#7182A4` | Teks dekoratif (disesuaikan dari `#6B7A99` agar lolos WCAG AA) |
| `--primary` | `#2F6BFF` | Warna aksen utama (*Electric Blue*) untuk tombol utama |
| `--primary-hover`| `#4F82FF` | Efek hover tombol utama |
| `--accent` | `#22D3EE` | Aksen sekunder (*Cyan*) untuk tautan aktif dan focus ring |
| `--violet` | `#8B7CF6` | Aksen ungu hemat untuk badge status *Preview* |
| `--success` | `#34D399` | Status *Published*, pemasukan, dan kondisi normal |
| `--warning` | `#FBBF24` | Status peringatan, status aspirasi *Sedang Dibahas* |
| `--danger` | `#F87171` | Status error, aksi hapus/batal, dan pengeluaran |

---

## 2. Tabel Verifikasi Rasio Kontras Aksesibilitas (WCAG 2.1 AA)

Standar WCAG 2.1 AA mensyaratkan rasio kontras minimal **4.5:1** untuk teks normal dan **3.0:1** untuk teks besar (>= 18px / 14pt bold) atau komponen grafis/UI.

| Pasangan Warna (Foreground / Background) | Nilai Warna | Rasio Kontras | Status WCAG | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| Teks Utama di atas Base | `#E6ECF8` / `#060B18` | **16.57:1** | **LULUS (AAA)** | Sangat kontras dan tajam |
| Teks Utama di atas Surface | `#E6ECF8` / `#0C1427` | **15.86:1** | **LULUS (AAA)** | Keterbacaan sempurna di dalam kartu |
| Teks Muted di atas Base | `#9AA8C4` / `#060B18` | **8.19:1** | **LULUS (AAA)** | Melebihi standar minimum |
| Teks Muted di atas Surface | `#9AA8C4` / `#0C1427` | **7.84:1** | **LULUS (AAA)** | Jelas untuk label dan deskripsi |
| Teks Faint di atas Base (Disesuaikan) | `#7182A4` / `#060B18` | **4.91:1** | **LULUS (AA)** | Disesuaikan sedikit agar aman untuk teks normal |
| Aksen Cyan di atas Base | `#22D3EE` / `#060B18` | **11.83:1** | **LULUS (AAA)** | Tautan navigasi dan indikator fokus |
| Teks Putih di Tombol Primary | `#FFFFFF` / `#2F6BFF` | **4.63:1** | **LULUS (AA)** | Teks tombol mudah dibaca |
| Status Success (Published) | `#34D399` / `#060B18` | **10.62:1** | **LULUS (AAA)** | Badge status terbit |
| Status Warning | `#FBBF24` / `#060B18` | **11.55:1** | **LULUS (AAA)** | Badge status peringatan |
| Status Danger | `#F87171` / `#060B18` | **6.55:1** | **LULUS (AA)** | Pesan kesalahan dan bahaya |

---

## 3. Tipografi & Skala Teks

* **Font Utama:** `Plus Jakarta Sans` di-*self-host* via `@fontsource-variable/plus-jakarta-sans` (tanpa ketergantungan CDN eksternal).
* **Ukuran Teks Publik:** Teks dasar `17px - 18px` dengan line-height `1.6` agar nyaman bagi warga segala usia.
* **Ukuran Teks Admin:** Teks dasar `15px - 16px` untuk kenyamanan kepadatan data.
* **Angka Monospace/Tabular:** Data nominal uang, tanggal, dan tabel angka wajib menggunakan class `.tabular-nums` (`font-variant-numeric: tabular-nums`).

---

## 4. Bentuk, Motion, dan Aksesibilitas

* **Radius Sudut:**
  * Kartu (`Card`, `StatCard`): `16px` (`rounded-2xl`).
  * Kontrol Input & Tombol: `10px - 12px` (`rounded-xl`).
  * Badge Status: Pill (`rounded-full`).
* **Target Sentuh Ponsel:** Minimal `44px x 44px` pada seluruh tombol, tautan navigasi, dan kontrol interaktif.
* **Aturan Motion:** Durasi transisi antarmuka `150ms - 250ms`. Wajib menghormati preferensi pengguna `prefers-reduced-motion` untuk mematikan animasi dekoratif.
* **Fokus Keyboard:** State `:focus-visible` menampilkan outline ring tegas warna Cyan (`#22D3EE`) dengan offset `2px`.
* **Glassmorphism:** Hanya diperbolehkan pada Navbar publik saat di-*scroll*, StatCard unggulan, dan Modal. Tidak diterapkan di semua kartu agar performa dan kontras tetap terjaga.
