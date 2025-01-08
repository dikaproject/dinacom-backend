const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const { 
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultation,
  getAllConsultationsByDoctor,
  getAllConsultationsAdmin,
  getPendingConsultation,
  cancelConsultation
} = require('../controllers/consultationController');


router.get('/pending', authMiddleware, getPendingConsultation);
router.post('/:id/cancel', authMiddleware, cancelConsultation);

router.post('/', authMiddleware, createConsultation);
router.get('/', authMiddleware, getConsultations);
router.get('/doctor', authMiddleware, checkRole(['DOCTOR']), getAllConsultationsByDoctor);
router.get('/admin', authMiddleware, checkRole(['ADMIN']), getAllConsultationsAdmin);
router.get('/:id', authMiddleware, getConsultationById);
router.put('/:id', authMiddleware, checkRole(['DOCTOR']), updateConsultation);


module.exports = router;