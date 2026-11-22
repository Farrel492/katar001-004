# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Website Karang Taruna RT 001 RW 004
**Kelurahan Jatibening Baru, Kecamatan Pondok Gede • Kota Bekasi**

**Versi:** 1.0 | **Tanggal:** 22 November 2026  
*Dokumen kerja untuk menyelaraskan kebutuhan produk, ruang lingkup, alur pengguna, dan kriteria penerimaan.*

---

## Informasi Dokumen

| Atribut | Keterangan |
| :--- | :--- |
| **Nama produk** | Website Karang Taruna RT 001 RW 004 |
| **Pemilik kebutuhan** | Pengurus Karang Taruna bersama perwakilan lingkungan RT/RW |
| **Versi dokumen** | 1.0 – rancangan kebutuhan awal |
| **Status** | Draft untuk ditinjau dan disepakati bersama |
| **Tanggal** | 22 November 2026 |
| **Platform** | Website responsif untuk desktop, tablet, dan smartphone |
| **Bahasa utama** | Bahasa Indonesia |

---

## Riwayat dan Status Keputusan

| Topik | Keputusan saat ini | Status |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Disepakati |
| **Database lokal** | MySQL atau MariaDB melalui Laragon; versi/engine perlu dikonfirmasi | Perlu verifikasi |
| **Backend/API** | Laravel REST API direkomendasikan, tetapi belum dikonfirmasi pengguna | Usulan |
| **Visual** | Elegant Futuristic; dark navy sebagai identitas utama; 3D dan motion secara terukur | Arah disepakati |
| **Admin access** | URL login khusus, tanpa tautan login di halaman warga | Disepakati sebagai pola akses; bukan kontrol keamanan tunggal |
| **Akun warga** | Tidak diwajibkan; informasi publik dapat diakses tanpa login | Disepakati |
| **Konfirmasi sebelum kirim aspirasi** | Fitur pemeriksaan/konfirmasi input dipertimbangkan saat implementasi atau iterasi berikutnya | Ditunda / kandidat |

> **Catatan:** PRD ini menggabungkan kebutuhan dari dokumen rancangan awal dan keputusan dalam diskusi. Bagian yang belum diputuskan ditandai sebagai usulan atau perlu verifikasi agar tidak dianggap sebagai keputusan final.

---

## 1. Ringkasan Produk
Website Karang Taruna RT 001 RW 004 merupakan platform informasi dan pengelolaan digital untuk mendukung komunikasi antara pengurus Karang Taruna, pengurus RT/RW, dan warga di lingkungan Kelurahan Jatibening Baru. Website menyediakan informasi organisasi, agenda dan dokumentasi kegiatan, transparansi keuangan, serta kanal saran dan aspirasi warga.

Sistem memiliki dua area utama:
1. **Area Publik:** Dapat diakses warga tanpa membuat akun.
2. **Area Administrasi:** Hanya dapat digunakan admin/pengurus terotorisasi melalui URL khusus dan proses autentikasi. Admin mengelola konten dan menentukan data yang boleh dipublikasikan.

Arah desain adalah **elegant futuristic**: tampilan modern, elegan, konsisten, responsif, dengan identitas *dark navy* dan aksen warna terukur. Dashboard admin menjadi acuan visual utama; bahasa desain yang sama diterapkan pada halaman warga dengan navigasi dan kompleksitas yang lebih sederhana.

---

## 2. Latar Belakang dan Permasalahan
* Informasi kegiatan, struktur organisasi, dan pengumuman berpotensi tersebar di berbagai kanal sehingga warga kesulitan menemukan informasi terbaru.
* Dokumentasi kegiatan perlu dikelola dan disimpan secara terstruktur agar mudah ditelusuri.
* Informasi pemasukan dan pengeluaran perlu disajikan secara lebih transparan, mudah dipahami, dan dapat diperbarui tanpa membuat ulang dokumen secara manual setiap kali ada transaksi.
* Warga membutuhkan kanal untuk menyampaikan saran dan ide tanpa harus membuat akun.
* Pengurus membutuhkan satu area administrasi untuk mengelola data dan mengontrol apa yang ditampilkan kepada publik.
* Pengguna memiliki rentang usia dan tingkat literasi digital yang beragam; karena itu akses informasi publik harus sederhana dan mudah digunakan.

---

