const request = require('supertest');
const app = require('../src/app');
const Category = require('../src/models/Category');
const Todo = require('../src/models/Todo');
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

const postCategory = (user, data) =>
  request(app).post('/api/categories').set(auth(user)).send(data);

describe('POST /api/categories', () => {
  it('membuat kategori milik user yang login', async () => {
    const res = await postCategory(siti, { name: 'Kuliah', color: '#e67e22' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: 'Kuliah', color: '#e67e22', user: siti.id });
  });

  it('menolak request tanpa token (401)', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'Kuliah' });
    expect(res.status).toBe(401);
  });

  it('menolak nama kembar pada user yang sama (409)', async () => {
    await postCategory(siti, { name: 'Kuliah' });
    const res = await postCategory(siti, { name: 'Kuliah' });

    expect(res.status).toBe(409);
  });

  it('mengizinkan nama yang sama pada user berbeda', async () => {
    await postCategory(siti, { name: 'Kuliah' });
    const res = await postCategory(budi, { name: 'Kuliah' });

    expect(res.status).toBe(201);
  });

  it.each([
    ['name', {}],
    ['name', { name: 'x'.repeat(51) }],
    ['color', { name: 'Tes', color: 'merah' }],
  ])('menolak input tidak valid pada field %s', async (field, data) => {
    const res = await postCategory(siti, data);

    expect(res.status).toBe(400);
    expect(errorFields(res)).toContain(field);
  });

  it('menolak JSON yang rusak (400)', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set(auth(siti))
      .set('Content-Type', 'application/json')
      .send('{ "name": "Tes", }');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Format JSON pada body tidak valid');
  });
});

describe('GET /api/categories', () => {
  beforeEach(async () => {
    await Category.create([
      { user: siti.id, name: 'Kuliah' },
      { user: budi.id, name: 'Kerja' },
    ]);
  });

  it('user hanya melihat kategori miliknya', async () => {
    const res = await request(app).get('/api/categories').set(auth(siti));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Kuliah');
  });

  it('admin melihat semua kategori', async () => {
    const res = await request(app).get('/api/categories').set(auth(admin));
    expect(res.body.data).toHaveLength(2);
  });

  it('detail: pemilik dan admin boleh, user lain 403', async () => {
    const [category] = await Category.find({ user: siti.id });

    const owner = await request(app).get(`/api/categories/${category.id}`).set(auth(siti));
    const byAdmin = await request(app).get(`/api/categories/${category.id}`).set(auth(admin));
    const other = await request(app).get(`/api/categories/${category.id}`).set(auth(budi));

    expect(owner.status).toBe(200);
    expect(byAdmin.status).toBe(200);
    expect(other.status).toBe(403);
  });
});

describe('PUT /api/categories/:id', () => {
  let category;
  beforeEach(async () => {
    category = await Category.create({ user: siti.id, name: 'Kuliah' });
  });

  const put = (user, data, id = category.id) =>
    request(app).put(`/api/categories/${id}`).set(auth(user)).send(data);

  it('pemilik boleh mengubah', async () => {
    const res = await put(siti, { name: 'Kampus' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Kampus');
  });

  it('user lain dan admin tidak boleh mengubah (403)', async () => {
    const byUser = await put(budi, { name: 'Diubah Budi' });
    const byAdmin = await put(admin, { name: 'Diubah Admin' });

    expect(byUser.status).toBe(403);
    expect(byAdmin.status).toBe(403);
    expect((await Category.findById(category.id)).name).toBe('Kuliah');
  });

  it('menolak mengganti nama menjadi nama kategori lain milik sendiri (409)', async () => {
    await Category.create({ user: siti.id, name: 'Rumah' });
    const res = await put(siti, { name: 'Rumah' });

    expect(res.status).toBe(409);
  });

  it('menolak body kosong (400) dan ID yang tidak ditemukan (404)', async () => {
    const empty = await put(siti, {});
    const missing = await put(siti, { name: 'Baru' }, MISSING_ID);

    expect(empty.status).toBe(400);
    expect(missing.status).toBe(404);
  });
});

describe('DELETE /api/categories/:id', () => {
  let category;
  beforeEach(async () => {
    category = await Category.create({ user: siti.id, name: 'Kuliah' });
  });

  it('menghapus kategori, todo yang memakainya tetap ada dengan category null', async () => {
    const todo = await Todo.create({ user: siti.id, title: 'Tugas', category: category.id });

    const res = await request(app).delete(`/api/categories/${category.id}`).set(auth(siti));

    expect(res.status).toBe(200);
    expect(await Category.exists({ _id: category.id })).toBeNull();

    const after = await Todo.findById(todo.id);
    expect(after).not.toBeNull();
    expect(after.category).toBeNull();
  });

  it('user lain dan admin tidak boleh menghapus (403)', async () => {
    const byUser = await request(app).delete(`/api/categories/${category.id}`).set(auth(budi));
    const byAdmin = await request(app).delete(`/api/categories/${category.id}`).set(auth(admin));

    expect(byUser.status).toBe(403);
    expect(byAdmin.status).toBe(403);
    expect(await Category.exists({ _id: category.id })).toBeTruthy();
  });
});