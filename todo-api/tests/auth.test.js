const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const { createUser, auth, errorFields } = require('./helpers');

const body = { name: 'Budi', email: 'budi@example.com', password: 'rahasia123' };

describe('POST /api/auth/register', () => {
  it('mendaftarkan user baru dan mengembalikan token', async () => {
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ name: 'Budi', email: 'budi@example.com', role: 'user' });
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('menyimpan password dalam bentuk hash', async () => {
    await request(app).post('/api/auth/register').send(body);
    const user = await User.findOne({ email: body.email }).select('+password');

    expect(user.password).not.toBe(body.password);
    expect(user.password).toMatch(/^\$2[aby]\$10\$/);
  });

  it('mengabaikan role dari input (tidak bisa mendaftar sebagai admin)', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...body, role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('user');
  });

  it('menormalkan email ke huruf kecil', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...body, email: 'Budi@Example.COM' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('budi@example.com');
  });

  it('menolak email yang sudah terdaftar (409), termasuk beda huruf besar-kecil', async () => {
    await request(app).post('/api/auth/register').send(body);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...body, email: 'BUDI@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email sudah terdaftar');
  });

  it('menolak body kosong dan melaporkan semua field yang salah', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validasi gagal');
    expect(errorFields(res)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it.each([
    ['email', { email: 'bukan-email' }],
    ['password', { password: '123' }],
    ['name', { name: 123 }],
  ])('menolak %s yang tidak valid', async (field, override) => {
    const res = await request(app).post('/api/auth/register').send({ ...body, ...override });

    expect(res.status).toBe(400);
    expect(errorFields(res)).toContain(field);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(body);
  });

  it('login berhasil dan mengembalikan token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: body.email, password: body.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('password salah dan email tidak terdaftar memberi pesan yang sama (401)', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: body.email, password: 'salah-total' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tidakada@example.com', password: body.password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe('Email atau password salah');
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it('menolak input berbentuk objek (NoSQL injection)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: 'x' });

    expect(res.status).toBe(400);
    expect(errorFields(res)).toContain('email');
  });

  it('menolak body kosong', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(errorFields(res)).toEqual(expect.arrayContaining(['email', 'password']));
  });
});

describe('GET /api/auth/me (middleware protect)', () => {
  it('mengembalikan profil untuk token yang valid', async () => {
    const user = await createUser({ name: 'Siti' });
    const res = await request(app).get('/api/auth/me').set(auth(user));

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ name: 'Siti', email: user.email });
  });

  it('menolak request tanpa token (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('menolak token palsu (401)', async () => {
    const res = await request(app).get('/api/auth/me').set({ Authorization: 'Bearer abc123' });
    expect(res.status).toBe(401);
  });

  it('menolak token yang ditandatangani dengan secret lain (401)', async () => {
    const user = await createUser();
    const forged = jwt.sign({ id: user.id }, 'secret-orang-lain');
    const res = await request(app).get('/api/auth/me').set({ Authorization: `Bearer ${forged}` });

    expect(res.status).toBe(401);
  });

  it('menolak token yang sudah kedaluwarsa (401)', async () => {
    const user = await createUser();
    const expired = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = await request(app).get('/api/auth/me').set({ Authorization: `Bearer ${expired}` });

    expect(res.status).toBe(401);
  });

  it('menolak token milik user yang sudah dihapus (401)', async () => {
    const user = await createUser();
    await User.deleteOne({ _id: user.id });
    const res = await request(app).get('/api/auth/me').set(auth(user));

    expect(res.status).toBe(401);
  });
});