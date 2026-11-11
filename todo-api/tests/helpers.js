const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

let counter = 0;

// Membuat user lewat endpoint register. Register selalu menghasilkan role 'user',
// jadi role 'admin' diset langsung di database.
const createUser = async ({ name, email, role } = {}) => {
  counter += 1;
  const data = {
    name: name || `User ${counter}`,
    email: email || `user${counter}@example.com`,
    password: 'rahasia123',
  };

  const res = await request(app).post('/api/auth/register').send(data);
  if (res.status !== 201) {
    throw new Error(`Gagal membuat user uji: ${res.status} ${JSON.stringify(res.body)}`);
  }

  if (role) await User.updateOne({ _id: res.body.data.user.id }, { role });

  return { id: res.body.data.user.id, email: data.email, token: res.body.data.token };
};

const auth = (user) => ({ Authorization: `Bearer ${user.token}` });

// Nama field yang gagal validasi pada response 400
const errorFields = (res) => (res.body.errors || []).map((e) => e.field);

module.exports = { createUser, auth, errorFields };