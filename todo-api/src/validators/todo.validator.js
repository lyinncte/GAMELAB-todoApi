const { body, query } = require('express-validator');
const { requiredString, optionalString, idParam, atLeastOneField } = require('./helpers');

const STATUSES = ['pending', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];
const SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'dueDate'];

const statusIn = (chain) =>
  chain.isIn(STATUSES).withMessage(`Status harus salah satu dari: ${STATUSES.join(', ')}`);

const commonFields = [
  optionalString('description', 'Deskripsi', { max: 500 }),
  body('category')
    .optional({ values: 'null' })
    .isMongoId().withMessage('Format ID kategori tidak valid'),
  statusIn(body('status').optional()),
  body('priority')
    .optional()
    .isIn(PRIORITIES).withMessage(`Priority harus salah satu dari: ${PRIORITIES.join(', ')}`),
  body('dueDate')
    .optional({ values: 'null' })
    .isISO8601({ strict: true }).withMessage('dueDate harus berformat tanggal, contoh: 2026-12-31')
    .toDate(),
];

const createTodo = [requiredString('title', 'Judul', { min: 3, max: 100 }), ...commonFields];

const updateTodo = [
  idParam,
  optionalString('title', 'Judul', { min: 3, max: 100 }),
  ...commonFields,
  atLeastOneField,
];

const updateStatus = [
  idParam,
  statusIn(body('status').notEmpty().withMessage('Status wajib diisi').bail()),
];

const byId = [idParam];

// Query opsional bertipe teks (menolak ?status=a&status=b yang menjadi array)
const q = (name) =>
  query(name).optional().isString().withMessage(`${name} harus berupa teks`).bail();

const getTodos = [
  q('page').isInt({ min: 1, max: 100000 }).withMessage('page harus bilangan bulat minimal 1'),
  q('limit').isInt({ min: 1, max: 100 }).withMessage('limit harus bilangan bulat antara 1 sampai 100'),
  q('status').isIn(STATUSES).withMessage(`status harus salah satu dari: ${STATUSES.join(', ')}`),
  q('priority').isIn(PRIORITIES).withMessage(`priority harus salah satu dari: ${PRIORITIES.join(', ')}`),
  q('category').isMongoId().withMessage('Format ID kategori tidak valid'),
  q('search').isLength({ max: 100 }).withMessage('search maksimal 100 karakter'),
  q('sortBy').isIn(SORT_FIELDS).withMessage(`sortBy harus salah satu dari: ${SORT_FIELDS.join(', ')}`),
  q('order').isIn(['asc', 'desc']).withMessage("order harus 'asc' atau 'desc'"),
];

module.exports = { createTodo, updateTodo, updateStatus, byId, getTodos };