## 3. Tujuan Produk
* Menyediakan pusat informasi resmi Karang Taruna RT 001 RW 004.
* Memudahkan warga mengakses visi-misi, struktur organisasi, agenda, dokumentasi, laporan keuangan, dan informasi layanan.
* Meningkatkan transparansi pengelolaan keuangan melalui penyajian data yang terstruktur dan mudah dipahami.
* Menyediakan sarana saran dan aspirasi warga dengan proses moderasi oleh admin.
* Memudahkan admin memperbarui konten melalui dashboard tanpa perlu mengubah kode program.
* Membangun platform yang aman, responsif, dapat dipelihara, dan dapat dikembangkan bertahap.

---

## 4. Indikator Keberhasilan

| Indikator | Target / Kriteria Awal |
| :--- | :--- |
| **Akses informasi** | Halaman publik utama dapat dibuka tanpa login pada desktop dan smartphone. |
| **Pengelolaan konten** | Admin dapat menambah, melihat, mengubah, mengarsipkan/menghapus sesuai hak akses, dan memublikasikan konten. |
| **Kontrol publikasi** | Konten draft tidak tampil di area publik; hanya konten berstatus *Published* yang dapat diakses warga. |
| **Keuangan** | Saldo dan ringkasan dihitung dari transaksi tersimpan; hasil perhitungan lolos skenario uji. |
| **Aspirasi** | Kiriman warga masuk ke antrean moderasi admin dan tidak langsung tampil secara publik. |
| **Keamanan** | Endpoint admin terlindungi autentikasi dan otorisasi; percobaan akses tanpa izin ditolak. |
| **Responsif** | Fungsi utama dapat digunakan pada ukuran layar ponsel, tablet, dan desktop. |
| **Kinerja** | Halaman informasional tetap dapat digunakan dengan animasi 3D dimatikan atau tidak didukung perangkat. |

> *Target kuantitatif seperti waktu muat, jumlah pengguna bersamaan, kapasitas file, dan SLA belum ditetapkan. Nilainya perlu ditentukan setelah hosting dan skala penggunaan dipastikan.*

---

## 5. Pengguna dan Hak Akses

| Peran | Kebutuhan | Hak Akses |
| :--- | :--- | :--- |
| **Warga / pengunjung** | Mencari informasi, melihat kegiatan, laporan publik, dan mengirim aspirasi. | Akses baca ke konten *Published*; mengirim aspirasi melalui formulir publik; tidak memiliki akun wajib. |
| **Admin** | Mengelola seluruh konten dan data yang menjadi tanggung jawabnya. | Login ke area admin; CRUD sesuai modul; mengelola status publikasi; moderasi aspirasi; mengelola transaksi dan laporan. |
| **Pengurus / penanggung jawab data** | Memastikan konten dan angka yang dipublikasikan benar. | Dalam versi awal dapat menjalankan proses persetujuan di luar sistem atau melalui admin yang ditunjuk. Role terpisah belum ditetapkan. |

> *Keputusan awal menggunakan satu jenis role admin. Jika nantinya diperlukan pemisahan kewenangan (misalnya admin keuangan, editor konten, dan superadmin), hal tersebut menjadi pengembangan lanjutan dan perlu aturan persetujuan yang jelas.*

---

## 6. Ruang Lingkup Produk

### 6.1 Termasuk dalam ruang lingkup
* Website publik dan dashboard admin.
* Profil, visi-misi, nilai, struktur organisasi, dan kontak resmi.
* Agenda kegiatan mendatang serta arsip dokumentasi kegiatan.
* Manajemen foto dan konten kegiatan.
* Transparansi kas RT dan kas Karang Taruna secara terpisah.
* Pencatatan transaksi, ringkasan saldo, dan ekspor laporan.
* Formulir aspirasi warga dan moderasi admin.
* Kontrol status *Draft*, *Preview*, dan *Published*.
* URL login admin khusus tanpa tombol login pada navigasi warga.
* Desain responsif, sistem desain konsisten, serta animasi/elemen 3D yang dioptimalkan.

### 6.2 Di luar ruang lingkup versi awal
* Akun/login untuk warga.
* Aplikasi mobile native Android/iOS.
* Pembayaran iuran atau transaksi keuangan online.
* Integrasi otomatis dengan WhatsApp, Instagram, atau layanan pemerintah.
* Sistem multi-RT/multi-RW atau multi-kelurahan.
* Persetujuan berjenjang dengan banyak role, kecuali ditetapkan pada iterasi berikutnya.
* Fitur pemeriksaan dan konfirmasi isi aspirasi sebelum dikirim: dicatat sebagai kandidat pengembangan, belum menjadi kewajiban versi awal.

