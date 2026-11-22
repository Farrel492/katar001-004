# Konsep & Penyempurnaan Ide Website Karang Taruna
**RT 001 RW 004, Kelurahan Jatibening Baru, Kecamatan Pondok Gede, Kota Bekasi**

---

## 1. Latar Belakang & Tujuan Utama
Dalam kemajuan Karang Taruna di era digital saat ini, pembuatan website bertujuan menghadirkan transparansi bagi warga antara pengurus **Karang Taruna, RT, dan RW**.

### Manfaat Utama Website
1. **Visi Misi & Struktur Karang Taruna:** Memperkenalkan arah gerak organisasi dan susunan pengurus kepada warga.
2. **Dokumentasi Acara Setiap Event:** Arsip foto dan informasi kegiatan lingkungan.
3. **Transparansi Keuangan RT:** Laporan pengeluaran dan pemasukan tiap bulan serta informasi terbaru.
4. **Saran dan Ide dari Warga:** Kanal aspirasi langsung dari masyarakat.

### Konsep Akses Pengguna
* **Tanpa Login untuk Warga:** Mengingat warga memiliki rentang usia beragam (termasuk lansia atau yang kurang familier dengan teknologi), halaman publik dibuka tanpa perlu membuat akun/login.
* **1 Role Admin Tunggal:** Seluruh pengelolaan data dan pengaturan visibilitas konten (menyembunyikan/menampilkan data ke halaman warga) dikendalikan terpusat melalui panel admin.

---

## 2. Rincian Fungsi Role Admin & Halaman

### A. Visi Misi & Struktur Karang Taruna
* **Halaman Publik:** Menampilkan teks pengantar halaman (*hero/intro*), visi misi dan nilai utama Karang Taruna, susunan struktur organisasi, serta kontak resmi (WhatsApp dan Instagram Karang Taruna) di bagian bawah.
* **Fungsi Admin:** Mengelola seluruh struktur organisasi (tambah, edit, hapus anggota/pengurus), mengunggah foto profil pengurus, serta menambahkan divisi atau anggota baru secara dinamis.

### B. Dokumentasi Acara Setiap Event
* **Halaman Publik:** Menampilkan dokumentasi setiap event dan foto-foto kegiatan Karang Taruna yang sudah disetujui untuk tayang.
* **Fungsi Admin:** Mengunggah kumpulan foto kegiatan, menambahkan teks/keterangan acara, mengelola jadwal acara bulanan, serta mengatur fitur **sembunyikan dan tampilkan** ke halaman warga.

### C. Transparansi Keuangan RT & Karang Taruna
* **Halaman Publik:** Memiliki halaman khusus terpisah agar rapi dan tidak bercampur dengan informasi lain. Warga dapat melihat laporan keuangan secara transparan beserta file unduhan (PDF/Excel).
* **Fungsi Admin:**
  * Mengunggah file laporan keuangan Excel awal yang otomatis tampil dalam bentuk tabel di website.
  * Menambahkan transaksi terbaru langsung melalui website tanpa harus mengunggah ulang file dari awal (menghindari risiko file lama hilang).
  * Mengunduh ulang/mengekspor file Excel maupun PDF terbaru yang sudah diperbarui.
  * Mengaktifkan status publikasi setelah data siap dilihat warga.

### D. Saran dan Ide Warga
* **Halaman Publik:** Warga dapat mengirimkan saran dan ide secara langsung.
* **Fungsi Admin:** Semua masukan warga tidak langsung muncul di halaman publik, melainkan masuk ke kotak moderasi admin terlebih dahulu. Tujuannya untuk menyaring masukan inti dan mencegah kesalahan input warga (seperti salah ketik atau tidak sengaja terpencet).

---

## 3. Bedah & Penyempurnaan Ide (Pondasi Pengembangan)

### 1. Penyempurnaan Alur Kerja Admin (Konsep *Staging / Preview*)
Untuk mencegah kesalahan klik (*human error*) saat menyiapkan data, fitur "Sembunyikan & Tampilkan" dikembangkan menjadi **3 Status Konten**:
* **Draft (Sembunyi):** Sedang disusun oleh admin, hanya bisa dilihat di panel admin.
* **Preview (Pratinjau):** Admin dapat melihat tampilan persis seperti yang akan dilihat warga sebelum benar-benar dipublikasikan (krusial untuk mengecek tabel keuangan).
* **Published (Tampil di Warga):** Resmi tayang di halaman publik.

### 2. Penyempurnaan Fitur per Halaman

#### A. Visi, Misi & Struktur Organisasi (Dinamis)
* **Atur Urutan (*Display Order*):** Menambahkan pengaturan urutan tampil di panel admin agar posisi **Pembina (RW & RT)** serta **Ketua** selalu berada di posisi paling atas meskipun ada penambahan anggota baru di kemudian hari.

#### B. Dokumentasi Acara & Agenda Mendatang
* **Dua Kategori Waktu:** Memisahkan tampilan kegiatan menjadi **Agenda / Info Terbaru** (acara yang akan datang lengkap dengan tanggal dan lokasi) dan **Arsip Dokumentasi** (acara yang sudah terlaksana beserta galeri foto dan ringkasan).
* **Optimasi Foto Otomatis:** Sistem melakukan kompresi gambar otomatis saat admin mengunggah foto berukuran besar dari kamera HP agar halaman tetap ringan diakses warga.

#### C. Transparansi Keuangan RT & Karang Taruna
* **Satu Sumber Data (*Single Source of Truth*):** Data dari unggahan Excel awal disimpan ke database web. Saat admin menambah transaksi di tengah bulan lewat form website, file Excel dan PDF yang diunduh warga otomatis ikut ter-update.
* **Ringkasan Visual di Atas Tabel:** Menampilkan kartu angka besar di bagian atas halaman (**Saldo Awal**, **Total Pemasukan Bulan Ini**, **Total Pengeluaran Bulan Ini**, dan **Saldo Akhir**) agar mudah dibaca oleh warga lanjut usia.
* **Pemisahan Buku Kas:** Menyediakan tab/filter pemisah antara **Kas RT 001** dan **Kas Karang Taruna** agar pencatatan tidak tercampur.

#### D. Saran & Ide Warga (Moderasi & Status Tindak Lanjut)
* **Anti-Spam Sederhana:** Perlindungan ringan seperti CAPTCHA sederhana atau pembatasan pengiriman (*rate limiting*, misalnya maksimal 3 saran per jam per perangkat).
* **Label Status & Balasan Pengurus:** Menyediakan label status pada aspirasi yang disetujui tayang (**Diterima**, **Sedang Dibahas RT/Karang Taruna**, atau **Terlaksana**) beserta kolom tanggapan singkat dari pengurus.

---

## 4. Ide Tambahan untuk Percontohan Tingkat Kelurahan
Untuk menjadikan website ini sebagai *pilot project* unggulan RT 001 RW 004 di tingkat Kelurahan Jatibening Baru maupun Kecamatan Pondok Gede, terdapat dua fitur pelengkap ringan yang dapat ditambahkan:
1. **Info Layanan Warga RT 001 (Statis):** Daftar persyaratan berkas dan alur pengurusan Surat Pengantar RT/RW (untuk KTP, KK, SKCK, domisili) agar warga tidak perlu bolak-balik bertanya ke pengurus.
2. **Direktori UMKM Warga RT 001:** Halaman promosi usaha warga setempat (Nama Usaha, Produk, Nomor WhatsApp) untuk mendorong perputaran ekonomi lokal dan meningkatkan frekuensi kunjungan warga ke website.
