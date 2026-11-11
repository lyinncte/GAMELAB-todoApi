
const AppError = require('../utils/AppError');

const restrictTo = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new AppError('Anda tidak punya izin untuk aksi ini', 403));
  }
  next();
};

module.exports = restrictTo;