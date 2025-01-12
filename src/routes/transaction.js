const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { 
    createTransaction,
    getTransaction,
    cancelTransaction
} = require('../controllers/transactionController');

router.get('/', authMiddleware, getTransaction);
router.post('/midtrans', authMiddleware, createTransaction);
router.post('/:id/cancel', authMiddleware, cancelTransaction);

module.exports = router;
