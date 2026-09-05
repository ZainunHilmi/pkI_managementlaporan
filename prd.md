**1\. Tujuan Proyek** Membangun aplikasi web manajemen *sparepart* mesin yang aman, interaktif, dan dapat diakses dari mana saja tanpa membebani klien dengan biaya pemeliharaan *server* (infrastruktur *Zero-Cost*). Sistem ini akan menggantikan pencatatan manual dengan otomatisasi pelacakan stok dan visualisasi data *real-time*.

**2\. Target Pengguna (User Personas)**

* **Administrator (Klien/Manajer):** Memiliki akses penuh (CRUD) ke seluruh data *sparepart*, dapat membuat/menghapus akun pengguna, dan melihat *dashboard* analitik lengkap.  
* **User (Mekanik/Staf Lapangan):** Hanya memiliki hak akses (*Read-Only*) untuk mencari *sparepart*, melihat detail lokasi rak, memeriksa ketersediaan stok, dan mencatat pengambilan barang.

**3\. Cakupan Fitur Utama (Core Features)**

* **Autentikasi & Otorisasi:** Sistem *login* aman dengan pembatasan hak akses berbasis peran (RBAC).  
* **Dashboard Interaktif:** Visualisasi data stok dan riwayat transaksi menggunakan grafik (Chart.js) yang ter- *update* secara *real-time*.  
* **Manajemen Master Data:** Penambahan, pembaruan, dan penghapusan data *sparepart* lengkap dengan unggahan foto fisik.  
* **Log Transaksi (Audit Trail):** Pencatatan absolut untuk setiap barang masuk dan keluar beserta waktu, nama mekanik, dan keterangan peruntukan mesin.  
* **Pembersihan Data Otomatis (Pending \- Menunggu Konfirmasi Klien):** Sistem *cron job* untuk menghapus riwayat log transaksi lama (misal: lebih dari 1 tahun) guna menjaga performa *database*.

