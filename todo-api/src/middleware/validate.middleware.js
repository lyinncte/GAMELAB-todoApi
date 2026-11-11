const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const error = new AppError('Validasi gagal', 400);
  error.errors = result.array().map((e) => ({
    field: e.path || 'body',
    message: e.msg,
  }));
  next(error);
};

module.exports = validate;