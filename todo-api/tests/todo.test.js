const request = require('supertest');
const app = require('../src/app');
const Todo = require('../src/models/Todo');
const Category = require('../src/models/Category');
const { createUser, auth, errorFields } = require('./helpers');

const MISSING_ID = '665f1c2e8b1e2a1a2c3d9999';

let siti;
let budi;
let admin;

beforeEach(async () => {
  siti = await createUser({ name: 'Siti' });
  budi = await createUser({ name: 'Budi' });
  admin = await createUser({ name: 'Admin', role: 'admin' });
});

const postTodo = (user, data) => request(app).post('/api/todos').set(auth(user)).send(data);

// Memasukkan todo langsung ke database (lebih cepat daripada lewat API)
const seed = (user, items) =>
  Todo.insertMany(items.map((item) => ({ user: user.id, ...item })));

describe('POST /api/todos', () => {
  it('membuat todo dengan nilai default', async () => {
    const res = await postTodo(siti, { title: 'Kerjakan tugas' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: 'Kerjakan tugas',
      status: 'pending',
      priority: 'medium',
      user: siti.id,
    });
  });

  it('pemilik selalu dari token, bukan dari body', async () => {
    const res = await postTodo(siti, { title: 'Coba pakai user lain', user: budi.id });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toBe(siti.id);
  });

  it('menerima kategori milik sendiri dan menampilkannya', async () => {
    const category = await Category.create({ user: siti.id, name: 'Kampus' });
    const res = await postTodo(siti, { title: 'Tugas kuliah', category: category.id });

    expect(res.status).toBe(201);
    expect(res.body.data.category).toMatchObject({ name: 'Kampus' });
  });

  it('menolak kategori milik user lain (404)', async () => {
    const category = await Category.create({ user: budi.id, name: 'Kerja' });
    const res = await postTodo(siti, { title: 'Tugas kuliah', category: category.id });

    expect(res.status).toBe(404);
  });

  it('menolak request tanpa token (401)', async () => {
    const res = await request(app).post('/api/todos').send({ title: 'Tanpa token' });
    expect(res.status).toBe(401);
  });

  it('menolak judul kosong atau terlalu pendek', async () => {
    const empty = await postTodo(siti, {});
    const short = await postTodo(siti, { title: 'ab' });

    expect(empty.status).toBe(400);
    expect(short.status).toBe(400);
    expect(errorFields(empty)).toContain('title');
    expect(errorFields(short)).toContain('title');
  });

  it.each([
    ['priority', { priority: 'urgent' }],
    ['status', { status: 'ngasal' }],
    ['dueDate', { dueDate: 'besok' }],
    ['category', { category: 'abc' }],
  ])('menolak %s yang tidak valid', async (field, override) => {
    const res = await postTodo(siti, { title: 'Todo valid', ...override });

    expect(res.status).toBe(400);
    expect(errorFields(res)).toContain(field);
  });

  it('menerima dueDate yang valid', async () => {
    const res = await postTodo(siti, { title: 'Todo valid', dueDate: '2026-12-31' });
    expect(res.status).toBe(201);
  });
});

