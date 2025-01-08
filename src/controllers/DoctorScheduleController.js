const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const addSchedule = async (req, res) => {
  try {
    const { schedules } = req.body;
    const userId = req.user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const createdSchedules = await prisma.doctorSchedule.createMany({
      data: schedules.map(schedule => ({
        doctorId: doctor.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isAvailable: true
      }))
    });

    res.json({
      success: true,
      message: 'Schedules added successfully',
      data: createdSchedules
    });
  } catch (error) {
    console.error('Add schedule error:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;
    const userId = req.user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Try to find existing schedule
    let schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId: doctor.id,
        dayOfWeek
      }
    });

    if (schedule) {
      // Update existing schedule
      schedule = await prisma.doctorSchedule.update({
        where: { id: schedule.id },
        data: { startTime, endTime, isAvailable: true }
      });
    } else {
      // Create new schedule
      schedule = await prisma.doctorSchedule.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek,
          startTime,
          endTime,
          isAvailable: true
        }
      });
    }

    res.json({
      success: true,
      message: schedule ? 'Schedule updated' : 'Schedule created',
      data: schedule
    });
  } catch (error) {
    console.error('Schedule operation error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getSchedules = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getAvailableSchedules = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    const now = new Date();

    // Get doctor's schedule for the day
    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        isAvailable: true
      }
    });

    if (!schedule) {
      return res.json({ timeSlots: [] });
    }

    // Get booked consultations for the date
    const bookedConsultations = await prisma.consultation.findMany({
      where: {
        doctorId,
        schedule: {
          gte: new Date(selectedDate.setHours(0,0,0,0)),
          lt: new Date(selectedDate.setHours(23,59,59,999))
        },
        OR: [
          { status: 'CONFIRMED' },
          { status: 'PENDING', payment: { paymentStatus: 'PAID' } }
        ]
      },
      include: {
        payment: true
      }
    });

    const bookedTimes = bookedConsultations.map(c => 
      new Date(c.schedule).toLocaleTimeString('en-US', { hour12: false })
    );

    // Generate time slots (30 min intervals)
    const timeSlots = [];
    const [startHour, startMinute] = schedule.startTime.split(':');
    const [endHour, endMinute] = schedule.endTime.split(':');
    
    const start = new Date(selectedDate.setHours(parseInt(startHour), parseInt(startMinute)));
    const end = new Date(selectedDate.setHours(parseInt(endHour), parseInt(endMinute)));

    while (start < end) {
      const timeString = start.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit'
      });

      const slotTime = new Date(selectedDate);
      slotTime.setHours(parseInt(timeString.split(':')[0]), parseInt(timeString.split(':')[1]));

      const isAvailable = !bookedTimes.includes(timeString) && 
        (selectedDate.toDateString() !== now.toDateString() || slotTime > now);

      timeSlots.push({
        time: timeString,
        isAvailable,
        reason: bookedTimes.includes(timeString) ? 'BOOKED' : 
          (slotTime <= now ? 'PASSED' : undefined)
      });

      start.setMinutes(start.getMinutes() + 30);
    }

    res.json({ timeSlots });
  } catch (error) {
    console.error('Get available schedules error:', error);
    res.status(500).json({ message: error.message });
  }
};

  const getAllDoctors = async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        verificationStatus: 'APPROVED'
      },
      include: {
        schedules: true,
        layananKesehatan: {
          select: {
            id: true,
            name: true,
            district: true
          }
        }
      }
    });

    const formattedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      fullName: doctor.fullName,
      specialization: "Obstetrics & Gynecology",
      experience: "5+ years",
      rating: 4.5,
      available: doctor.schedules.some(s => s.isAvailable),
      image: doctor.photoProfile ? `/uploads/profiles/${doctor.photoProfile}` : '/images/default-doctor.png',
      schedules: doctor.schedules,
      consultationFee: doctor.consultationFee,
      layananKesehatan: doctor.layananKesehatan
    }));

    res.json({ doctors: formattedDoctors });
  } catch (error) {
    console.error('Get all doctors error:', error);
    res.status(500).json({ message: error.message });
  }
};
  
  module.exports = {
    addSchedule,
    updateSchedule,
    getSchedules,
    getAvailableSchedules,
    getAllDoctors
  };