---

## 7. Kebutuhan Fungsional

### 7.1 Halaman Publik dan Navigasi
* Website menyediakan navigasi yang jelas menuju Beranda, Profil, Struktur Organisasi, Agenda/Kegiatan, Dokumentasi, Transparansi Keuangan, Aspirasi Warga, dan Kontak.
* Konten publik hanya mengambil data dengan status *Published*.
* Halaman publik tidak menampilkan tombol atau tautan menuju halaman login admin.
* Tampilan harus dapat digunakan tanpa akun dan tidak mengharuskan warga memahami istilah teknis.
* Halaman memiliki keadaan *loading*, kosong, dan *error* yang informatif.

### 7.2 Profil, Visi-Misi, dan Struktur Organisasi
* Admin dapat membuat, melihat, mengubah, mengurutkan, mengaktifkan/menonaktifkan, dan menghapus data profil/organisasi sesuai aturan.
* Data organisasi dapat mencakup nama, jabatan, divisi, foto, deskripsi singkat, dan urutan tampilan.
* Admin dapat menambah divisi atau anggota baru tanpa mengubah kode program.
* Urutan tampilan dapat diatur agar pembina/ketua dan posisi penting berada pada urutan yang sesuai.
* Halaman publik menampilkan pengantar, visi, misi, nilai utama, struktur, serta kontak resmi seperti WhatsApp dan Instagram jika disediakan.

### 7.3 Agenda dan Dokumentasi Kegiatan
* Admin dapat membuat, mengubah, menghapus/mengarsipkan, dan memublikasikan informasi kegiatan.
* Agenda mendatang dan arsip kegiatan yang sudah terlaksana ditampilkan dalam bagian terpisah.
* Informasi agenda minimal mencakup judul, tanggal/waktu, lokasi, deskripsi, dan status publikasi.
* Arsip kegiatan dapat memuat judul, tanggal, ringkasan, foto, dan keterangan foto.
* Admin dapat mengunggah beberapa foto dalam satu kegiatan, mengatur urutan, serta menghapus atau mengganti foto.
* Sistem sebaiknya mengoptimalkan ukuran gambar saat unggah (resize/kompresi) dan membatasi tipe serta ukuran file.
* Admin dapat melihat pratinjau sebelum publikasi.

### 7.4 Transparansi Keuangan
* Sistem menyediakan buku kas terpisah untuk **Kas RT 001** dan **Kas Karang Taruna**.
* Admin dapat mencatat transaksi pemasukan dan pengeluaran melalui formulir.
* Data transaksi minimal mencakup tanggal, kategori, keterangan, jenis transaksi, nominal, sumber/kas, dan bukti pendukung opsional.
* Sistem menghitung total pemasukan, total pengeluaran, saldo awal, dan saldo akhir berdasarkan transaksi yang tersimpan.
* Admin dapat memfilter transaksi berdasarkan kas, bulan, tahun, kategori, dan jenis transaksi.
* Admin dapat mengubah atau membatalkan transaksi dengan jejak perubahan/audit yang memadai; penghapusan permanen dibatasi.
* Admin dapat mengunggah file Excel sebagai sumber data awal jika formatnya telah disepakati. Sistem harus memvalidasi kolom, tipe data, tanggal, dan nominal sebelum impor.
* Setelah impor, data transaksi disimpan di database sebagai sumber data utama (*single source of truth*).
* Transaksi yang ditambahkan melalui website harus tercermin pada tampilan tabel dan file ekspor terbaru.
* Admin dapat mengunduh laporan Excel dan PDF berdasarkan periode/kas yang dipilih.
* Warga hanya dapat melihat laporan yang sudah dipublikasikan; file atau data draft tidak boleh dapat diakses melalui URL langsung.
* Sistem menampilkan ringkasan visual yang mudah dipahami, termasuk saldo awal, total pemasukan, total pengeluaran, dan saldo akhir.
* **Aturan saldo:** `saldo akhir = saldo awal + total pemasukan - total pengeluaran`. Periode, perlakuan saldo awal, transaksi koreksi, dan pembukaan saldo harus ditentukan bersama penanggung jawab keuangan sebelum implementasi final.

