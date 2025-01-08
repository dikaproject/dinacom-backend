const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDoctorProfile = async (req, res) => {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { 
          userId: req.user.id 
        },
        include: {
          user: {
            select: {
              email: true,
              role: true
            }
          },
          schedules: true,
          layananKesehatan: true
        }
      });
  
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
  
      // Match the exact shape frontend expects
      const response = {
        id: doctor.id,
        fullName: doctor.fullName,
        strNumber: doctor.strNumber,
        sipNumber: doctor.sipNumber,
        phoneNumber: doctor.phoneNumber,
        photoProfile: doctor.photoProfile,
        documentsProof: doctor.documentsProof,
        consultationFee: doctor.consultationFee,
        schedules: doctor.schedules || [],
        layananKesehatan: {
          id: doctor.layananKesehatan.id,
          name: doctor.layananKesehatan.name,
          district: doctor.layananKesehatan.district
        },
        email: doctor.user.email,
        province: doctor.provinsi,
        city: doctor.kabupaten,
        district: doctor.kecamatan,
        address: doctor.address,
        verificationStatus: doctor.verificationStatus
      };
  
      res.json(response);
    } catch (error) {
      console.error('Get doctor profile error:', error);
      res.status(500).json({ message: 'Failed to fetch doctor profile' });
    }
  };

const getDoctorStatistics = async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { 
        userId: req.user.id 
      },
      select: { id: true }
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Check if doctor has any consultations
    const hasConsultations = await prisma.consultation.findFirst({
      where: {
        doctorId: doctor.id
      }
    });

    // If no consultations, return default values
    if (!hasConsultations) {
      return res.json({
        todayAppointments: 0,
        activePatients: 0,
        pendingConsultations: 0,
        monthlyEarnings: 0
      });
    }

    // If has consultations, get statistics
    const [todayAppointments, activePatients, pendingConsultations, monthlyEarnings] = await Promise.all([
      prisma.consultation.count({
        where: {
          doctorId: doctor.id,
          schedule: {
            gte: new Date(today.setHours(0,0,0,0)),
            lt: new Date(today.setHours(23,59,59,999))
          }
        }
      }),
      prisma.consultation.count({
        where: {
          doctorId: doctor.id,
          status: 'CONFIRMED'
        },
        distinct: ['userId']
      }),
      prisma.consultation.count({
        where: {
          doctorId: doctor.id,
          status: 'PENDING'
        }
      }),
      prisma.payment.aggregate({
        where: {
          consultation: {
            doctorId: doctor.id
          },
          paymentStatus: 'PAID',
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          amount: true
        }
      })
    ]);

    res.json({
      todayAppointments,
      activePatients,
      pendingConsultations,
      monthlyEarnings: monthlyEarnings._sum?.amount || 0
    });
  } catch (error) {
    console.error('Get doctor statistics error:', error);
    // Return default values on error
    res.json({
      todayAppointments: 0,
      activePatients: 0,
      pendingConsultations: 0,
      monthlyEarnings: 0
    });
  }
};

const updateConsultationFee = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fee } = req.body;

    const doctor = await prisma.doctor.update({
      where: { userId },
      data: { consultationFee: fee }
    });

    res.json(doctor);
  } catch (error) {
    console.error('Update consultation fee error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getDoctorAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      select: { id: true }
    });

    const today = new Date();
    const appointments = await prisma.consultation.findMany({
      where: {
        doctorId: doctor.id,
        schedule: {
          gte: new Date(today.setHours(0,0,0,0))
        }
      },
      include: {
        user: {
          select: {
            profile: {
              select: {
                fullName: true,
                pregnancyWeek: true
              }
            }
          }
        }
      },
      orderBy: {
        schedule: 'asc'
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateDoctorProfile = async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      address,
      provinsi,
      kabupaten,
      kecamatan,
      codePos,
      consultationFee
    } = req.body;

    const doctor = await prisma.doctor.update({
      where: { userId: req.user.id },
      data: {
        fullName,
        phoneNumber,
        address,
        provinsi,
        kabupaten,
        kecamatan,
        codePos,
        consultationFee: parseFloat(consultationFee)
      }
    });

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDoctorSchedule = async (req, res) => {
  try {
    const { schedules } = req.body;
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id }
    });

    await prisma.doctorSchedule.deleteMany({
      where: { doctorId: doctor.id }
    });

    const createdSchedules = await prisma.doctorSchedule.createMany({
      data: schedules.map(schedule => ({
        doctorId: doctor.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime
      }))
    });

    res.json(createdSchedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDoctorProfile,
  updateConsultationFee,
  getDoctorStatistics,
  getDoctorAppointments,
  updateDoctorProfile,
  updateDoctorSchedule
};