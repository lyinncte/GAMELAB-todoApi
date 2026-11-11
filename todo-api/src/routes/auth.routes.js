const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', authValidator.register, validate, authController.register);
router.post('/login', authValidator.login, validate, authController.login);
router.get('/me', protect, authController.me);

module.exports = router;