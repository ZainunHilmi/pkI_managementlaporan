\# Software Requirements Specification (SRS)  
\#\# Sistem Manajemen Sparepart

\*\*Versi:\*\* 1.1 (Updated Storage)    
\*\*Tanggal:\*\* September 2026    
\*\*Status:\*\* Draft  

\---

\#\# 1\. Pendahuluan

\#\#\# 1.1 Tujuan Dokumen  
Dokumen ini mendeskripsikan kebutuhan fungsional dan non-fungsional secara teknis untuk pengembangan Sistem Manajemen Sparepart. Dokumen ini ditujukan untuk AI agent atau developer yang akan mengimplementasikan sistem.

\#\#\# 1.2 Ruang Lingkup  
Sistem adalah aplikasi web fullstack berbasis Next.js 14 dengan dua panel akses (Admin dan User). Data sparepart disimpan di CockroachDB, gambar di-hosting via ImgBB API, dan autentikasi dikelola NextAuth.js. Aplikasi di-deploy ke Vercel.

\#\#\# 1.3 Referensi  
\- Next.js 14 App Router Docs: https://nextjs.org/docs  
\- NextAuth.js v5 Docs: https://authjs.dev  
\- Prisma Docs: https://www.prisma.io/docs  
\- CockroachDB Free Tier: https://cockroachlabs.com  
\- ImgBB API Docs: https://api.imgbb.com/

\---

\#\# 2\. Arsitektur Sistem

