const { body } = require('express-validator');
const { requiredString } = require('./helpers');

const emailField = body('email')
  .notEmpty().withMessage('Email wajib diisi').bail()
  .isString().withMessage('Email harus berupa teks').bail()
  .trim()
  .isEmail().withMessage('Format email tidak valid').bail()
  .toLowerCase();

const register = [
  requiredString('name', 'Nama', { max: 100 }),
  emailField,
  body('password')
    .notEmpty().withMessage('Password wajib diisi').bail()
    .isString().withMessage('Password harus berupa teks').bail()
    .isLength({ min: 6, max: 72 }).withMessage('Password harus antara 6 sampai 72 karakter'),
];

const login = [
  emailField,
  body('password')
    .notEmpty().withMessage('Password wajib diisi').bail()
    .isString().withMessage('Password harus berupa teks'),
];

module.exports = { register, login };