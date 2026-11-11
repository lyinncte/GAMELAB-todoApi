const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const activityValidator = require('../validators/activity.validator');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', activityValidator.getLogs, validate, activityController.getLogs);

module.exports = router;