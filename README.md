# API Todos List Management

REST API untuk mengelola daftar tugas (todo) banyak pengguna, dibangun dengan **Node.js**, **Express 5**, dan **MongoDB Atlas**. API ini mendukung autentikasi JWT, hak akses berbasis peran, kategori, pagination, filter, pencarian, pengurutan, activity log otomatis, endpoint statistik dengan API key, dokumentasi Swagger, dan tes otomatis.

**Live API:** https://gamelab-todo-api-ebon.vercel.app  
**Dokumentasi Swagger:** https://gamelab-todo-api-ebon.vercel.app/api-docs

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Struktur Proyek](#struktur-proyek)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Environment Variable](#environment-variable)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Dokumentasi API](#dokumentasi-api)
- [Ringkasan Endpoint](#ringkasan-endpoint)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Hak Akses](#hak-akses)
- [Format Respons dan Error](#format-respons-dan-error)
- [Koleksi Postman](#koleksi-postman)
- [Menjalankan Tes](#menjalankan-tes)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Keamanan](#keamanan)
- [Penulis](#penulis)

## Fitur

- **Autentikasi JWT**: registrasi dan login, password disimpan sebagai hash (bcryptjs).
- **Dua peran**: `user` dan `admin`. User hanya mengakses datanya sendiri, admin boleh melihat semua data tetapi tidak boleh mengubah data milik orang lain.
- **Todo**: judul, deskripsi, status (`pending`, `in_progress`, `completed`), prioritas (`low`, `medium`, `high`), tenggat, kategori, dan status arsip (`archived`).
- **Kategori** milik masing-masing user, dengan nama unik per user.
- **Field audit** pada todo dan kategori: `created_by`, `updated_by`, `archived`, serta `createdAt` dan `updatedAt` otomatis.
- **Daftar todo yang lengkap**: pagination, filter (status, prioritas, kategori), pencarian pada judul dan deskripsi, serta pengurutan.
- **Activity log** otomatis untuk aksi membuat, mengubah, menyelesaikan, dan menghapus todo. Hanya aksi yang berhasil yang dicatat.
- **Endpoint statistik** yang dilindungi API key.
- **Validasi input** dengan express-validator dan pesan error yang informatif.
- **Penanganan error terpusat** dengan kode status HTTP yang tepat.
- **Dokumentasi Swagger** interaktif di `/api-docs`.
- **Tes otomatis** dengan Jest dan Supertest.

## Teknologi

| Teknologi | Kegunaan |
| --- | --- |
| Node.js 20.19+ | Runtime JavaScript |
| Express 5 | Framework API |
| MongoDB Atlas + Mongoose 9 | Database dan pemodelan data |
| jsonwebtoken | Token JWT |
| bcryptjs | Hash password |
| express-validator | Validasi input |
| helmet, cors | Keamanan header dan akses lintas domain |
| dotenv | Membaca file `.env` |
| swagger-ui-express | Dokumentasi API interaktif |
| Jest, Supertest, mongodb-memory-server | Tes otomatis |
| nodemon | Restart otomatis saat pengembangan |

## Struktur Proyek

```text
NAMA-REPO/
├── README.md                 # dokumentasi ini (tampil di halaman depan GitHub)
├── postman/
│   ├── collections/
│   │   └── Todo API/                        # koleksi Postman (37 request)
│   └── environments/
│       └── Todo API - Local.environment.yaml  # environment Postman
└── todo-api/
    ├── api/                # entry point serverless untuk Vercel
    ├── src/
    │   ├── config/         # koneksi database
    │   ├── controllers/    # menerima request, mengirim response
    │   ├── docs/           # spesifikasi Swagger (openapi.js)
    │   ├── middleware/     # auth JWT, role, validate, API key, logger, error handler
    │   ├── models/         # skema Mongoose: User, Category, Todo, ActivityLog
    │   ├── routes/         # daftar endpoint
    │   ├── services/       # logika bisnis dan query database
    │   ├── utils/          # AppError dan catchAsync
    │   ├── validators/     # aturan express-validator
    │   ├── app.js          # susunan Express
    │   └── server.js       # titik awal aplikasi
    ├── tests/              # tes Jest dan Supertest
    ├── .env.example        # contoh environment variable
    ├── jest.config.js
    ├── package.json
    └── vercel.json         # konfigurasi deploy Vercel
```

Folder `postman/` berisi koleksi dan environment untuk menguji semua endpoint. Semua perintah di README ini dijalankan dari folder `todo-api/`.

Alur setiap request: **route → middleware (auth dan validasi) → controller → service → model → MongoDB**. Jika ada langkah yang gagal, `errorHandler` mengirim respons error yang seragam.

## Prasyarat

- [Node.js](https://nodejs.org) versi 20.19 atau lebih baru
- npm (ikut terpasang bersama Node.js)
- Akun [MongoDB Atlas](https://www.mongodb.com/atlas) dengan satu cluster (paket gratis cukup)
- Git

## Instalasi

```bash
# 1. Clone repository
git clone https://github.com/lyinncte/GAMELAB-todoApi.git
cd GAMELAB-todoApi/todo-api

# 2. Pasang dependensi
npm install

# 3. Salin contoh environment variable, lalu isi nilainya
cp .env.example .env            # Windows PowerShell: Copy-Item .env.example .env
```

### Menyiapkan MongoDB Atlas

1. Buat cluster gratis di MongoDB Atlas.
2. Pada **Database Access**, buat user database beserta password.
3. Pada **Network Access**, tambahkan alamat IP komputer Anda (untuk belajar boleh `0.0.0.0/0`).
4. Pada **Connect → Drivers**, salin connection string, ganti `<password>`, dan tambahkan nama database (misalnya `todo-api`).
5. Tempel hasilnya sebagai nilai `MONGODB_URI` di file `.env`.

Koleksi dibuat otomatis oleh Mongoose saat data pertama disimpan, jadi tidak ada langkah migrasi atau seeding.

## Environment Variable

Semua variabel diatur di file `.env` (jangan di-commit). Contoh ada di `.env.example`.

| Variabel | Contoh | Keterangan |
| --- | --- | --- |
| `PORT` | `5000` | Port server |
| `MONGODB_URI` | `mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/todo-api` | Connection string MongoDB Atlas |
| `NODE_ENV` | `development` | Mode aplikasi. Di `development`, respons error menyertakan `stack`; di `production` disembunyikan |
| `JWT_SECRET` | teks acak yang panjang | Kunci penandatangan token JWT |
| `JWT_EXPIRES_IN` | `1d` | Masa berlaku token |
| `EXTERNAL_API_KEY` | teks acak yang panjang | API key untuk endpoint `/api/stats/summary` |

Membuat teks acak yang kuat:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Menjalankan Aplikasi

```bash
# Mode pengembangan (restart otomatis)
npm run dev

# Mode produksi
npm start
```

Server berjalan di `http://localhost:5000` (sesuai `PORT`). Cek dengan membuka `http://localhost:5000/` (status API dan tautan dokumentasi) atau `http://localhost:5000/health`.

> `nodemon` tidak memantau file `.env`. Setelah mengubah `.env`, ketik `rs` lalu Enter pada terminal yang menjalankan `npm run dev`.

## Dokumentasi API

Dokumentasi interaktif tersedia di **`http://localhost:5000/api-docs`** (spesifikasi mentah di `/api-docs.json`). Halaman ini memuat Swagger UI dari CDN, jadi butuh koneksi internet.

Versi live: https://gamelab-todo-api-ebon.vercel.app/api-docs

Untuk mencoba endpoint yang butuh login:

1. Jalankan `POST /api/auth/login` lewat **Try it out**, lalu salin nilai `token`.
2. Klik **Authorize**, tempel token (tanpa kata `Bearer`), lalu klik **Authorize**.
3. Untuk `/api/stats/summary`, isi API key pada kolom `apiKeyAuth`.

## Ringkasan Endpoint

| Method | Endpoint | Deskripsi | Autentikasi |
| --- | --- | --- | --- |
| GET | `/` | Status API dan tautan dokumentasi | Tidak |
| GET | `/health` | Cek status server | Tidak |
| POST | `/api/auth/register` | Daftar akun baru | Tidak |
| POST | `/api/auth/login` | Login dan mendapat token | Tidak |
| GET | `/api/auth/me` | Profil user yang login | JWT |
| GET | `/api/todos` | Daftar todo (pagination, filter, search, sort) | JWT |
| POST | `/api/todos` | Buat todo | JWT |
| GET | `/api/todos/:id` | Detail todo | JWT |
| PUT | `/api/todos/:id` | Ubah todo | JWT |
| PATCH | `/api/todos/:id/status` | Ubah status todo | JWT |
| DELETE | `/api/todos/:id` | Hapus todo | JWT |
| GET | `/api/categories` | Daftar kategori | JWT |
| POST | `/api/categories` | Buat kategori | JWT |
| GET | `/api/categories/:id` | Detail kategori | JWT |
| PUT | `/api/categories/:id` | Ubah kategori | JWT |
| DELETE | `/api/categories/:id` | Hapus kategori | JWT |
| GET | `/api/activity-logs` | Riwayat aktivitas | JWT |
| GET | `/api/stats/summary` | Ringkasan statistik | API key |

### Query pada `GET /api/todos`

| Parameter | Nilai | Default |
| --- | --- | --- |
| `page` | angka ≥ 1 | `1` |
| `limit` | 1 sampai 100 | `10` |
| `status` | `pending`, `in_progress`, `completed` | semua |
| `priority` | `low`, `medium`, `high` | semua |
| `category` | ID kategori | semua |
| `search` | teks bebas (judul dan deskripsi) | tanpa pencarian |
| `sortBy` | `createdAt`, `updatedAt`, `title`, `dueDate` | `createdAt` |
| `order` | `asc`, `desc` | `desc` |

Contoh: `GET /api/todos?status=pending&search=belajar&sortBy=title&order=asc&page=1&limit=5`

## Contoh Penggunaan

**Registrasi**

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Budi",
  "email": "budi@example.com",
  "password": "rahasia123"
}
```

**Login**, lalu simpan nilai `token` dari respons:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "budi@example.com",
  "password": "rahasia123"
}
```

**Membuat todo** (kirim token di header):

```http
POST /api/todos
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Belajar Express",
  "description": "Baca dokumentasi resmi",
  "priority": "high",
  "dueDate": "2026-12-31"
}
```

**Statistik** (memakai API key, bukan token):

```http
GET /api/stats/summary
x-api-key: <nilai EXTERNAL_API_KEY>
```

## Hak Akses

| Aksi | User | Admin |
| --- | --- | --- |
| Melihat daftar todo, kategori, dan activity log | Hanya miliknya | Semua data |
| Melihat detail todo atau kategori | Hanya miliknya | Semua data |
| Mengubah atau menghapus todo dan kategori | Hanya miliknya | Tidak boleh data milik orang lain |
| Statistik `/api/stats/summary` | Memakai API key | Memakai API key |

Endpoint register selalu membuat user dengan peran `user`. Untuk membuat admin, ubah nilai `role` akun tersebut menjadi `admin` langsung di MongoDB Atlas.

## Format Respons dan Error

Respons sukses:

```json
{
  "success": true,
  "data": { }
}
```

Respons daftar menambahkan `pagination` (`currentPage`, `totalPages`, `totalItems`, `itemsPerPage`, `hasNextPage`, `hasPrevPage`).

Respons error:

```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": [{ "field": "title", "message": "..." }]
}
```

| Kode | Arti |
| --- | --- |
| 200 / 201 | Berhasil / data baru dibuat |
| 400 | Validasi gagal, ID tidak valid, atau JSON rusak |
| 401 | Token atau API key tidak ada, salah, atau kedaluwarsa; login salah |
| 403 | Bukan pemilik data |
| 404 | Data atau URL tidak ditemukan |
| 409 | Data kembar (email atau nama kategori sudah dipakai) |
| 500 | Kesalahan server |

## Koleksi Postman

Folder `postman/` berisi koleksi **Todo API** (37 request, dikelompokkan: System, Auth, Categories, Todos, Activity Logs, Stats, Error cases, Cleanup) beserta environment **Todo API - Local**.

1. Buka Postman, lalu impor folder koleksi dan file environment dari folder `postman/`.
2. Pilih environment **Todo API - Local** di pojok kanan atas.
3. Variabel `baseUrl` bernilai `http://localhost:5000`. Ganti ke `https://gamelab-todo-api-ebon.vercel.app` untuk menguji API live.
4. Isi API key untuk endpoint statistik (variabel `apiKey` atau Vault Postman dengan nama `api-key`). Nilainya sama dengan `EXTERNAL_API_KEY`.
5. Klik **Run collection**. Hasil yang diharapkan: seluruh pengecekan lolos (**57 passed**). Variabel `token` dan `todoId` terisi otomatis oleh skrip koleksi.

> Jangan menyimpan token atau API key asli di file environment yang di-commit.

## Menjalankan Tes

Buat file `.env.test` di folder yang sama dengan `package.json` (jangan di-commit):

```text
NODE_ENV=test
JWT_SECRET=secret-khusus-untuk-testing
JWT_EXPIRES_IN=1h
EXTERNAL_API_KEY=api-key-khusus-untuk-testing
```

Lalu jalankan:

```bash
npm test                          # semua tes
npx jest --runInBand --verbose    # tampilkan nama tiap tes
```

Tes memakai database MongoDB sementara di memori (`mongodb-memory-server`), sehingga database Atlas tidak tersentuh. Pada run pertama, program MongoDB diunduh sehingga prosesnya lebih lama. Tes mencakup autentikasi, todo (hak akses, pagination, filter, search, sort, validasi), kategori, activity log, dan statistik dengan API key.

## Deploy ke Vercel

API ini berjalan di Vercel sebagai serverless function melalui `api/index.js` dan `vercel.json`.

1. Push repository ke GitHub.
2. Di Vercel, pilih **Add New → Project**, lalu impor repository.
3. Isi **Root Directory** dengan `todo-api`.
4. Tambahkan Environment Variables: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `EXTERNAL_API_KEY`, dan `NODE_ENV=production`.
5. Pada MongoDB Atlas → **Network Access**, izinkan `0.0.0.0/0` karena IP Vercel berubah-ubah.
6. Klik **Deploy**, lalu cek `/health`.

Perubahan environment variable baru berlaku setelah **Redeploy**.

## Keamanan

- Password di-hash dengan bcryptjs, tidak pernah dikembalikan di respons.
- File `.env` dan `node_modules/` tidak boleh di-commit (sudah ada di `.gitignore`).
- Semua input divalidasi dengan express-validator sebelum diproses.
- Pencarian memakai regex yang di-escape.
- API key dibandingkan dengan `crypto.timingSafeEqual`.
- Header keamanan dari `helmet`. Pesan error 500 disamarkan di mode `production`.

## Penulis

MUHAMMAD DZAKKY, SMKN 12 Kab. Tangerang
