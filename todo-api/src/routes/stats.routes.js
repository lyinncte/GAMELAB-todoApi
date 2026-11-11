const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const checkApiKey = require('../middleware/apiKey.middleware');

// Dilindungi API key, bukan JWT
router.get('/summary', checkApiKey, statsController.getSummary);

module.exports = router;