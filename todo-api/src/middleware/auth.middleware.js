const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  // Token dikirim lewat header: Authorization: Bearer <token>
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Anda belum login. Silakan login terlebih dahulu', 401);
  }

  const token = header.split(' ')[1];

  // Jika token palsu/kedaluwarsa, jwt.verify melempar error
  // yang diterjemahkan jadi 401 oleh errorHandler
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('User pemilik token ini sudah tidak ada', 401);
  }

  req.user = user; // dipakai middleware dan controller berikutnya
  next();
});

module.exports = { protect };