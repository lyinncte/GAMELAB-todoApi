const request = require('supertest');
const app = require('../src/app');
const Todo = require('../src/models/Todo');
const Category = require('../src/models/Category');
const { createUser, auth } = require('./helpers');

const URL = '/api/stats/summary';
const withKey = () => ({ 'x-api-key': process.env.EXTERNAL_API_KEY });
const PAST = new Date('2020-01-01');

describe('proteksi API key', () => {
  it('menolak request tanpa key (401)', async () => {
    const res = await request(app).get(URL);

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('API key tidak ditemukan');
  });

  it('menolak key yang salah (401)', async () => {
    const res = await request(app).get(URL).set('x-api-key', 'kunci-ngasal');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('API key tidak valid');
  });

  it('menolak key yang dikirim lewat URL (401)', async () => {
    const res = await request(app).get(URL).query({ 'x-api-key': process.env.EXTERNAL_API_KEY });
    expect(res.status).toBe(401);
  });

  it('token JWT tidak berlaku di endpoint ini (401)', async () => {
    const user = await createUser();
    const res = await request(app).get(URL).set(auth(user));

    expect(res.status).toBe(401);
  });

  it('endpoint hanya menerima GET (404 untuk POST)', async () => {
    const res = await request(app).post(URL).set(withKey()).send({});
    expect(res.status).toBe(404);
  });

  it('menolak semua request bila key belum dikonfigurasi di server (500)', async () => {
    const original = process.env.EXTERNAL_API_KEY;
    delete process.env.EXTERNAL_API_KEY;

    try {
      const res = await request(app).get(URL).set('x-api-key', 'apa-saja');
      expect(res.status).toBe(500);
    } finally {
      process.env.EXTERNAL_API_KEY = original;
    }
  });
});

describe('GET /api/stats/summary', () => {
  it('mengembalikan angka nol saat database kosong', async () => {
    const res = await request(app).get(URL).set(withKey());

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      users: 0,
      categories: 0,
      todos: {
        total: 0,
        byStatus: { pending: 0, in_progress: 0, done: 0 },
        byPriority: { low: 0, medium: 0, high: 0 },
        overdue: 0,
        completionRate: 0,
      },
      activity: { total: 0, last7Days: 0 },
    });
    expect(res.body.data.generatedAt).toEqual(expect.any(String));
  });

  it('menghitung statistik dengan benar', async () => {
    const siti = await createUser({ name: 'Siti' });
    await Category.create({ user: siti.id, name: 'Kampus' });
    await Todo.insertMany([
      { user: siti.id, title: 'A', status: 'pending', priority: 'high', dueDate: PAST },
      { user: siti.id, title: 'B', status: 'done', priority: 'low' },
      { user: siti.id, title: 'C', status: 'in_progress', priority: 'low' },
      { user: siti.id, title: 'D', status: 'done', priority: 'medium', dueDate: PAST },
    ]);

    const res = await request(app).get(URL).set(withKey());

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      users: 1,
      categories: 1,
      todos: {
        total: 4,
        byStatus: { pending: 1, in_progress: 1, done: 2 },
        byPriority: { low: 2, medium: 1, high: 1 },
        overdue: 1, // hanya A: lewat jatuh tempo dan belum selesai
        completionRate: 50,
      },
    });
  });

  it('angka ikut berubah ketika todo dibuat lewat API', async () => {
    const siti = await createUser();
    const before = (await request(app).get(URL).set(withKey())).body.data;

    await request(app).post('/api/todos').set(auth(siti)).send({ title: 'Tes statistik' });

    const after = (await request(app).get(URL).set(withKey())).body.data;

    expect(after.todos.total).toBe(before.todos.total + 1);
    expect(after.todos.byStatus.pending).toBe(before.todos.byStatus.pending + 1);
    expect(after.activity.total).toBe(before.activity.total + 1);
  });
});