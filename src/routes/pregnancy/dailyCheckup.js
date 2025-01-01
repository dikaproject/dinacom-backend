const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { createDailyCheckup, getLogs } = require('../../controllers/pregnancy/dailyCheckupController');

router.post('/', authMiddleware, createDailyCheckup);
router.get('/', authMiddleware, getLogs);

module.exports = router;