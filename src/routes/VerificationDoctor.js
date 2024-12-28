const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const { getPendingDoctors, verifyDoctor } = require('../controllers/VerificationDoctorController');

router.get('/pending', authMiddleware, checkRole(['ADMIN']), getPendingDoctors);
router.post('/:doctorId/verify', authMiddleware, checkRole(['ADMIN']), verifyDoctor);

module.exports = router;