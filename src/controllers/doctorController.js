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
        provinsi: doctor.provinsi,
        kabupaten: doctor.kabupaten,
        kecamatan: doctor.kecamatan,
        address: doctor.address,
        verificationStatus: doctor.verificationStatus,
        codePos: doctor.codePos,
        educationBackground: doctor.educationBackground
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
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const [todayAppointments, activePatients, pendingConsultations, monthlyPayments] = await Promise.all([
      // Today's appointments (CONFIRMED or IN_PROGRESS)
      prisma.consultation.count({
        where: {
          doctorId: doctor.id,
          schedule: {
            gte: today,
            lte: endOfDay
          },
          status: {
            in: ['CONFIRMED', 'IN_PROGRESS']
          }
        }
      }),

      // Active patients (unique patients with CONFIRMED or IN_PROGRESS consultations)
      prisma.consultation.findMany({
        where: {
          doctorId: doctor.id,
          status: {
            in: ['CONFIRMED', 'IN_PROGRESS']
          }
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      }),

      // Pending consultations
      prisma.consultation.count({
        where: {
          doctorId: doctor.id,
          status: 'PENDING'
        }
      }),

      // Monthly earnings from completed consultations
      prisma.consultation.findMany({
        where: {
          doctorId: doctor.id,
          status: 'COMPLETED',
          payment: {
            paymentStatus: 'PAID',
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          }
        },
        include: {
          payment: {
            select: {
              amount: true
            }
          }
        }
      })
    ]);

    // Calculate monthly earnings
    const monthlyEarnings = monthlyPayments.reduce((sum, consultation) => {
      return sum + (consultation.payment?.amount || 0);
    }, 0);


    res.json({
      todayAppointments,
      activePatients: activePatients.length,
      pendingConsultations,
      monthlyEarnings
    });

  } catch (error) {
    console.error('Get doctor statistics error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
};

const getWeeklyActivity = async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
      select: { id: true }
    });

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const consultations = await prisma.consultation.findMany({
      where: {
        doctorId: doctor.id,
        createdAt: {
          gte: startOfWeek
        }
      },
      select: {
        status: true,
        createdAt: true
      }
    });

    // Group by day and status
    const activityData = Array(7).fill(0).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const dayConsultations = consultations.filter(c => 
        c.createdAt.toDateString() === date.toDateString()
      );

      return {
        date: date.toISOString().split('T')[0],
        total: dayConsultations.length,
        completed: dayConsultations.filter(c => c.status === 'COMPLETED').length,
        pending: dayConsultations.filter(c => c.status === 'PENDING').length
      };
    });

    res.json(activityData);
  } catch (error) {
    console.error('Get weekly activity error:', error);
    res.status(500).json({ message: 'Failed to fetch activity data' });
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

const getDoctors = async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        verificationStatus: 'APPROVED' // Changed from 'VERIFIED' to match the enum in schema
      },
      include: {
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
      specialization: 'Obstetrics & Gynecology', // Default specialization since it's not in schema
      image: doctor.photoProfile,
      consultationFee: doctor.consultationFee,
      experience: '1+ years', // Default since it's not in schema
      rating: 4.5, // Default since it's not in schema
      available: true,
      layananKesehatan: doctor.layananKesehatan
    }));

    res.json({ doctors: formattedDoctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Failed to fetch doctors' });
  }
};

const getPatients = async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
      select: { id: true }
    });

    const patients = await prisma.user.findMany({
      where: {
        consultations: {
          some: {
            doctorId: doctor.id
          }
        }
      },
      select: {
        id: true,
        profile: {
          select: {
            fullName: true,
            pregnancyWeek: true
          }
        },
        consultations: {
          where: {
            doctorId: doctor.id
          },
          select: {
            id: true,
            schedule: true,
            status: true,
            type: true
          },
          orderBy: {
            schedule: 'desc'
          }
        }
      }
    });

    res.json(patients);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Failed to fetch patients' });
  }
};



module.exports = {
  getDoctorProfile,
  updateConsultationFee,
  getDoctorStatistics,
  getDoctorAppointments,
  updateDoctorProfile,
  updateDoctorSchedule,
  getDoctors,
  getWeeklyActivity,
  getPatients
};