\#\#\# 2.1 Stack  
\`\`\`text  
Client Browser  
    ↓ HTTPS  
Next.js 14 — App Router (Vercel)  
    ↓ JWT validation  
NextAuth.js — Middleware  
    ↓ role check  
Panel Admin | Panel User  
    ↓ fetch / server action  
Next.js API Routes  
    ↓                   ↓  
CockroachDB         ImgBB API  
(Prisma ORM)        (HTTP POST)

### **2.2 Struktur Folder Project**

Plaintext  
sparepart-app/  
├── app/  
│   ├── (auth)/  
│   │   └── login/  
│   │       └── page.tsx  
│   ├── (admin)/  
│   │   ├── layout.tsx          ← cek role ADMIN, redirect jika bukan  
│   │   ├── dashboard/page.tsx  
│   │   ├── sparepart/  
│   │   │   ├── page.tsx        ← list semua sparepart  
│   │   │   ├── tambah/page.tsx  
│   │   │   └── \[id\]/edit/page.tsx  
│   │   ├── users/page.tsx  
│   │   └── laporan/page.tsx  
│   ├── (user)/  
│   │   ├── layout.tsx          ← cek role USER, redirect jika bukan  
│   │   ├── dashboard/page.tsx  
│   │   ├── sparepart/  
│   │   │   └── \[id\]/page.tsx   ← detail \+ form catat penggunaan  
│   │   └── riwayat/page.tsx  
│   ├── api/  
│   │   ├── auth/\[...nextauth\]/route.ts  
│   │   ├── sparepart/  
│   │   │   ├── route.ts        ← GET (list), POST (tambah)  
│   │   │   └── \[id\]/route.ts   ← GET, PUT, DELETE  
│   │   ├── upload/route.ts     ← upload gambar ke ImgBB API  
│   │   ├── users/route.ts      ← CRUD user (admin only)  
│   │   └── laporan/route.ts    ← data rekap bulanan  
│   ├── unauthorized/page.tsx  
│   └── layout.tsx              ← root layout  
├── prisma/  
│   └── schema.prisma  
├── lib/  
│   ├── prisma.ts               ← Prisma client singleton  
│   └── auth.ts                 ← NextAuth config  
├── components/  
│   ├── ui/                     ← shadcn/ui components  
│   ├── SparePartCard.tsx  
│   ├── SparePartForm.tsx  
│   ├── StockBadge.tsx  
│   └── ImageUpload.tsx  
├── middleware.ts               ← NextAuth route protection  
└── .env                        ← environment variables

## **3\. Skema Database (Prisma)**

Cuplikan kode  
generator client {  
  provider \= "prisma-client-js"  
}

datasource db {  
  provider \= "cockroachdb"  
  url      \= env("DATABASE\_URL")  
}

enum Role {  
  ADMIN  
  USER  
}

model User {  
  id        String    @id @default(cuid())  
  name      String  
  email     String    @unique  
  password  String    // bcrypt hash  
  role      Role      @default(USER)  
  isActive  Boolean   @default(true)  
  createdAt DateTime  @default(now())  
  updatedAt DateTime  @updatedAt

  spareParts  Sparepart\[\]  
  stockHistory StockHistory\[\]

  @@map("users")  
}

model Sparepart {  
  id          String    @id @default(cuid())  
  nama        String  
  jumlahStock Int       @default(0)  
  lokasi      String  
  deskripsi   String  
  gambar      String\[\]  // array URL publik dari ImgBB (max 2\)  
  threshold   Int       @default(5)  // batas minimum stok  
  createdAt   DateTime  @default(now())  
  updatedAt   DateTime  @updatedAt

  createdById String  
  createdBy   User      @relation(fields: \[createdById\], references: \[id\])  
  stockHistory StockHistory\[\]

  @@map("spareparts")  
}

model StockHistory {  
  id          String    @id @default(cuid())  
  sparepartId String  
  sparepart   Sparepart @relation(fields: \[sparepartId\], references: \[id\])  
  userId      String  
  user        User      @relation(fields: \[userId\], references: \[id\])  
  type        StockType  // MASUK atau KELUAR  
  jumlah      Int  
  keterangan  String?  
  createdAt   DateTime  @default(now())

  @@map("stock\_history")  
}

enum StockType {  
  MASUK  
  KELUAR  
}

## **4\. Environment Variables**

File `.env` wajib berisi:

Cuplikan kode  
\# Database  
DATABASE\_URL="postgresql://user:pass@host:26257/sparepart\_db?sslmode=verify-full"

\# NextAuth  
NEXTAUTH\_SECRET="random-secret-min-32-chars"  
NEXTAUTH\_URL="http://localhost:3000"

\# ImgBB  
IMGBB\_API\_KEY="your-imgbb-api-key"

## **5\. Kebutuhan Fungsional Detail**

### **5.1 Autentikasi**

**FR-AUTH-01: Login**

* Input: email (string, valid email format), password (string, min 8 karakter)  
* Proses: cek email di tabel `users`, verifikasi password dengan `bcrypt.compare()`  
* Output sukses: session JWT dibuat, redirect ke panel sesuai role  
* Output gagal: pesan error "Email atau password salah"

**FR-AUTH-02: Proteksi Route**

* File `middleware.ts` menggunakan `withAuth` dari NextAuth  
* Route `/admin/*` hanya bisa diakses role `ADMIN`  
* Route `/user/*` hanya bisa diakses role `USER`  
* Route `/` redirect ke panel sesuai role jika sudah login

**FR-AUTH-03: Logout**

* Endpoint: `POST /api/auth/signout`  
* Hapus session cookie, redirect ke `/login`

### **5.2 API Sparepart**

**FR-SP-01: GET /api/sparepart**

* Header: Bearer JWT wajib  
* Query params opsional: `?search=nama&lokasi=gudangA&page=1&limit=20`  
* Response: `{ data: Sparepart[], total: number, page: number }`

**FR-SP-02: POST /api/sparepart**

* Hanya role `ADMIN`  
* Body (multipart/form-data):  
  1. `nama`: string, required, max 100 char  
  2. `jumlahStock`: integer, required, min 0  
  3. `lokasi`: string, required, max 200 char  
  4. `deskripsi`: string, required, max 1000 char  
  5. `gambar`: file\[\], max 2 file, max 5 MB per file, format JPG/PNG/WEBP  
  6. `threshold`: integer, opsional, default 5  
* Proses:  
  1. Validasi input  
  2. Kompres gambar server-side (target \< 400 KB) atau pastikan kompresi dari client  
  3. Upload ke ImgBB API, dapatkan URL publik (`url`)  
  4. Simpan data \+ URL gambar ke CockroachDB via Prisma  
  5. Catat ke `StockHistory` sebagai `MASUK` dengan jumlah awal  
* Response: `{ success: true, data: Sparepart }`

**FR-SP-03: PUT /api/sparepart/\[id\]**

* Hanya role `ADMIN`  
* Body: field yang diubah (partial update)  
* Jika ada gambar baru: Upload gambar baru ke ImgBB dan timpa URL di database. (Catatan: Gambar lama tidak dihapus secara direct di ImgBB karena keterbatasan API v1 tanpa user authentication token).  
* Jika `jumlahStock` berubah: catat di `StockHistory`

**FR-SP-04: DELETE /api/sparepart/\[id\]**

* Hanya role `ADMIN`  
* Hapus record dari database (cascade ke `StockHistory`). Gambar di ImgBB akan dibiarkan orphan (karena limitasi hapus API v1).

### **5.3 API Upload Gambar**

**FR-UP-01: POST /api/upload**

* Hanya role `ADMIN`  
* Body: `FormData` dengan key `file`  
* Validasi: tipe file (image/jpeg, image/png, image/webp), ukuran max 5 MB  
* Proses upload ke ImgBB:

TypeScript  
const formData \= await request.formData();  
const file \= formData.get("file") as File;

const imgbbFormData \= new FormData();  
imgbbFormData.append("image", file);

const response \= await fetch(\`\[https://api.imgbb.com/1/upload?key=$\](https://api.imgbb.com/1/upload?key=$){process.env.IMGBB\_API\_KEY}\`, {  
  method: "POST",  
  body: imgbbFormData,  
});

const data \= await response.json();

if (\!response.ok || \!data.success) {  
    throw new Error("Gagal mengunggah ke ImgBB");  
}

const url \= data.data.url; // URL publik gambar

* Response: `{ url: string }`

### **5.4 API Catat Penggunaan (User)**

**FR-USG-01: POST /api/sparepart/\[id\]/pakai**

* Hanya role `USER`  
* Body: `{ jumlah: number, keterangan: string }`  
* Validasi: `jumlah` \> 0 dan `jumlah` \<= `jumlahStock` saat ini  
* Proses:  
  1. Kurangi `jumlahStock` di tabel `spareparts`  
  2. Catat ke `StockHistory` sebagai `KELUAR`  
* Response: `{ success: true, sisaStok: number }`

### **5.5 API Laporan Bulanan**

**FR-LAP-01: GET /api/laporan**

* Hanya role `ADMIN`  
* Query params: `?bulan=9&tahun=2026`  
* Proses query:

TypeScript  
const history \= await prisma.stockHistory.groupBy({  
  by: \['sparepartId', 'type'\],  
  where: {  
    createdAt: {  
      gte: new Date(tahun, bulan \- 1, 1),  
      lt: new Date(tahun, bulan, 1),  
    }  
  },  
  \_sum: { jumlah: true },  
});

* Response: array per sparepart berisi `{ nama, totalMasuk, totalKeluar, stokAwal, stokAkhir }`

### **5.6 Middleware Auth**

File `middleware.ts`:

TypeScript  
export { default } from "next-auth/middleware";

export const config \= {  
  matcher: \["/admin/:path\*", "/user/:path\*"\],  
};

Cek role di layout masing-masing panel:

TypeScript  
// app/(admin)/layout.tsx  
import { getServerSession } from "next-auth";  
import { redirect } from "next/navigation";  
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({ children }) {  
  const session \= await getServerSession(authOptions);  
  if (\!session || session.user.role \!== "ADMIN") {  
    redirect("/unauthorized");  
  }  
  return \<\>{children}\</\>;  
}

## **6\. Kebutuhan Non-Fungsional**

### **6.1 Keamanan**

* Password wajib di-hash dengan `bcrypt` (saltRounds \= 12\)  
* Semua API route wajib validasi session sebelum memproses request  
* Input wajib divalidasi dengan `zod` sebelum menyentuh database  
* File upload: validasi MIME type dan ukuran di sisi server  
* Environment variable tidak boleh di-commit ke repository

### **6.2 Performa**

* Gunakan Prisma connection singleton untuk mencegah connection pool exhaustion di serverless.  
* Gambar dikompresi client-side sebelum upload menggunakan `browser-image-compression`.  
* Gunakan Next.js `Image` component untuk optimasi tampilan gambar.

### **6.3 Validasi Input**

Gunakan `zod` untuk semua validasi.

### **6.4 Error Handling**

Semua API route harus menggunakan blok `try...catch` dan mengembalikan standar response `NextResponse.json`.

## **7\. Komponen UI yang Dibutuhkan**

| Komponen | Lokasi | Keterangan |
| ----- | ----- | ----- |
| `LoginForm` | `(auth)/login` | Form email \+ password |
| `SparePartTable` | `(admin)/sparepart` | Tabel dengan aksi edit/hapus |
| `SparePartForm` | `(admin)/sparepart/tambah` | Form tambah/edit \+ upload gambar |
| `ImageUpload` | komponen shared | Preview \+ kompres sebelum upload |
| `StockBadge` | shared | Badge merah jika stok \< threshold |
| `UsageForm` | `(user)/sparepart/[id]` | Form catat penggunaan stok |
| `LaporanTable` | `(admin)/laporan` | Tabel rekap bulanan \+ filter bulan |
| `DashboardStats` | kedua panel | Kartu ringkasan statistik |

## **8\. Dependency yang Dibutuhkan**

JSON  
{  
  "dependencies": {  
    "next": "^14.0.0",  
    "react": "^18.0.0",  
    "typescript": "^5.0.0",  
    "next-auth": "^5.0.0",  
    "@prisma/client": "^5.0.0",  
    "bcryptjs": "^2.4.3",  
    "zod": "^3.22.0",  
    "browser-image-compression": "^2.0.0",  
    "tailwindcss": "^3.4.0",  
    "@radix-ui/react-\*": "latest"  
  },  
  "devDependencies": {  
    "prisma": "^5.0.0",  
    "@types/bcryptjs": "^2.4.0"  
  }  
}

## **9\. Urutan Implementasi (untuk AI Agent)**

1. Setup project Next.js \+ TypeScript \+ Tailwind  
2. Buat `prisma/schema.prisma` → jalankan `prisma db push`  
3. Buat `lib/prisma.ts` dan `lib/auth.ts`  
4. Implementasi NextAuth di `app/api/auth/[...nextauth]/route.ts`  
5. Buat `middleware.ts` untuk proteksi route  
6. Setup environment variable `IMGBB_API_KEY` dan buat `app/api/upload/route.ts`  
7. Implementasi CRUD API sparepart (`app/api/sparepart/`)  
8. Buat halaman login (`app/(auth)/login/page.tsx`)  
9. Buat layout \+ halaman Admin panel  
10. Buat layout \+ halaman User panel  
11. Implementasi API laporan bulanan  
12. Testing end-to-end

Ada bagian logika atau komponen spesifik yang mau kita cek sebelum agent-mu mulai mengeksekusinya?