describe('GET /api/todos: hak akses', () => {
  beforeEach(async () => {
    await seed(siti, [{ title: 'Todo Siti 1' }, { title: 'Todo Siti 2' }]);
    await seed(budi, [{ title: 'Todo Budi' }]);
  });

  it('user biasa hanya melihat todo miliknya', async () => {
    const res = await request(app).get('/api/todos').set(auth(siti));

    expect(res.status).toBe(200);
    expect(res.body.pagination.totalItems).toBe(2);
    expect(res.body.data.every((t) => t.title.startsWith('Todo Siti'))).toBe(true);
  });

  it('admin melihat todo semua user, lengkap dengan pemiliknya', async () => {
    const res = await request(app).get('/api/todos').set(auth(admin));

    expect(res.status).toBe(200);
    expect(res.body.pagination.totalItems).toBe(3);
    expect(res.body.data[0].user).toHaveProperty('email');
  });

  it('menolak request tanpa token (401)', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/todos: pagination', () => {
  beforeEach(async () => {
    await seed(siti, Array.from({ length: 12 }, (_, i) => ({ title: `Todo nomor ${i + 1}` })));
  });

  it('default 10 item per halaman', async () => {
    const res = await request(app).get('/api/todos').set(auth(siti));

    expect(res.body.data).toHaveLength(10);
    expect(res.body.pagination).toMatchObject({
      currentPage: 1,
      totalPages: 2,
      totalItems: 12,
      itemsPerPage: 10,
      hasNextPage: true,
      hasPrevPage: false,
    });
  });

  it('halaman terakhir berisi sisa data', async () => {
    const res = await request(app).get('/api/todos').query({ page: 2 }).set(auth(siti));

    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({ hasNextPage: false, hasPrevPage: true });
  });

  it('halaman tidak saling tumpang tindih', async () => {
    const first = await request(app).get('/api/todos').query({ limit: 6, page: 1 }).set(auth(siti));
    const second = await request(app).get('/api/todos').query({ limit: 6, page: 2 }).set(auth(siti));

    const ids = [...first.body.data, ...second.body.data].map((t) => t._id);
    expect(ids).toHaveLength(12);
    expect(new Set(ids).size).toBe(12);
  });

  it('halaman di luar jangkauan mengembalikan data kosong', async () => {
    const res = await request(app).get('/api/todos').query({ page: 99 }).set(auth(siti));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('GET /api/todos: filter, sort, search', () => {
  it('memfilter berdasarkan status dan priority', async () => {
    await seed(siti, [
      { title: 'A', status: 'pending', priority: 'high' },
      { title: 'B', status: 'done', priority: 'high' },
      { title: 'C', status: 'done', priority: 'low' },
    ]);

    const byStatus = await request(app).get('/api/todos').query({ status: 'done' }).set(auth(siti));
    const both = await request(app)
      .get('/api/todos')
      .query({ status: 'done', priority: 'high' })
      .set(auth(siti));

    expect(byStatus.body.pagination.totalItems).toBe(2);
    expect(both.body.pagination.totalItems).toBe(1);
    expect(both.body.data[0].title).toBe('B');
  });

  it('memfilter berdasarkan kategori', async () => {
    const category = await Category.create({ user: siti.id, name: 'Kampus' });
    await seed(siti, [
      { title: 'A', category: category.id },
      { title: 'B' },
    ]);

    const res = await request(app).get('/api/todos').query({ category: category.id }).set(auth(siti));

    expect(res.body.pagination.totalItems).toBe(1);
    expect(res.body.data[0].title).toBe('A');
  });

  it('mengurutkan berdasarkan judul', async () => {
    await seed(siti, [{ title: 'Cherry' }, { title: 'Apel' }, { title: 'Banana' }]);

    const asc = await request(app)
      .get('/api/todos')
      .query({ sortBy: 'title', order: 'asc' })
      .set(auth(siti));
    const desc = await request(app)
      .get('/api/todos')
      .query({ sortBy: 'title', order: 'desc' })
      .set(auth(siti));

    expect(asc.body.data.map((t) => t.title)).toEqual(['Apel', 'Banana', 'Cherry']);
    expect(desc.body.data.map((t) => t.title)).toEqual(['Cherry', 'Banana', 'Apel']);
  });

  it('search pada judul dan deskripsi, tidak peduli huruf besar-kecil', async () => {
    await seed(siti, [
      { title: 'Belajar Node.js' },
      { title: 'Belanja bulanan', description: 'Ini penting sekali' },
      { title: 'Olahraga' },
    ]);

    const byTitle = await request(app).get('/api/todos').query({ search: 'BELAJAR' }).set(auth(siti));
    const byDescription = await request(app).get('/api/todos').query({ search: 'penting' }).set(auth(siti));
    const none = await request(app).get('/api/todos').query({ search: 'tidakada' }).set(auth(siti));

    expect(byTitle.body.pagination.totalItems).toBe(1);
    expect(byDescription.body.data[0].title).toBe('Belanja bulanan');
    expect(none.status).toBe(200);
    expect(none.body.data).toEqual([]);
  });

  it.each(['(', '.*', '[', '\\'])('search dengan karakter khusus "%s" tidak menyebabkan error', async (search) => {
    await seed(siti, [{ title: 'Todo biasa' }]);
    const res = await request(app).get('/api/todos').query({ search }).set(auth(siti));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('menggabungkan filter, search, sort, dan pagination', async () => {
    await seed(siti, [
      { title: 'Tugas backend', status: 'pending' },
      { title: 'Tugas akhir', status: 'pending' },
      { title: 'Tugas lama', status: 'done' },
      { title: 'Belanja', status: 'pending' },
    ]);

    const res = await request(app)
      .get('/api/todos')
      .query({ status: 'pending', search: 'tugas', sortBy: 'title', order: 'asc', limit: 1 })
      .set(auth(siti));

    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ totalItems: 2, totalPages: 2, itemsPerPage: 1 });
    expect(res.body.data[0].title).toBe('Tugas akhir');
  });

  it.each([
    ['page', 0],
    ['page', 'abc'],
    ['limit', 500],
    ['status', 'ngasal'],
    ['priority', 'urgent'],
    ['category', 'abc'],
    ['sortBy', 'password'],
    ['order', 'naik'],
  ])('menolak query %s=%s (400)', async (name, value) => {
    const res = await request(app).get('/api/todos').query({ [name]: value }).set(auth(siti));

    expect(res.status).toBe(400);
    expect(errorFields(res)).toContain(name);
  });
});

describe('GET /api/todos/:id', () => {
  let todo;
  beforeEach(async () => {
    [todo] = await seed(siti, [{ title: 'Todo Siti' }]);
  });

  it('pemilik boleh melihat', async () => {
    const res = await request(app).get(`/api/todos/${todo.id}`).set(auth(siti));

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Todo Siti');
  });

  it('admin boleh melihat todo milik orang lain', async () => {
    const res = await request(app).get(`/api/todos/${todo.id}`).set(auth(admin));
    expect(res.status).toBe(200);
  });

  it('user lain tidak boleh melihat (403)', async () => {
    const res = await request(app).get(`/api/todos/${todo.id}`).set(auth(budi));
    expect(res.status).toBe(403);
  });

  it('ID tidak valid (400) dan ID tidak ditemukan (404)', async () => {
    const invalid = await request(app).get('/api/todos/abc').set(auth(siti));
    const missing = await request(app).get(`/api/todos/${MISSING_ID}`).set(auth(siti));

    expect(invalid.status).toBe(400);
    expect(errorFields(invalid)).toContain('id');
    expect(missing.status).toBe(404);
  });
});

describe('PUT /api/todos/:id', () => {
  let todo;
  beforeEach(async () => {
    [todo] = await seed(siti, [{ title: 'Judul lama' }]);
  });

  const put = (user, data, id = todo.id) =>
    request(app).put(`/api/todos/${id}`).set(auth(user)).send(data);

  it('pemilik boleh mengubah', async () => {
    const res = await put(siti, { title: 'Judul baru', priority: 'high' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: 'Judul baru', priority: 'high' });
  });

  it('bisa melepas kategori dengan category: null', async () => {
    const category = await Category.create({ user: siti.id, name: 'Kampus' });
    await put(siti, { category: category.id });
    const res = await put(siti, { category: null });

    expect(res.status).toBe(200);
    expect(res.body.data.category).toBeNull();
  });

  it('user lain dan admin tidak boleh mengubah (403)', async () => {
    const byUser = await put(budi, { title: 'Diubah Budi' });
    const byAdmin = await put(admin, { title: 'Diubah Admin' });

    expect(byUser.status).toBe(403);
    expect(byAdmin.status).toBe(403);
    expect((await Todo.findById(todo.id)).title).toBe('Judul lama');
  });

  it('menolak body kosong (400)', async () => {
    const res = await put(siti, {});
    expect(res.status).toBe(400);
  });

  it('todo tidak ditemukan (404)', async () => {
    const res = await put(siti, { title: 'Judul baru' }, MISSING_ID);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/todos/:id/status', () => {
  let todo;
  beforeEach(async () => {
    [todo] = await seed(siti, [{ title: 'Todo status' }]);
  });

  const patch = (user, data) =>
    request(app).patch(`/api/todos/${todo.id}/status`).set(auth(user)).send(data);

  it('status done mengisi completedAt, kembali ke pending mengosongkannya', async () => {
    const done = await patch(siti, { status: 'done' });
    expect(done.status).toBe(200);
    expect(done.body.data.status).toBe('done');
    expect(done.body.data.completedAt).toBeTruthy();

    const pending = await patch(siti, { status: 'pending' });
    expect(pending.body.data.completedAt).toBeNull();
  });

  it('menolak status tidak valid atau kosong (400)', async () => {
    const invalid = await patch(siti, { status: 'ngasal' });
    const empty = await patch(siti, {});

    expect(invalid.status).toBe(400);
    expect(empty.status).toBe(400);
    expect(errorFields(invalid)).toContain('status');
  });

  it('user lain tidak boleh mengubah status (403)', async () => {
    const res = await patch(budi, { status: 'done' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/todos/:id', () => {
  let todo;
  beforeEach(async () => {
    [todo] = await seed(siti, [{ title: 'Todo dihapus' }]);
  });

  it('pemilik boleh menghapus, setelah itu todo tidak ada lagi', async () => {
    const res = await request(app).delete(`/api/todos/${todo.id}`).set(auth(siti));
    const after = await request(app).get(`/api/todos/${todo.id}`).set(auth(siti));

    expect(res.status).toBe(200);
    expect(after.status).toBe(404);
  });

  it('user lain dan admin tidak boleh menghapus (403), data tetap ada', async () => {
    const byUser = await request(app).delete(`/api/todos/${todo.id}`).set(auth(budi));
    const byAdmin = await request(app).delete(`/api/todos/${todo.id}`).set(auth(admin));

    expect(byUser.status).toBe(403);
    expect(byAdmin.status).toBe(403);
    expect(await Todo.exists({ _id: todo.id })).toBeTruthy();
  });

  it('todo tidak ditemukan (404)', async () => {
    const res = await request(app).delete(`/api/todos/${MISSING_ID}`).set(auth(siti));
    expect(res.status).toBe(404);
  });
});