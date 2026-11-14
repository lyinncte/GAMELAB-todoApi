const mongoose = require('mongoose');
const app = require('../src/app');
require('../src/models/User');
require('../src/models/Category');
require('../src/models/Todo');
require('../src/models/ActivityLog');

let connecting = null;

async function ensureDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .catch((err) => {
        connecting = null;
        throw err;
      });
  }
  await connecting;
}

module.exports = async (req, res) => {
  try {
    await ensureDB();
  } catch (err) {
    console.error('Koneksi MongoDB gagal:', err.message);
    return res
      .status(500)
      .json({ success: false, message: 'Koneksi database gagal' });
  }
  return app(req, res);
};