### 7.5 Saran dan Aspirasi Warga
* Warga dapat mengirim saran/ide tanpa membuat akun.
* Formulir minimal menyediakan isi saran; nama dan kontak sebaiknya opsional kecuali pengurus memiliki alasan operasional yang disepakati.
* Saran yang dikirim tidak langsung ditampilkan pada halaman publik, melainkan masuk ke antrean admin.
* Admin dapat membaca, menandai, mengedit seperlunya untuk koreksi penulisan tanpa mengubah maksud, menyetujui, menolak, mengarsipkan, dan menghapus spam sesuai kebijakan.
* Saran yang disetujui untuk ditampilkan dapat diberi status seperti *Diterima*, *Sedang Dibahas*, atau *Terlaksana*.
* Admin dapat menambahkan tanggapan singkat pengurus pada aspirasi yang dipublikasikan.
* Sistem perlu perlindungan spam seperti *rate limiting*, validasi server, *honeypot* atau CAPTCHA jika diperlukan.
* Informasi pribadi dan isi aspirasi yang sensitif tidak boleh dipublikasikan tanpa dasar dan persetujuan yang sesuai.
* Fitur pemeriksaan/konfirmasi ulang isi sebelum pengiriman dicatat sebagai kandidat pengembangan berikutnya, bukan syarat rilis pertama.

### 7.6 Informasi Layanan Warga
* Halaman/seksi layanan warga dapat menampilkan informasi persyaratan dan alur pengurusan surat pengantar RT/RW.
* Konten layanan bersifat informasional dan dikelola admin.
* Informasi harus mencantumkan tanggal pembaruan atau sumber/penanggung jawab agar warga dapat memeriksa keakuratannya.
* Website tidak menggantikan keputusan atau layanan resmi RT/RW/kelurahan.

### 7.7 Direktori UMKM Warga (Opsional)
* Sistem dapat menyediakan daftar usaha warga jika ada persetujuan pemilik usaha.
* Informasi dapat mencakup nama usaha, kategori, deskripsi/produk, foto, dan kontak yang memang disetujui untuk dipublikasikan.
* Admin memoderasi dan mengelola status publikasi.
* Fitur ini dapat ditunda jika belum ada data atau persetujuan warga yang memadai.

### 7.8 Dashboard Admin
* Dashboard hanya dapat diakses setelah admin berhasil login.
* Dashboard menampilkan ringkasan aktivitas yang relevan, misalnya jumlah konten, agenda, aspirasi menunggu moderasi, dan ringkasan data keuangan sesuai hak akses.
* Admin dapat berpindah antar modul melalui navigasi sidebar.
* Dashboard menyediakan indikator status *Draft*, *Preview*, dan *Published*.
* Admin dapat melakukan logout dan sistem mengakhiri sesi secara aman.
* Dashboard harus menampilkan pesan validasi dan konfirmasi untuk tindakan penting, terutama publikasi, perubahan transaksi, dan penghapusan.

---

## 8. Alur Publikasi Konten

| Status | Deskripsi | Akses |
| :--- | :--- | :--- |
| **Draft** | Konten sedang disiapkan atau belum siap diperiksa. | Admin saja. |
| **Preview** | Konten dapat diperiksa dalam tampilan yang menyerupai halaman publik sebelum tayang. | Admin saja; tautan pratinjau harus terlindungi. |
| **Published** | Konten telah disetujui dan ditampilkan kepada warga. | Publik dapat mengakses. |

> *Perubahan konten yang sudah Published sebaiknya dapat disimpan sebagai draft/perubahan tertunda agar admin dapat mengedit tanpa menampilkan perubahan yang belum diperiksa. Ketentuan ini perlu diuji pada implementasi.*

---

## 9. Kebutuhan Keamanan dan Privasi
* URL admin khusus, misalnya `/loginadminkatar`, digunakan untuk memisahkan akses administrasi dari navigasi publik. URL tersebut bukan pengganti autentikasi atau kontrol keamanan. Endpoint dan halaman admin tetap harus dilindungi.
* Tidak menampilkan tautan login admin pada halaman publik atau sitemap publik.
* Menerapkan autentikasi admin dengan password yang di-hash menggunakan algoritma aman melalui framework.
* Menerapkan otorisasi pada sisi backend untuk setiap endpoint admin; menyembunyikan tombol di frontend tidak cukup.
* Menerapkan pembatasan percobaan login (*rate limiting*), validasi input, dan respons error yang tidak membocorkan apakah akun tertentu terdaftar.
* Menggunakan session/cookie yang aman atau mekanisme token yang dipilih setelah arsitektur backend dipastikan; melindungi CSRF bila menggunakan cookie session.
* Menggunakan HTTPS pada lingkungan produksi.
* Mengatur masa berlaku sesi, logout, dan invalidasi sesi setelah perubahan kredensial.
* Menerapkan perlindungan upload: validasi ekstensi dan MIME, batas ukuran, nama file acak, penyimpanan aman, dan larangan eksekusi file unggahan.
* Mencegah SQL injection, XSS, CSRF, IDOR, dan akses langsung terhadap data yang belum dipublikasikan.
* Menyimpan rahasia konfigurasi di *environment variables* dan tidak memasukkannya ke repository.
* Mencatat aktivitas penting admin seperti login, publikasi, perubahan transaksi, dan penghapusan.
* Membuat backup database dan file unggahan secara berkala serta menguji proses pemulihannya.
* Meminimalkan pengumpulan data pribadi warga; tetapkan tujuan, akses, masa simpan, dan prosedur penghapusan data.

