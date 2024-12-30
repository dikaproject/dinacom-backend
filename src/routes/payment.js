const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const { paymentUpload } = require('../middleware/upload');
const {
  createPayment,
  uploadPaymentProof,
  verifyManualPayment,
  createMidtransPayment,
  handleMidtransNotification
} = require('../controllers/PaymentController');

router.post('/', authMiddleware, createPayment);
router.post('/:paymentId/proof', 
  authMiddleware, 
  paymentUpload.single('paymentProof'), 
  uploadPaymentProof
);
router.post('/:paymentId/verify', authMiddleware, checkRole(['DOCTOR']), verifyManualPayment);
router.post('/midtrans', authMiddleware, createMidtransPayment);
router.post('/midtrans/notification', handleMidtransNotification);

module.exports = router;