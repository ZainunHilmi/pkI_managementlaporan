**1\. Arsitektur Sistem & Teknologi**

Sistem dikembangkan menggunakan pendekatan *Monolithic* dengan infrastruktur *cloud-native* untuk memastikan keamanan data tinggi dan ketersediaan 99.9%.

| Komponen | Teknologi yang Digunakan | Justifikasi |
| :---- | :---- | :---- |
| **Framework & Backend** | PHP / Laravel | Kecepatan pengembangan, keamanan bawaan (CSRF/XSS), dan kemudahan pengelolaan sesi RBAC. Pengembangan dilakukan via VS Code. |
| **Database Relasional** | TiDB Serverless (MySQL) | Menyediakan 5 GB penyimpanan gratis dengan enkripsi otomatis (*End-to-End Encryption*) untuk melindungi data inventaris. |
| **Object Storage (Gambar)** | Cloudflare R2 | Mengisolasi *file* gambar dari *database* utama dengan kuota 10 GB/bulan untuk performa *loading* yang cepat. |
| **Deployment / Hosting** | Render PaaS | Integrasi otomatis dengan *repository* kode, menyembunyikan IP *server* asli, dan menyediakan SSL/HTTPS otomatis. |
| **Keamanan Jaringan** | Cloudflare WAF | Melindungi *endpoint login* dari serangan *brute-force* dan DDoS. |

**2\. Kebutuhan Fungsional (Functional Requirements)**

* **FR-01:** Sistem harus memblokir akses ke halaman *dashboard* bagi pengguna yang tidak memiliki sesi *login* valid.  
* **FR-02:** Sistem harus menyediakan kolom pencarian dinamis (Ajax/Livewire) berdasarkan Nama Part atau ID Part di sisi User.  
* **FR-03:** Sistem harus mengalkulasi jumlah stok secara otomatis (menambah atau mengurangi) saat sebuah *log* transaksi baru disimpan oleh Admin.  
* **FR-04:** Sistem harus memvalidasi ukuran dan ekstensi *file* unggahan (maksimal 2MB, format .jpg/.png) sebelum dikirim ke Cloudflare R2.

**3\. Kebutuhan Non-Fungsional (Non-Functional Requirements)**

* **Security:** *Password* pengguna harus di- *hash* menggunakan algoritma Bcrypt. Kredensial *database* dan API Key R2 tidak boleh berada di *source code*, melainkan di *Environment Variables* (.env).  
* **Performance:** Waktu *loading* halaman katalog *sparepart* (termasuk gambar) tidak boleh lebih dari 3 detik pada koneksi 4G standar.  
* **Responsiveness:** Antarmuka pengguna (UI) harus beradaptasi secara sempurna (*mobile-first design*) karena mekanik akan banyak mengakses melalui *smartphone* di lapangan.

**4\. Kerangka Skema Database (Initial Schema Outline)**

**Tabel users**

* id (Primary Key)  
* name (String)  
* email (String, Unique)  
* password (String, Hashed)  
* role (Enum: 'admin', 'mechanic')  
* timestamps

**Tabel spareparts**

* part\_id (Primary Key, String/UUID)  
* name (String)  
* location (String)  
* current\_stock (Integer, Default 0\)  
* description (Text)  
* image\_url (String, Path R2)  
* timestamps

**Tabel transactions**

* id (Primary Key)  
* part\_id (Foreign Key \-\> spareparts.part\_id)  
* user\_id (Foreign Key \-\> users.id)  
* type (Enum: 'in', 'out')  
* quantity (Integer)  
* notes (String)  
* created\_at (Timestamp, sebagai waktu pencatatan)  
* 

