# Todo List API

Backend REST API untuk aplikasi todo list, dibuat dengan Node.js, Express, dan MongoDB (Mongoose).

## Teknologi
- Node.js, Express.js
- MongoDB Atlas, Mongoose
- JWT, bcryptjs, express-validator, dotenv

## Cara Menjalankan
1. `npm install`
2. Buat file `.env` (lihat contoh di bawah)
3. `npm run dev`
4. Cek `http://localhost:5000/health`

## Environment Variables
PORT=5000
MONGODB_URI=isi_connection_string_mongodb
JWT_SECRET=isi_secret_key
JWT_EXPIRES_IN=1d

## Struktur Folder
src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── validators/
├── app.js
└── server.js


## Struktur Dokumen

| Resource | Field |
|---|---|
| User | name, email (unik), password (hash), role (user/admin), createdAt, updatedAt |
| Category | user (ref), name, color, createdAt, updatedAt |
| Todo | user (ref), category (ref, opsional), title, description, status (pending/in_progress/done), priority (low/medium/high), dueDate, completedAt, timestamps |
| ActivityLog | user (ref), todo (ref, opsional), action (create/update/delete/complete), description, createdAt |

## Daftar Endpoint

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| POST | /api/auth/register | Publik | Daftar |
| POST | /api/auth/login | Publik | Login, dapat JWT |
| GET | /api/auth/me | Login | Profil sendiri |
| GET | /api/todos | Login | List todo milik sendiri (filter status, kategori, priority) |
| POST | /api/todos | Login | Buat todo |
| GET | /api/todos/:id | Login (pemilik) | Detail todo |
| PUT | /api/todos/:id | Login (pemilik) | Update todo |
| PATCH | /api/todos/:id/status | Login (pemilik) | Ubah status |
| DELETE | /api/todos/:id | Login (pemilik) | Hapus todo |
| GET | /api/categories | Login | List kategori |
| POST | /api/categories | Login | Buat kategori |
| PUT | /api/categories/:id | Login (pemilik) | Update kategori |
| DELETE | /api/categories/:id | Login (pemilik) | Hapus kategori |
| GET | /api/activity-logs | Login | Riwayat aktivitas sendiri |
| GET | /api/stats | Login | Ringkasan jumlah todo per status dan priority |

Aturan akses: user hanya boleh mengakses datanya sendiri, admin boleh melihat semua.