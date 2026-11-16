const json = (schema) => ({ 'application/json': { schema } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const res = (name) => ({ $ref: `#/components/responses/${name}` });

const idParam = (label) => ({
  name: 'id',
  in: 'path',
  required: true,
  description: `ID ${label} (ObjectId MongoDB, 24 karakter hex)`,
  schema: { type: 'string', example: '665f1c2e8b1e2a1a2c3d4e5f' },
});

const pageParams = [
  { name: 'page', in: 'query', description: 'Nomor halaman', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'limit', in: 'query', description: 'Jumlah item per halaman', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
];

const ok = (description, schema) => ({ description, content: json(schema) });

const envelope = (dataSchema, extra = {}) => ({
  type: 'object',
  properties: { success: { type: 'boolean', example: true }, data: dataSchema, ...extra },
});

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'API Todos List Management',
    version: '1.0.0',
    description:
      'REST API untuk mengelola todo, kategori, dan log aktivitas, dengan autentikasi JWT, ' +
      'otorisasi berbasis role, dan endpoint statistik yang dilindungi API key.\n\n' +
      '**Cara mencoba endpoint yang butuh login:** jalankan `POST /api/auth/login`, salin nilai `token`, ' +
      'klik tombol **Authorize**, tempel token (tanpa kata `Bearer`), lalu klik Authorize.',
  },
  servers: [{ url: '/', description: 'Server saat ini' }],
  tags: [
    { name: 'Auth', description: 'Registrasi, login, dan profil' },
    { name: 'Todos', description: 'Manajemen todo (pagination, filter, search, sort)' },
    { name: 'Categories', description: 'Manajemen kategori' },
    { name: 'Activity Logs', description: 'Riwayat aktivitas pada todo' },
    { name: 'Stats', description: 'Ringkasan statistik (API key)' },
    { name: 'System', description: 'Health check' },
  ],
  security: [{ bearerAuth: [] }],

  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token dari endpoint login' },
      apiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key', description: 'API key untuk endpoint statistik' },
    },

    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validasi gagal' },
          errors: {
            type: 'array',
            description: 'Hanya ada pada error validasi (400)',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'title' },
                message: { type: 'string', example: 'Judul minimal 3 karakter' },
              },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          currentPage: { type: 'integer', example: 1 },
          totalPages: { type: 'integer', example: 3 },
          totalItems: { type: 'integer', example: 25 },
          itemsPerPage: { type: 'integer', example: 10 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665f1c2e8b1e2a1a2c3d4e5f' },
          name: { type: 'string', example: 'Siti' },
          email: { type: 'string', format: 'email', example: 'siti@example.com' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1c2e8b1e2a1a2c3d4e60' },
          name: { type: 'string', example: 'Kuliah' },
          color: { type: 'string', example: '#e67e22' },
          user: { type: 'string', example: '665f1c2e8b1e2a1a2c3d4e5f' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
                    created_by: { type: 'string', nullable: true, example: '665f1c2e8b1e2a1a2c3d4e5f' },
          updated_by: { type: 'string', nullable: true, example: '665f1c2e8b1e2a1a2c3d4e5f' },
          archived: { type: 'boolean', example: false },
        },
      },
      Todo: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1c2e8b1e2a1a2c3d4e61' },
          title: { type: 'string', example: 'Belajar Express' },
          description: { type: 'string', example: 'Baca dokumentasi resmi' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], example: 'pending' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'medium' },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          category: { oneOf: [ref('Category'), { type: 'string' }], nullable: true, description: 'Objek kategori, atau null bila tidak ada' },
          user: { type: 'string', example: '665f1c2e8b1e2a1a2c3d4e5f' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          created_by: { type: 'string', nullable: true, example: '665f1c2e8b1e2a1a2c3d4e5f' },
          updated_by: { type: 'string', nullable: true, example: '665f1c2e8b1e2a1a2c3d4e5f' },
          archived: { type: 'boolean', example: false },
        },
      },
      ActivityLog: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          user: { type: 'string', description: 'Untuk admin berisi objek user (name, email)' },
          todo: { type: 'string', nullable: true },
          todoTitle: { type: 'string', example: 'Belajar Express' },
          action: { type: 'string', enum: ['create', 'update', 'delete', 'complete'] },
          description: { type: 'string', example: 'Membuat todo "Belajar Express"' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Siti' },
          email: { type: 'string', format: 'email', example: 'siti@example.com' },
          password: { type: 'string', minLength: 6, maxLength: 72, example: 'rahasia123' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'siti@example.com' },
          password: { type: 'string', example: 'rahasia123' },
        },
      },
      TodoInput: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 100, example: 'Belajar Express' },
          description: { type: 'string', maxLength: 500, example: 'Baca dokumentasi resmi' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
          dueDate: { type: 'string', format: 'date', example: '2026-12-31' },
          category: { type: 'string', nullable: true, description: 'ID kategori milik sendiri' },
        },
      },
      TodoUpdateInput: {
        type: 'object',
        description: 'Semua field opsional, tetapi minimal satu field harus dikirim. `category: null` melepas kategori.',
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          dueDate: { type: 'string', format: 'date', nullable: true },
          category: { type: 'string', nullable: true },
        },
      },
      CategoryInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', maxLength: 50, example: 'Kuliah' },
          color: { type: 'string', description: 'Kode warna hex', example: '#e67e22' },
        },
      },
      StatsSummary: {
        type: 'object',
        properties: {
          users: { type: 'integer', example: 3 },
          categories: { type: 'integer', example: 5 },
          todos: {
            type: 'object',
            properties: {
              total: { type: 'integer', example: 40 },
              byStatus: {
                type: 'object',
                properties: {
                  pending: { type: 'integer' },
                  in_progress: { type: 'integer' },
                  completed: { type: 'integer' },
                },
              },
              byPriority: {
                type: 'object',
                properties: {
                  low: { type: 'integer' },
                  medium: { type: 'integer' },
                  high: { type: 'integer' },
                },
              },
              overdue: { type: 'integer', example: 2 },
              completionRate: { type: 'number', description: 'Persentase todo selesai', example: 50 },
            },
          },
          activity: {
            type: 'object',
            properties: { total: { type: 'integer' }, last7Days: { type: 'integer' } },
          },
          generatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },

    responses: {
      ValidationError: { description: 'Validasi gagal (400)', content: json(ref('Error')) },
      Unauthorized: { description: 'Belum login, token tidak valid, atau kedaluwarsa (401)', content: json(ref('Error')) },
      Forbidden: { description: 'Tidak punya hak akses atas data ini (403)', content: json(ref('Error')) },
      NotFound: { description: 'Data tidak ditemukan (404)', content: json(ref('Error')) },
      Conflict: { description: 'Data sudah ada / duplikat (409)', content: json(ref('Error')) },
    },
  },

  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Cek status server',
        security: [],
        responses: { 200: { description: 'Server berjalan' } },
      },
    },

    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Daftar akun baru',
        description: 'Role selalu `user`. Email dinormalkan ke huruf kecil.',
        security: [],
        requestBody: { required: true, content: json(ref('RegisterInput')) },
        responses: {
          201: ok('Akun dibuat', envelope({
            type: 'object',
            properties: { token: { type: 'string' }, user: ref('User') },
          })),
          400: res('ValidationError'),
          409: res('Conflict'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login dan dapatkan token JWT',
        security: [],
        requestBody: { required: true, content: json(ref('LoginInput')) },
        responses: {
          200: ok('Login berhasil', envelope({
            type: 'object',
            properties: { token: { type: 'string' }, user: ref('User') },
          })),
          400: res('ValidationError'),
          401: res('Unauthorized'),
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Profil user yang sedang login',
        responses: {
          200: ok('Profil user', envelope({ type: 'object', properties: { user: ref('User') } })),
          401: res('Unauthorized'),
        },
      },
    },

    '/api/todos': {
      get: {
        tags: ['Todos'],
        summary: 'Daftar todo (pagination, filter, search, sort)',
        description: 'User biasa hanya melihat todo miliknya. Admin melihat todo semua user.',
        parameters: [
          ...pageParams,
          { name: 'status', in: 'query', description: 'Filter status', schema: { type: 'string', enum: ['pending', 'in_progress', 'completed'] } },
          { name: 'priority', in: 'query', description: 'Filter prioritas', schema: { type: 'string', enum: ['low', 'medium', 'high'] } },
          { name: 'category', in: 'query', description: 'Filter berdasarkan ID kategori', schema: { type: 'string' } },
          { name: 'search', in: 'query', description: 'Cari pada judul dan deskripsi (tidak peka huruf besar/kecil)', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', description: 'Kolom pengurutan', schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'title', 'dueDate'], default: 'createdAt' } },
          { name: 'order', in: 'query', description: 'Arah pengurutan', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: {
          200: ok('Daftar todo', envelope({ type: 'array', items: ref('Todo') }, { pagination: ref('Pagination') })),
          400: res('ValidationError'),
          401: res('Unauthorized'),
        },
      },
      post: {
        tags: ['Todos'],
        summary: 'Buat todo baru',
        description: 'Pemilik todo selalu user yang login. Aksi ini dicatat di activity log.',
        requestBody: { required: true, content: json(ref('TodoInput')) },
        responses: {
          201: ok('Todo dibuat', envelope(ref('Todo'))),
          400: res('ValidationError'),
          401: res('Unauthorized'),
          404: res('NotFound'),
        },
      },
    },
    '/api/todos/{id}': {
      parameters: [idParam('todo')],
      get: {
        tags: ['Todos'],
        summary: 'Detail todo',
        description: 'Boleh diakses pemilik atau admin.',
        responses: {
          200: ok('Detail todo', envelope(ref('Todo'))),
          400: res('ValidationError'),
          401: res('Unauthorized'),
          403: res('Forbidden'),
          404: res('NotFound'),
        },
      },
      put: {
        tags: ['Todos'],
        summary: 'Ubah todo',
        description: 'Hanya pemilik (admin pun tidak boleh).',
        requestBody: { required: true, content: json(ref('TodoUpdateInput')) },
        responses: {
          200: ok('Todo diubah', envelope(ref('Todo'))),
          400: res('ValidationError'),
          401: res('Unauthorized'),
          403: res('Forbidden'),
          404: res('NotFound'),
        },
      },
      delete: {
        tags: ['Todos'],
        summary: 'Hapus todo',
        description: 'Hanya pemilik.',
        responses: {
          200: { description: 'Todo dihapus' },
          400: res('ValidationError'),
          401: res('Unauthorized'),
          403: res('Forbidden'),
          404: res('NotFound'),
        },
      },
    },
    '/api/todos/{id}/status': {
      parameters: [idParam('todo')],
      patch: {
        tags: ['Todos'],
        summary: 'Ubah status todo',
        description: 'Status `completed` mengisi `completedAt` dan dicatat sebagai aksi `complete`.',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['status'],
            properties: { status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], example: 'completed' } },
          }),
        },
        responses: {
          200: ok('Status diubah', envelope(ref('Todo'))),
          400: res('ValidationError'),
          401: res('Unauthorized'),
          403: res('Forbidden'),
          404: res('NotFound'),
        },
      },
    },

    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'Daftar kategori',
        description: 'User biasa hanya melihat kategori miliknya. Admin melihat semua.',
        responses: {
          200: ok('Daftar kategori', envelope({ type: 'array', items: ref('Category') })),
          401: res('Unauthorized'),
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Buat kategori',
        description: 'Nama kategori harus unik per user.',
        requestBody: { required: true, content: json(ref('CategoryInput')) },
        responses: {
          201: ok('Kategori dibuat', envelope(ref('Category'))),
          400: res('ValidationError'),
          401: res('Unauthorized'),
          409: res('Conflict'),
        },
      },
    },
    '/api/categories/{id}': {
      parameters: [idParam('kategori')],
      get: {
        tags: ['Categories'],
        summary: 'Detail kategori',
        responses: {
          200: ok('Detail kategori', envelope(ref('Category'))),
          400: res('ValidationError'),
          401: res('Unauthorized'),
          403: res('Forbidden'),
          404: res('NotFound'),
        },
      },
      put: {
        tags: ['Categories'],
        summary: 'Ubah kategori',
        description: 'Hanya pemilik.',
        requestBody: { required: true, content: json(ref('CategoryInput')) },
        responses: {
          200: ok('Kategori diubah', envelope(ref('Category'))),
          400: res('ValidationError'),
          401: res('Unauthorized'),
          403: res('Forbidden'),
          404: res('NotFound'),
          409: res('Conflict'),
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Hapus kategori',
        description: 'Todo yang memakai kategori ini tetap ada, kategorinya menjadi `null`. Hanya pemilik.',
        responses: {
          200: { description: 'Kategori dihapus' },
          400: res('ValidationError'),
          401: res('Unauthorized'),
          403: res('Forbidden'),
          404: res('NotFound'),
        },
      },
    },

    '/api/activity-logs': {
      get: {
        tags: ['Activity Logs'],
        summary: 'Riwayat aktivitas (terbaru di atas)',
        description: 'User biasa hanya melihat log miliknya. Admin melihat semua. Hanya aksi yang berhasil yang dicatat.',
        parameters: [
          ...pageParams,
          { name: 'action', in: 'query', description: 'Filter jenis aksi', schema: { type: 'string', enum: ['create', 'update', 'delete', 'complete'] } },
          { name: 'todo', in: 'query', description: 'Filter berdasarkan ID todo', schema: { type: 'string' } },
        ],
        responses: {
          200: ok('Daftar log', envelope({ type: 'array', items: ref('ActivityLog') }, { pagination: ref('Pagination') })),
          400: res('ValidationError'),
          401: res('Unauthorized'),
        },
      },
    },

    '/api/stats/summary': {
      get: {
        tags: ['Stats'],
        summary: 'Ringkasan statistik seluruh sistem',
        description: 'Dilindungi API key lewat header `x-api-key` (bukan token JWT).',
        security: [{ apiKeyAuth: [] }],
        responses: {
          200: ok('Ringkasan statistik', envelope(ref('StatsSummary'))),
          401: res('Unauthorized'),
        },
      },
    },
  },
};