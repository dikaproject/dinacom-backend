const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const { 
  addSchedule, 
  updateSchedule, 
  getSchedules,
  getAvailableSchedules,
  getAllDoctors
} = require('../controllers/DoctorScheduleController');

// Important: Move doctors route before :doctorId routes to prevent path conflicts
router.get('/doctors', getAllDoctors);
router.post('/create', authMiddleware, checkRole(['DOCTOR']), addSchedule);
router.put('/update', authMiddleware, checkRole(['DOCTOR']), updateSchedule);
router.get('/doctor/:doctorId/schedules', getAvailableSchedules);
router.get('/:doctorId', getSchedules);

module.exports = router;