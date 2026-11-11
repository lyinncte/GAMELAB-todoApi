const { body, param } = require('express-validator');

// Field teks wajib: tidak boleh kosong, harus string, panjang dibatasi
const requiredString = (field, label, { min = 1, max = 100 } = {}) =>
  body(field)
    .notEmpty().withMessage(`${label} wajib diisi`).bail()
    .isString().withMessage(`${label} harus berupa teks`).bail()
    .trim()
    .isLength({ min, max }).withMessage(`${label} harus antara ${min} sampai ${max} karakter`);

// Field teks opsional: kalau dikirim, aturannya tetap berlaku
const optionalString = (field, label, { min = 0, max = 500 } = {}) =>
  body(field)
    .optional()
    .isString().withMessage(`${label} harus berupa teks`).bail()
    .trim()
    .isLength({ min, max }).withMessage(`${label} harus antara ${min} sampai ${max} karakter`);

const idParam = param('id').isMongoId().withMessage('Format ID tidak valid');

// Untuk endpoint update: body tidak boleh kosong
const atLeastOneField = body().custom((value) => {
  if (!value || typeof value !== 'object' || Object.keys(value).length === 0) {
    throw new Error('Minimal satu field harus diisi');
  }
  return true;
});

module.exports = { requiredString, optionalString, idParam, atLeastOneField };