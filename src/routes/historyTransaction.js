const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const { getTransactionHistory } = require('../controllers/historyTransactionController');

router.get('/', authMiddleware, getTransactionHistory);

module.exports = router;