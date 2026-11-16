const request = require('supertest');
const app = require('../src/app');
const ActivityLog = require('../src/models/ActivityLog');
const { createUser, auth, errorFields } = require('./helpers');

let siti;
let budi;
let admin;

beforeEach(async () => {
  siti = await createUser({ name: 'Siti' });
  budi = await createUser({ name: 'Budi' });
  admin = await createUser({ name: 'Admin', role: 'admin' });
});

const postTodo = (user, data) => request(app).post('/api/todos').set(auth(user)).send(data);
const getLogs = (user, query = {}) =>
  request(app).get('/api/activity-logs').query(query).set(auth(user));

describe('pencatatan otomatis', () => {
  it('mencatat pembuatan todo', async () => {
    await postTodo(siti, { title: 'Tes activity log' });
    const res = await getLogs(siti);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      action: 'create',
      todoTitle: 'Tes activity log',
      description: 'Membuat todo "Tes activity log"',
    });
  });

  it('mencatat perubahan todo beserta field yang berubah', async () => {
    const created = await postTodo(siti, { title: 'Judul lama' });
    await request(app)
      .put(`/api/todos/${created.body.data._id}`)
      .set(auth(siti))
      .send({ title: 'Judul baru', priority: 'high' });

    const res = await getLogs(siti);

    expect(res.body.data[0].action).toBe('update');
    expect(res.body.data[0].description).toContain('(field: title, priority)');
    expect(res.body.data[1].action).toBe('create'); // yang terbaru di atas
  });

  it('status completed dicatat sebagai complete, kembali ke pending dicatat sebagai update', async () => {
    const created = await postTodo(siti, { title: 'Todo status' });
    const id = created.body.data._id;
    const patch = (status) =>
      request(app).patch(`/api/todos/${id}/status`).set(auth(siti)).send({ status });

    await patch('completed');
    expect((await getLogs(siti)).body.data[0].action).toBe('complete');

    await patch('pending');
    expect((await getLogs(siti)).body.data[0].action).toBe('update');
  });

  it('mencatat penghapusan dan judul tetap tersimpan setelah todo hilang', async () => {
    const created = await postTodo(siti, { title: 'Akan dihapus' });
    await request(app).delete(`/api/todos/${created.body.data._id}`).set(auth(siti));

    const res = await getLogs(siti);

    expect(res.body.data[0]).toMatchObject({ action: 'delete', todoTitle: 'Akan dihapus' });
  });

  it('aksi yang gagal tidak dicatat', async () => {
    const created = await postTodo(siti, { title: 'Todo milik Siti' });
    const before = await ActivityLog.countDocuments();

    const invalid = await postTodo(siti, { title: 'ab' }); // 400
    const forbidden = await request(app)
      .put(`/api/todos/${created.body.data._id}`)
      .set(auth(budi))
      .send({ title: 'Diubah Budi' }); // 403

    expect(invalid.status).toBe(400);
    expect(forbidden.status).toBe(403);
    expect(await ActivityLog.countDocuments()).toBe(before);
  });
});

describe('GET /api/activity-logs', () => {
  it('menolak request tanpa token (401)', async () => {
    const res = await request(app).get('/api/activity-logs');
    expect(res.status).toBe(401);
  });

  it('user hanya melihat log miliknya, admin melihat semua', async () => {
    await postTodo(siti, { title: 'Todo Siti' });
    await postTodo(budi, { title: 'Todo Budi' });

    const bySiti = await getLogs(siti);
    const byAdmin = await getLogs(admin);

    expect(bySiti.body.data).toHaveLength(1);
    expect(bySiti.body.data[0].todoTitle).toBe('Todo Siti');
    expect(byAdmin.body.data).toHaveLength(2);
    expect(byAdmin.body.data[0].user).toHaveProperty('email');
  });

  it('memfilter berdasarkan action', async () => {
    const created = await postTodo(siti, { title: 'Todo filter' });
    await request(app).delete(`/api/todos/${created.body.data._id}`).set(auth(siti));

    const res = await getLogs(siti, { action: 'delete' });

    expect(res.body.pagination.totalItems).toBe(1);
    expect(res.body.data[0].action).toBe('delete');
  });

  it('mendukung pagination', async () => {
    for (let i = 1; i <= 3; i += 1) await postTodo(siti, { title: `Todo ke-${i}` });

    const res = await getLogs(siti, { limit: 2 });

    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({ totalItems: 3, totalPages: 2, hasNextPage: true });
  });

  it.each([
    ['action', 'ngasal'],
    ['limit', 500],
    ['page', 0],
    ['todo', 'abc'],
  ])('menolak query %s=%s (400)', async (name, value) => {
    const res = await getLogs(siti, { [name]: value });

    expect(res.status).toBe(400);
    expect(errorFields(res)).toContain(name);
  });
});