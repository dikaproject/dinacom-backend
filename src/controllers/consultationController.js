const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createConsultation = async (req, res) => {
  try {
    const { doctorId, schedule } = req.body;
    const userId = req.user.id;

    console.log('Request data:', { userId, doctorId, schedule });

    // Validate doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });
 
    if (!doctor) {
      console.log('Doctor not found:', doctorId);
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Create consultation
    const newConsultation = await prisma.consultation.create({
      data: {
        userId: userId,
        doctorId: doctorId,
        schedule: new Date(schedule),
        status: 'PENDING'
      },
      include: {
        doctor: true,
        user: true
      }
    });

    console.log('Created consultation:', newConsultation);

    return res.status(201).json({
      success: true,
      message: 'Consultation created successfully',
      data: newConsultation
    });

  } catch (error) {
    console.error('Create consultation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getConsultations = async (req, res) => {
    try {
      const userId = req.user.id;
      const { role } = req.user;
      
      const where = role === 'DOCTOR' 
        ? { doctorId: userId }
        : { userId };
  
      const consultations = await prisma.consultation.findMany({
        where,
        include: {
          doctor: {
            select: {
              fullName: true,
              phoneNumber: true,
              layananKesehatan: true
            }
          },
          user: {
            select: {
              profile: {
                select: {
                  fullName: true,
                  phoneNumber: true
                }
              }
            }
          }
        },
        orderBy: {
          schedule: 'desc'
        }
      });
  
      res.json(consultations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  const getConsultationById = async (req, res) => {
    try {
      const { id } = req.params;
      const consultation = await prisma.consultation.findUnique({
        where: { id },
        include: {
          doctor: true,
          user: {
            select: {
              profile: true
            }
          },
          payment: true,
          messages: true
        }
      });
  
      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found' });
      }
  
      res.json(consultation);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  const updateConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    // Get consultation
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: { doctor: true }
    });

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Check if user is the doctor
    if (consultation.doctor.userId !== userId) {
      return res.status(403).json({ message: 'Only assigned doctor can update consultation status' });
    }

    // Update consultation
    const updated = await prisma.consultation.update({
      where: { id },
      data: { 
        status,
        notes
      },
      include: {
        doctor: true,
        user: {
          select: {
            email: true,
            profile: true
          }
        }
      }
    });

    res.json({
      message: 'Consultation updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update consultation error:', error);
    res.status(500).json({ message: error.message });
  }
};
  
  const deleteConsultation = async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.consultation.delete({
        where: { id }
      });
      res.json({ message: 'Consultation deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const getAllConsultationsByDoctor = async (req, res) => {
  try {
    const userId = req.user.id;

    // First get doctor data
    const doctor = await prisma.doctor.findUnique({
      where: { userId }
    });

    if (!doctor) {
      return res.status(404).json({ 
        message: 'Doctor profile not found' 
      });
    }

    const consultations = await prisma.consultation.findMany({
      where: { doctorId: doctor.id },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                fullName: true,
                phoneNumber: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: consultations
    });
  } catch (error) {
    console.error('Get doctor consultations error:', error);
    res.status(500).json({ 
      message: error.message 
    });
  }
};
  
  const getAllConsultationsAdmin = async (req, res) => {
    try {
      const consultations = await prisma.consultation.findMany({
        include: {
          doctor: {
            select: {
              fullName: true,
              phoneNumber: true,
              layananKesehatan: true
            }
          },
          user: {
            select: {
              email: true,
              profile: {
                select: {
                  fullName: true,
                  phoneNumber: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
  
      res.json(consultations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  module.exports = {
    createConsultation,
    getConsultations,
    getConsultationById,
    updateConsultation,
    deleteConsultation,
    getAllConsultationsByDoctor,
    getAllConsultationsAdmin
  };