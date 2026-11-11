const crypto = require('crypto');
const AppError = require('../utils/AppError');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest();

// Kedua nilai di-hash dulu supaya panjangnya sama, lalu dibandingkan
// dengan waktu konstan (tidak membocorkan seberapa mirip tebakan)
const isSameKey = (provided, expected) =>
  crypto.timingSafeEqual(sha256(provided), sha256(expected));

const checkApiKey = (req, res, next) => {
  const expected = process.env.EXTERNAL_API_KEY;
  if (!expected) {
    return next(new AppError('API key belum dikonfigurasi di server', 500));
  }

  const provided = req.headers['x-api-key'];
  if (!provided || typeof provided !== 'string') {
    return next(new AppError("API key tidak ditemukan. Kirim lewat header 'x-api-key'", 401));
  }

  if (!isSameKey(provided, expected)) {
    return next(new AppError('API key tidak valid', 401));
  }

  next();
};

module.exports = checkApiKey;