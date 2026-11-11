const { body } = require('express-validator');
const { requiredString, optionalString, idParam, atLeastOneField } = require('./helpers');

const color = body('color')
  .optional()
  .isString().withMessage('Warna harus berupa teks').bail()
  .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  .withMessage('Warna harus berformat hex, contoh: #e67e22');

const createCategory = [requiredString('name', 'Nama kategori', { max: 50 }), color];

const updateCategory = [
  idParam,
  optionalString('name', 'Nama kategori', { min: 1, max: 50 }),
  color,
  atLeastOneField,
];

const byId = [idParam];

module.exports = { createCategory, updateCategory, byId };