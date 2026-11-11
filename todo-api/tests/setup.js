require('dotenv').config({ path: '.env.test', quiet: true });

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Todo = require('../src/models/Todo');
const ActivityLog = require('../src/models/ActivityLog');

let mongoServer;

// Logger mencetak satu baris per request; dimatikan supaya output tes bersih
jest.spyOn(console, 'log').mockImplementation(() => {});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  // Pastikan index unik (email, nama kategori per user) sudah terbentuk
  await Promise.all([User.init(), Category.init(), Todo.init(), ActivityLog.init()]);
}, 300000); // run pertama bisa lama karena mengunduh MongoDB

// Setiap tes mulai dari database kosong
afterEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});