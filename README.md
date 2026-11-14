# API Todos List Management

REST API untuk mengelola daftar tugas (todo) banyak pengguna, dibangun dengan **Node.js**, **Express 5**, dan **MongoDB Atlas**. API ini mendukung autentikasi JWT, hak akses berbasis peran, kategori, pagination, filter, pencarian, pengurutan, activity log otomatis, endpoint statistik dengan API key, dokumentasi Swagger, dan tes otomatis.

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
- [Menjalankan Tes](#menjalankan-tes)
- [Keamanan](#keamanan)
- [Penulis](#penulis)

## Fitur

- **Autentikasi JWT**: registrasi dan login, password disimpan sebagai hash (bcryptjs).
- **Dua peran**: `user` dan `admin`. User hanya mengakses datanya sendiri, admin boleh melihat semua data tetapi tidak boleh mengubah data milik orang lain.
- **Todo**: judul, deskripsi, status (`pending`, `in_progress`, `done`), prioritas (`low`, `medium`, `high`), tenggat, dan kategori.
- **Kategori** milik masing-masing user, dengan nama unik per user.
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
├── README.md
├── postman/
│   ├── collections/
│   │   └── Todo API/                        # koleksi Postman (37 request)
│   └── environments/
│       └── Todo API - Local.environment.yaml  # environment Postman
└── todo-api/
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
    └── package.json
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

Server berjalan di `http://localhost:5000` (sesuai `PORT`). Cek dengan membuka `http://localhost:5000/health`.

> `nodemon` tidak memantau file `.env`. Setelah mengubah `.env`, ketik `rs` lalu Enter pada terminal yang menjalankan `npm run dev`.

## Dokumentasi API

Dokumentasi interaktif tersedia di **`http://localhost:5000/api-docs`** (spesifikasi mentah di `/api-docs.json`).

Untuk mencoba endpoint yang butuh login:

1. Jalankan `POST /api/auth/login` lewat **Try it out**, lalu salin nilai `token`.
2. Klik **Authorize**, tempel token (tanpa kata `Bearer`), lalu klik **Authorize**.
3. Untuk `/api/stats/summary`, isi API key pada kolom `apiKeyAuth`.

## Ringkasan Endpoint

| Method | Endpoint | Deskripsi | Autentikasi |
| --- | --- | --- | --- |
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
| `status` | `pending`, `in_progress`, `done` | semua |
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

## Keamanan

- Password di-hash dengan bcryptjs, tidak pernah dikembalikan di respons.
- File `.env` dan `node_modules/` tidak boleh di-commit (sudah ada di `.gitignore`).
- Semua input divalidasi dengan express-validator sebelum diproses.
- Pencarian memakai regex yang di-escape.
- API key dibandingkan dengan `crypto.timingSafeEqual`.
- Header keamanan dari `helmet`. Pesan error 500 disamarkan di mode `production`.

## Penulis

[Nama lengkap], [Sekolah / Kampus / Perusahaan]
