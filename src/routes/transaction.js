const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { 
    createTransaction,
    handleMidtransNotification, 
    getTransaction
} = require('../controllers/transactionController');

router.get('/', authMiddleware, getTransaction);
router.post('/midtrans', authMiddleware, createTransaction);
router.post('/midtrans/notification', handleMidtransNotification);

module.exports = router;
