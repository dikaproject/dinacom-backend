const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware, checkRole } = require('../middleware/auth');
const { 
  getDoctorProfile,
  updateConsultationFee,
  getDoctorStatistics,
  getDoctorAppointments,
  updateDoctorProfile,
  updateDoctorSchedule,
  getDoctors,
  getWeeklyActivity,
  getPatients,
} = require('../controllers/doctorController');

router.get('/patients', authMiddleware, checkRole(['DOCTOR']), getPatients);
router.get('/profile', authMiddleware, checkRole(['DOCTOR']), getDoctorProfile);
router.put('/consultation-fee', authMiddleware, checkRole(['DOCTOR']), updateConsultationFee);
router.get('/statistics', authMiddleware, checkRole(['DOCTOR']), getDoctorStatistics);
router.get('/appointments', authMiddleware, checkRole(['DOCTOR']), getDoctorAppointments);
router.put('/profile', authMiddleware, checkRole(['DOCTOR']), updateDoctorProfile);
router.put('/schedules', authMiddleware, checkRole(['DOCTOR']), updateDoctorSchedule);
router.get('/doctors', getDoctors);
router.get('/weekly-activity', authMiddleware, checkRole(['DOCTOR']), getWeeklyActivity);
router.get('/schedules/:doctorId/available', authMiddleware, async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        schedules: true,
        consultations: {
          where: {
            schedule: {
              gte: new Date(`${date}T00:00:00Z`),
              lt: new Date(`${date}T23:59:59Z`)
            }
          }
        }
      }
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get day of week (0-6, where 0 is Sunday)
    const dayOfWeek = new Date(date).getDay();
    
    // Find schedule for this day
    const schedule = doctor.schedules.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!schedule) {
      return res.json({ timeSlots: [] });
    }

    // Generate time slots
    const startTime = new Date(`${date}T${schedule.startTime}`);
    const endTime = new Date(`${date}T${schedule.endTime}`);
    const slots = [];
    const slotDuration = 30; // 30 minutes per slot

    for (
      let time = startTime; 
      time < endTime; 
      time = new Date(time.getTime() + slotDuration * 60000)
    ) {
      const timeString = time.toTimeString().slice(0, 5);
      const isPassed = new Date() > time;
      const isBooked = doctor.consultations.some(c => 
        new Date(c.schedule).toTimeString().slice(0, 5) === timeString
      );

      slots.push({
        time: timeString,
        isAvailable: !isPassed && !isBooked,
        reason: isPassed ? 'PASSED' : isBooked ? 'BOOKED' : undefined
      });
    }

    res.json({ timeSlots: slots });
  } catch (error) {
    console.error('Get available schedules error:', error);
    res.status(500).json({ message: 'Failed to fetch schedules' });
  }
});



module.exports = router;