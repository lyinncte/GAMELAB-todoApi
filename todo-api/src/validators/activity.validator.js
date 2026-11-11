const { query } = require('express-validator');

const ACTIONS = ['create', 'update', 'delete', 'complete'];

const q = (name) =>
  query(name).optional().isString().withMessage(`${name} harus berupa teks`).bail();

const getLogs = [
  q('page').isInt({ min: 1, max: 100000 }).withMessage('page harus bilangan bulat minimal 1'),
  q('limit').isInt({ min: 1, max: 100 }).withMessage('limit harus bilangan bulat antara 1 sampai 100'),
  q('action').isIn(ACTIONS).withMessage(`action harus salah satu dari: ${ACTIONS.join(', ')}`),
  q('todo').isMongoId().withMessage('Format ID todo tidak valid'),
];

module.exports = { getLogs };