> **Catatan risiko:** URL yang tidak ditautkan tetap dapat ditemukan melalui pemindaian atau kebocoran. Keamanan harus bertumpu pada autentikasi, otorisasi, validasi backend, konfigurasi server, dan pemantauan.

---

## 10. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
| :--- | :--- |
| **Usability** | Bahasa sederhana, navigasi jelas, tombol dan formulir mudah dipahami, kontras teks memadai. |
| **Responsive design** | Layout menyesuaikan ponsel, tablet, dan desktop; tabel memiliki strategi tampilan mobile. |
| **Accessibility** | Dapat dinavigasi dengan keyboard; label form jelas; gambar informatif memiliki teks alternatif; animasi tidak menghalangi penggunaan. |
| **Performance** | Optimasi gambar, *lazy loading*, *code splitting*, dan pembatasan efek 3D; konten inti tetap berfungsi tanpa WebGL. |
| **Reliability** | Validasi sisi klien dan server; penanganan error; backup dan prosedur restore. |
| **Security** | HTTPS produksi, autentikasi, otorisasi, perlindungan input, upload aman, dan pencatatan aktivitas. |
| **Maintainability** | Komponen reusable, pemisahan frontend/backend, penamaan konsisten, dokumentasi konfigurasi, dan pengelolaan versi. |
| **Compatibility** | Mendukung browser modern yang umum digunakan pada Android, iOS, Windows, dan macOS. |
| **SEO & discoverability** | Metadata halaman publik, judul yang jelas, struktur heading, dan sitemap untuk konten publik yang relevan. |

---

## 11. UX, UI, dan Motion Design

