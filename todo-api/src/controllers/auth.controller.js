const authService = require('../services/auth.service');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Nama, email, dan password wajib diisi', 400);
  }
  if ([name, email, password].some((v) => typeof v !== 'string')) {
    throw new AppError('Input harus berupa teks', 400);
  }

  const { user, token } = await authService.register({
    name,
    email: email.trim().toLowerCase(),
    password,
  });

  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil',
    data: { user: formatUser(user), token },
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email dan password wajib diisi', 400);
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new AppError('Input harus berupa teks', 400);
  }

  const { user, token } = await authService.login({
    email: email.trim().toLowerCase(),
    password,
  });

  res.status(200).json({
    success: true,
    message: 'Login berhasil',
    data: { user: formatUser(user), token },
  });
});

const me = catchAsync(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Profil berhasil diambil',
    data: { user: formatUser(req.user) },
  });
});

module.exports = { register, login, me };

