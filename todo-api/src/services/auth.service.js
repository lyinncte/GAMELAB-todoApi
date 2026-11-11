const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email sudah terdaftar', 409);

  // role tidak diambil dari input, selalu 'user'
  const user = await User.create({ name, email, password });
  return { user, token: generateToken(user._id) };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  // Pesan sengaja sama untuk email salah dan password salah
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Email atau password salah', 401);
  }

  return { user, token: generateToken(user._id) };
};

module.exports = { register, login };