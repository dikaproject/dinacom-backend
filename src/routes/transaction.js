const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { createTransaction } = require('../controllers/transactionController');

const router = express.Router();

router.post('/transactions', authMiddleware, createTransaction);

module.exports = router;
