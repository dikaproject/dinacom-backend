const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const { 
  getDoctorProfile,
  updateConsultationFee,
  getDoctorStatistics,
  getDoctorAppointments,
  updateDoctorProfile,
  updateDoctorSchedule
} = require('../controllers/doctorController');

router.get('/profile', authMiddleware, checkRole(['DOCTOR']), getDoctorProfile);
router.put('/consultation-fee', authMiddleware, checkRole(['DOCTOR']), updateConsultationFee);
router.get('/statistics', authMiddleware, checkRole(['DOCTOR']), getDoctorStatistics);
router.get('/appointments', authMiddleware, checkRole(['DOCTOR']), getDoctorAppointments);
router.put('/profile', authMiddleware, checkRole(['DOCTOR']), updateDoctorProfile);
router.put('/schedules', authMiddleware, checkRole(['DOCTOR']), updateDoctorSchedule);

module.exports = router;