### 11.1 Arah visual
* **Gaya utama:** Elegant Futuristic, modern community digital platform.
* **Palet dasar:** *Dark navy* / *midnight blue* dengan aksen *electric blue*/*cyan* atau *soft violet* secara hemat.
* **Typography:** *Sans-serif* modern, ukuran dan hierarki yang mudah dibaca.
* **Komponen:** Cards, buttons, form fields, tables, badges, modal, sidebar, dan navbar menggunakan *design tokens* yang konsisten.
* Dashboard admin menjadi referensi visual utama; halaman publik menggunakan sistem desain yang sama dengan penyederhanaan navigasi dan konten.
* *Glass effect*, gradient, mesh, dan efek dekoratif digunakan secukupnya agar keterbacaan tetap menjadi prioritas.

### 11.2 Teknologi visual yang direncanakan

| Teknologi / Pendekatan | Peran |
| :--- | :--- |
| **Three.js** | Elemen 3D, visual abstrak, *particle*, atau ilustrasi jaringan pada bagian yang memang memberi nilai. |
| **GSAP** | Timeline, *scroll-triggered animation*, parallax, dan transisi kompleks. |
| **CSS / Motion** | Micro-interaction, hover, feedback tombol, transisi komponen, dan animasi UI. |
| **Design system / Design DNA** | Konsistensi warna, typography, spacing, radius, elevation, dan pola komponen. |

> *Three.js dan animasi berat tidak boleh menjadi ketergantungan untuk membaca informasi, mengirim formulir, atau mengelola data. Sediakan fallback, hormati preferensi reduced motion, dan uji performa pada perangkat kelas menengah/rendah.*  
> *Istilah 'Genjutsu' pada diskusi diperlakukan sebagai referensi/workflow visual refinement, bukan dependensi teknis inti. Penggunaan produk atau tool spesifik dengan nama tersebut perlu diklarifikasi sebelum ditetapkan ke stack.*

---

## 12. Arsitektur dan Teknologi

| Lapisan | Pilihan saat ini | Catatan |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Disepakati. Satu aplikasi dengan area publik dan admin yang terpisah melalui routing/layout. |
| **Backend** | Laravel REST API (usulan) | Belum dikonfirmasi; dipilih sebagai rekomendasi untuk autentikasi, validasi, API, dan pengelolaan data. |
| **Database** | MySQL atau MariaDB | Laragon digunakan sebagai lingkungan lokal; pastikan engine dan versinya. |
| **Local environment** | Laragon | Menjalankan layanan PHP dan database di mesin pengembangan. |
| **3D** | Three.js | Digunakan selektif dan dioptimalkan. |
| **Animation** | GSAP + CSS/Motion | Gunakan sesuai kebutuhan; hindari animasi redundan. |
| **Version control** | Git | Repository, branching, dan pencatatan perubahan. |
| **Deployment** | Belum ditentukan | Perlu memilih hosting yang mendukung backend PHP, database, HTTPS, storage, dan backup. |

### 12.1 Gambaran arsitektur
`Browser warga/admin → React + Vite → Laravel REST API → MySQL/MariaDB`.  
Frontend tidak mengakses database secara langsung. Seluruh validasi, autentikasi, otorisasi, dan aturan bisnis penting dilakukan di backend.

### 12.2 Struktur area aplikasi
* **Area publik:** Beranda, profil, struktur, agenda, dokumentasi, keuangan publik, aspirasi, layanan warga, dan UMKM (jika diaktifkan).
* **Area admin:** Login URL khusus, dashboard, manajemen profil/struktur, agenda/dokumentasi, keuangan, moderasi aspirasi, dan pengaturan.
* **API:** Endpoint publik hanya mengembalikan data yang boleh dipublikasikan; endpoint admin memerlukan autentikasi dan otorisasi.

---

## 13. Data Utama dan Entitas Konseptual

| Entitas | Atribut konseptual |
| :--- | :--- |
| **Admin** | ID, nama, username/email, password hash, status akun, waktu login terakhir. |
| **OrganizationProfile** | Judul/pengantar, visi, misi, nilai, kontak resmi. |
| **OrganizationMember** | Nama, jabatan, divisi, foto, deskripsi, urutan, status. |
| **Event** | Judul, deskripsi, tanggal/waktu, lokasi, kategori/status agenda, status publikasi. |
| **EventMedia** | Relasi kegiatan, path file, caption, urutan, metadata ukuran. |
| **CashBook** | Nama buku kas: RT 001 atau Karang Taruna. |
| **Transaction** | Tanggal, tipe, kategori, keterangan, nominal, buku kas, bukti, pembuat, waktu perubahan. |
| **FinancialPeriod/OpeningBalance** | Periode, buku kas, saldo awal, status publikasi. |
| **Suggestion** | Isi, nama/kontak opsional, waktu kirim, status moderasi, tanggapan publik, catatan admin. |
| **ServiceInfo** | Judul layanan, persyaratan, alur, kontak/sumber, tanggal pembaruan, status publikasi. |
| **BusinessDirectory** | Nama usaha, kategori, deskripsi, produk, kontak yang disetujui, media, status publikasi. |
| **AuditLog** | Admin, aksi, objek, waktu, dan metadata relevan tanpa menyimpan rahasia. |

> *Entitas ini merupakan rancangan konseptual, bukan skema database final. Relasi, tipe data, indeks, aturan penghapusan, dan migrasi akan dirancang saat implementasi.*

---

## 14. Aturan Bisnis Penting
* Hanya konten *Published* yang tersedia di endpoint publik.
* Konten *Draft* dan *Preview* hanya dapat dilihat admin yang berwenang.
* Saran warga selalu masuk ke status menunggu moderasi; tidak otomatis menjadi konten publik.
* Kas RT dan kas Karang Taruna tidak boleh tercampur dalam perhitungan atau ekspor.
* Nominal transaksi harus tervalidasi sebagai angka positif; jenis transaksi menentukan penambahan atau pengurangan saldo.
* Impor Excel harus melalui validasi dan pratinjau hasil impor sebelum data disimpan.
* Ekspor laporan dibuat dari data database terkini, bukan dari file lama yang diunggah.
* Perubahan transaksi dan publikasi harus dapat ditelusuri melalui audit log.
* Informasi kontak, foto, aspirasi, dan data usaha warga hanya dipublikasikan dengan dasar/izin yang sesuai.

---

## 15. Kriteria Penerimaan per Modul

| Modul | Kriteria penerimaan minimum |
| :--- | :--- |
| **Publik** | Pengunjung dapat membuka halaman tanpa login; navigasi bekerja; konten draft tidak terlihat. |
| **Profil & struktur** | Admin dapat menambah dan mengubah anggota/divisi; urutan tampilan tersimpan dan tercermin di halaman publik setelah dipublikasikan. |
| **Agenda & galeri** | Admin dapat membuat agenda dan arsip, mengunggah foto valid, melihat preview, dan memublikasikan; warga hanya melihat konten terbit. |
| **Keuangan** | Transaksi dapat ditambah/diubah; filter bekerja; saldo sesuai rumus; kas terpisah; ekspor sesuai filter dan data terbaru. |
| **Aspirasi** | Form publik menerima input valid; input invalid ditolak; kiriman masuk antrean moderasi; tidak tampil sebelum disetujui. |
| **Admin security** | Akses endpoint admin tanpa sesi yang sah ditolak; role/hak akses diperiksa backend; rate limit login aktif; logout mengakhiri sesi. |
| **Responsif & motion** | Konten dan fungsi utama tetap dapat digunakan pada ponsel; reduced motion/fallback tersedia; tidak ada animasi yang menutupi kontrol penting. |

---

## 16. Skenario Pengujian
1. Pengunjung membuka URL halaman publik dan memastikan tidak diminta login.
2. Pengunjung mencoba membuka URL login admin; halaman login hanya menampilkan form autentikasi dan tidak membuka dashboard tanpa kredensial sah.
3. Pengguna tanpa autentikasi mencoba memanggil endpoint admin secara langsung; server mengembalikan penolakan.
4. Admin membuat konten *Draft*; pastikan tidak muncul di halaman publik maupun endpoint publik.
5. Admin mengubah status menjadi *Preview*; pastikan hanya admin yang dapat melihat pratinjau.
6. Admin memublikasikan konten; pastikan konten muncul di halaman publik.
7. Admin mengimpor file keuangan dengan format benar dan salah; sistem menerima yang valid dan memberi pesan jelas untuk yang tidak valid.
8. Admin menambahkan transaksi setelah impor; saldo dan hasil ekspor harus ikut berubah.
9. Admin memilih Kas RT dan Kas Karang Taruna secara bergantian; angka tidak boleh tercampur.
10. Warga mengirim aspirasi; data masuk antrean moderasi dan belum terlihat publik.
11. Admin menyetujui aspirasi; status/tanggapan tampil sesuai pengaturan publikasi.
12. Pengguna mencoba mengunggah file dengan tipe atau ukuran tidak diizinkan; sistem menolak.
13. Pengguna membuka website pada smartphone dan perangkat tanpa dukungan WebGL; fungsi utama tetap tersedia.

---

## 17. Prioritas dan Tahapan Rilis

| Tahap | Fokus | Prioritas |
| :--- | :--- | :--- |
| **MVP 1 – Fondasi** | Setup proyek, design system, layout publik/admin, routing, autentikasi dasar, profil dan struktur. | P0 |
| **MVP 2 – Konten** | Agenda, dokumentasi, upload media, status Draft/Preview/Published. | P0 |
| **MVP 3 – Keuangan** | Buku kas terpisah, transaksi, saldo, filter, impor dan ekspor laporan. | P0 |
| **MVP 4 – Aspirasi** | Form publik, validasi, moderasi, status dan tanggapan. | P0 |
| **Rilis lanjutan** | Informasi layanan warga, direktori UMKM, audit/analitik lanjutan, 2FA, role terpisah. | P1/P2 |
| **Penyempurnaan UX** | Animasi lebih lanjut, visual 3D tambahan, konfirmasi ulang aspirasi, optimasi aksesibilitas. | P1/P2 |

> *P0 = dibutuhkan untuk rilis inti; P1 = penting untuk peningkatan setelah alur utama stabil; P2 = tambahan yang dapat dijadwalkan kemudian. Urutan akhir dapat berubah berdasarkan validasi pengurus dan hasil uji prototype.*

---

## 18. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| **URL admin dianggap cukup aman** | Akses tidak sah tetap mungkin terjadi. | Terapkan autentikasi, otorisasi backend, rate limit, HTTPS, dan monitoring. |
| **Kesalahan pencatatan keuangan** | Laporan tidak akurat dan kepercayaan warga menurun. | Validasi, preview impor, audit log, rekonsiliasi, dan persetujuan penanggung jawab. |
| **File upload berbahaya/besar** | Risiko keamanan dan website lambat. | Validasi MIME/ekstensi, batas ukuran, kompresi, penyimpanan aman. |
| **Animasi 3D terlalu berat** | Website lambat pada smartphone. | Lazy load, fallback, reduced motion, dan pengujian perangkat nyata. |
| **Aspirasi berisi data sensitif/spam** | Privasi warga terganggu dan moderasi terbebani. | Moderasi, minimisasi data, rate limit, kebijakan publikasi. |
| **Ketergantungan pada satu admin** | Operasional terganggu saat admin tidak tersedia. | Dokumentasi operasional, prosedur pemulihan akun, dan rencana admin cadangan. |
| **Data layanan/UMKM tidak diperbarui** | Warga menerima informasi usang. | Tampilkan tanggal pembaruan dan tunjuk penanggung jawab konten. |

---

## 19. Asumsi, Ketergantungan, dan Hal yang Perlu Diputuskan
* Pengurus menyediakan data resmi visi-misi, struktur organisasi, kontak, dan materi publikasi.
* Penanggung jawab keuangan menyepakati format transaksi, saldo awal, kategori, periode laporan, serta format impor Excel.
* Pengurus menentukan siapa yang boleh menjadi admin dan prosedur pergantian/pemulihan akun.
* Tim mengonfirmasi apakah Laragon menjalankan MySQL atau MariaDB dan versi PHP yang tersedia.
* Laravel REST API masih berupa rekomendasi dan perlu persetujuan sebelum setup backend.
* Hosting, domain, email pengirim, backup off-site, dan kebijakan privasi perlu ditentukan sebelum rilis publik.
* Perlu disepakati apakah aspirasi dipublikasikan secara anonim, apakah nama/kontak opsional, dan berapa lama data disimpan.
* Perlu disepakati siapa yang menyetujui publikasi laporan keuangan dan bagaimana koreksi laporan dilakukan.
* Direktori UMKM dan informasi layanan warga bergantung pada ketersediaan data dan persetujuan pihak terkait.

---

## 20. Definisi Selesai (Definition of Done)
* Fitur memenuhi kebutuhan dan kriteria penerimaan yang telah disepakati.
* Validasi dilakukan pada frontend dan backend untuk data yang relevan.
* Hak akses diuji, termasuk percobaan akses langsung ke endpoint.
* Tampilan diuji pada desktop dan smartphone.
* Keadaan loading, kosong, sukses, dan error ditangani.
* Tidak ada data sensitif atau kredensial yang tertanam di kode frontend/repository.
* Perubahan database memiliki migration atau dokumentasi skema.
* Fitur memiliki dokumentasi penggunaan admin jika diperlukan.
* Fitur telah diuji oleh minimal satu perwakilan pengurus dan satu pengguna non-teknis untuk alur publik yang relevan.

---

## 21. Glosarium

| Istilah | Arti |
| :--- | :--- |
| **PRD** | Product Requirements Document; dokumen kebutuhan dan batasan produk. |
| **MVP** | Minimum Viable Product; versi awal dengan fungsi inti yang dapat diuji. |
| **CRUD** | Create, Read, Update, Delete. |
| **Draft** | Konten yang belum dipublikasikan. |
| **Preview** | Pratinjau konten sebelum dipublikasikan. |
| **Published** | Konten yang sudah tayang untuk publik. |
| **API** | Antarmuka komunikasi antara frontend dan backend. |
| **Single Source of Truth** | Satu sumber data utama; dalam sistem ini database menjadi sumber data transaksi. |
| **Rate limiting** | Pembatasan jumlah permintaan dalam periode tertentu. |
| **Audit log** | Catatan aktivitas penting yang dilakukan pengguna/admin. |
| **Responsive** | Tampilan yang menyesuaikan ukuran layar/perangkat. |

---

## 22. Persetujuan dan Langkah Berikutnya
PRD ini menjadi baseline diskusi dan pengembangan setelah ditinjau oleh tim Karang Taruna dan penanggung jawab RT/RW. Perubahan kebutuhan dicatat sebagai revisi dokumen atau backlog agar keputusan tetap terlacak.

| Pihak | Nama | Tanggal | Persetujuan |
| :--- | :--- | :--- | :--- |
| **Perwakilan Karang Taruna** | | | |
| **Penanggung jawab RT/RW** | | | |
| **Tim pengembang** | | | |

> **Langkah berikutnya yang disarankan:** Validasi PRD bersama pengurus, konfirmasi keputusan teknologi backend dan database, kumpulkan data awal, lalu mulai setup React + Vite dan design system sebelum implementasi modul.
