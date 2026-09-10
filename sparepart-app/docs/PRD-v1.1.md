# Product Requirements Document (PRD)
## Sistem Manajemen Sparepart

**Versi:** 1.1 (Updated Storage)  
**Tanggal:** September 2026  
**Status:** Draft  

---

## 1. Ringkasan Produk
Sistem Manajemen Sparepart adalah aplikasi web fullstack yang memungkinkan pengelolaan inventaris suku cadang secara terstruktur. Sistem memiliki dua panel akses — Admin dan User — dengan kemampuan input data, manajemen stok, upload gambar, dan rekap laporan bulanan.

---

## 2. Latar Belakang & Tujuan
### Masalah yang Diselesaikan
- Pengelolaan stok sparepart yang selama ini dilakukan manual (spreadsheet/kertas) rawan kesalahan dan sulit dipantau secara real-time.
- Tidak ada visibilitas yang jelas terhadap sparepart yang stoknya menipis atau berlebih.
- Laporan bulanan membutuhkan waktu lama karena harus direkap secara manual.

### Tujuan Produk
- Menyediakan sistem terpusat untuk mencatat, memantau, dan mengelola inventaris sparepart.
- Menghasilkan rekap laporan stok masuk/keluar otomatis setiap bulan.
- Memisahkan hak akses antara Admin (full control) dan User (baca + input terbatas).

---

## 3. Pengguna Target
### Admin
Staf gudang atau manajer yang bertanggung jawab atas keakuratan data sparepart, pengelolaan akun pengguna, dan pengambilan keputusan berdasarkan laporan.

### User (Operator/Teknisi)
Petugas lapangan atau teknisi yang mencatat penggunaan sparepart, melihat ketersediaan stok, dan mengajukan permintaan penambahan stok.

---

## 4. Fitur Utama
### 4.1 Autentikasi & Otorisasi
- Login menggunakan email dan password.
- Session berbasis JWT yang dikelola NextAuth.js.
- Dua role: `ADMIN` dan `USER`.
- Redirect otomatis ke panel yang sesuai berdasarkan role setelah login.
- Halaman unauthorized untuk akses yang tidak diizinkan.

### 4.2 Panel Admin
- **Dashboard:** Ringkasan total sparepart, stok menipis (< threshold), dan grafik perubahan stok bulan ini.
- **Manajemen Sparepart:** CRUD lengkap (tambah, lihat, edit, hapus) data sparepart beserta gambar.
- **Manajemen User:** Tambah, edit, nonaktifkan akun User.
- **Laporan Bulanan:** Export rekap stok masuk/keluar per bulan dalam format tabel, dengan filter bulan dan tahun.
- **Pengaturan Threshold:** Tentukan batas minimum stok per item untuk trigger peringatan.

### 4.3 Panel User
- **Dashboard:** Daftar sparepart yang tersedia dengan fitur pencarian dan filter lokasi.
- **Lihat Detail Sparepart:** Nama, stok saat ini, lokasi, deskripsi, dan gambar.
- **Catat Penggunaan:** Input pengurangan stok (jumlah yang dipakai + keterangan).
- **Riwayat Aktivitas:** Melihat riwayat input yang pernah dilakukan oleh akun sendiri.

### 4.4 Data Sparepart
Setiap item sparepart memiliki field berikut:

| Field | Tipe | Keterangan |
|---|---|---|
| ID | String (auto) | Identifier unik, generate otomatis |
| Nama | String | Nama sparepart |
| Jumlah Stok | Integer | Stok saat ini |
| Lokasi | String | Lokasi penyimpanan (rak/gudang) |
| Deskripsi | Text | Keterangan detail item |
| Gambar | Array URL | 1 sampai 2 foto item |
| Dibuat oleh | Relasi User | User yang menambahkan |
| Tanggal dibuat | Timestamp | Otomatis |
| Tanggal diperbarui | Timestamp | Otomatis update |

### 4.5 Rekap Bulanan
- Sistem mencatat setiap transaksi stok (masuk/keluar) dengan timestamp.
- Admin dapat melihat laporan: total masuk, total keluar, saldo akhir per item per bulan.
- Data rekap diambil dari tabel riwayat transaksi (`StockHistory`).

---

## 5. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| Performa | Halaman pertama (LCP) < 2.5 detik |
| Keamanan | Password di-hash dengan bcrypt, JWT divalidasi di setiap API request |
| Skalabilitas | Arsitektur serverless, scale otomatis di Vercel |
| Ketersediaan | Target uptime 99% (sesuai SLA Vercel Hobby) |
| Aksesibilitas | Mendukung layar mobile dan desktop (responsive) |
| Bahasa | Antarmuka dalam Bahasa Indonesia |

---

## 6. Stack Teknologi

| Layer | Teknologi | Keterangan |
|---|---|---|
| Framework | Next.js 14 (App Router) | Fullstack, SSR + API Routes |
| Bahasa | TypeScript | Type safety |
| Styling | Tailwind CSS + shadcn/ui | Komponen UI siap pakai |
| Auth | NextAuth.js v5 | JWT, Credentials provider |
| ORM | Prisma | Akses database type-safe |
| Database | CockroachDB (free 10 GiB) | Relational, PostgreSQL-compatible |
| Storage | ImgBB API (Free) | Hosting gambar publik instan tanpa kartu debit |
| Hosting | Vercel Hobby (free) | Auto-deploy dari GitHub |

---

## 7. Batasan & Asumsi
- Sistem berjalan di Vercel Hobby tier (non-komersial, batas fungsi serverless 10 detik).
- Storage gambar menggunakan ImgBB API. Gambar tetap direkomendasikan untuk dikompres di sisi client (target < 400 KB per gambar) demi menghemat bandwidth, meskipun ImgBB mendukung ukuran besar.
- API ImgBB v1 tidak menyediakan endpoint direct delete menggunakan API Key. Oleh karena itu, pada operasi hapus data sparepart, gambar lama yang tertinggal (orphaned) akan dibiarkan di server ImgBB atau dapat dikonfigurasi menggunakan parameter `expiration` saat upload.
- Tidak ada fitur real-time (WebSocket); refresh manual atau polling sederhana.
- Rekap bulanan dihasilkan on-demand (bukan scheduled job) pada fase awal.
- CockroachDB free tier memiliki batas connection pool; gunakan Prisma connection pooling.

---

## 8. Metrik Keberhasilan
- User dapat menambah sparepart baru dalam waktu < 1 menit.
- Admin dapat melihat laporan bulanan tanpa perlu keluar dari aplikasi.
- Tidak ada kehilangan data (0% data loss) pada operasi CRUD normal.
- Sistem dapat menangani minimal 50 user aktif bersamaan pada free tier.

---

## 9. Roadmap (Fase)
*(Sama seperti sebelumnya...)*