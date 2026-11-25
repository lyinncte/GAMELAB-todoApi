const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  
  // Body JSON rusak (misal koma berlebih)
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Format JSON pada body tidak valid';
  }

  // Mongoose: field tidak lolos aturan schema
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Mongoose: format ID tidak valid
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Nilai tidak valid untuk field "${err.path}": ${err.value}`;
  }

  // MongoDB: data unik sudah dipakai
  if (err.code === 11000) {
    statusCode = 409;
    message = `Data duplikat pada field: ${Object.keys(err.keyValue).join(', ')}`;
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token tidak valid';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token sudah kedaluwarsa, silakan login ulang';
  }

  // baris pengecekan error 500:
  // Error tak terduga: jangan bocorkan detail ke client di production
  if (statusCode >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      message = 'Terjadi kesalahan pada server';
    }
  }
// bagian res.json:
stack: process.env.NODE_ENV === 'development' && !process.env.VERCEL ? err.stack : undefined,

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors, // daftar kesalahan per field (dari validasi)
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  
};

module.exports = errorHandler;