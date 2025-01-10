const { PrismaClient, ConsultationStatus } = require('@prisma/client');
const prisma = new PrismaClient();

const createConsultation = async (req, res) => {
  try {
    const { 
      doctorId, 
      schedule, 
      type,
      symptoms,
      concerns,
      pregnancyWeek,
      previousPregnancies
    } = req.body;
    const userId = req.user.id;

    // Format schedule to proper ISO DateTime
    const scheduleDate = new Date(schedule);
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid schedule format'
      });
    }

    // Check if schedule is available
    const existingConsultation = await prisma.consultation.findFirst({
      where: {
        doctorId,
        schedule: scheduleDate,
        status: {
          in: [
            ConsultationStatus.PENDING,
            ConsultationStatus.CONFIRMED,
            ConsultationStatus.COMPLETED
          ]
        }
      }
    });

    if (existingConsultation) {
      return res.status(400).json({
        message: 'Schedule not available'
      });
    }

    const consultation = await prisma.consultation.create({
      data: {
        userId,
        doctorId,
        schedule: scheduleDate,
        type,
        symptoms,
        concerns,
        pregnancyWeek,
        previousPregnancies,
        status: ConsultationStatus.PENDING
      },
      include: {
        doctor: {
          include: {
            layananKesehatan: true
          }
        }
      }
    });

    // Calculate fees based on consultation type and payment method
    const consultationFee = consultation.doctor.consultationFee;
    const serviceCharge = type === 'ONLINE' ? 15000 : 25000;
    const tax = Math.round(consultationFee * 0.11); // 11% tax

    res.status(201).json({
      success: true,
      data: {
        consultation,
        fees: {
          consultationFee,
          serviceCharge,
          tax,
          total: consultationFee + serviceCharge + tax
        }
      }
    });

  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({ message: error.message });
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
      const { status } = req.body;
      const userId = req.user.id;
  
      // Get consultation with payment info
      const consultation = await prisma.consultation.findUnique({
        where: { id },
        include: { 
          doctor: true,
          payment: true 
        }
      });
  
      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found' });
      }
  
      // Check if user is the doctor
      if (consultation.doctor.userId !== userId) {
        return res.status(403).json({ message: 'Only assigned doctor can update consultation status' });
      }
  
      // Transaction to update both consultation and payment status
      const updated = await prisma.$transaction(async (tx) => {
        // Update consultation status
        const updatedConsultation = await tx.consultation.update({
          where: { id },
          data: { status },
          include: {
            doctor: true,
            user: {
              select: {
                email: true,
                profile: true
              }
            },
            payment: true
          }
        });
  
        // If confirming consultation, also update payment status
        if (status === 'CONFIRMED' && consultation.payment) {
          await tx.payment.update({
            where: { id: consultation.payment.id },
            data: { 
              paymentStatus: 'PAID',
              paidAt: new Date()
            }
          });
        }
  
        return updatedConsultation;
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
          },
          payment: {
            select: {
              amount: true,
              paymentStatus: true,
              paymentMethod: true,
              paymentProof: true // Add this
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
  
      // Match the expected response format
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

  //  start consultation
  const startConsultation = async (req, res) => {
    try {
      const { consultationId } = req.params;
      const userId = req.user.id;
  
      const consultation = await prisma.consultation.findFirst({
        where: {
          id: consultationId,
          status: { in: [ConsultationStatus.CONFIRMED, ConsultationStatus.IN_PROGRESS, ConsultationStatus.COMPLETED] },
          OR: [
            { userId },
            { doctor: { userId } }
          ]
        },
        include: {
          doctor: {
            select: {
              id: true,
              fullName: true,
              photoProfile: true,
              userId: true,
              consultationFee: true
            }
          },
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  fullName: true
                }
              }
            }
          },
          payment: {
            select: {
              paymentStatus: true
            }
          }
        }
      });
  
      if (!consultation) {
        return res.status(404).json({ 
          message: 'Consultation not found or not accessible' 
        });
      }
  
      if (!consultation.payment || consultation.payment.paymentStatus !== 'PAID') {
        return res.status(403).json({
          message: 'Payment must be completed first'
        });
      }
  
      // Format date to ISO string
      consultation.schedule = consultation.schedule.toISOString();
  
      const messages = await prisma.message.findMany({
        where: { consultationId },
        include: {
          sender: {
            select: {
              email: true,
              role: true,
              doctor: { select: { fullName: true } },
              profile: { select: { fullName: true } }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
  
      res.json({
        consultation: {
          ...consultation,
          isDoctor: consultation.doctor.userId === userId
        },
        messages,
        // Only enable chat for non-completed consultations
        chatEnabled: consultation.status !== ConsultationStatus.COMPLETED
      });
  
    } catch (error) {
      console.error('Start consultation error:', error);
      res.status(500).json({ message: error.message });
    }
  };

  const getPendingConsultation = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const pending = await prisma.consultation.findFirst({
        where: {
          userId,
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        },
        include: {
          doctor: {
            select: {
              fullName: true
            }
          },
          payment: {
            select: {
              amount: true,
              paymentStatus: true
            }
          }
        }
      });
  
      res.json(pending);
    } catch (error) {
      console.error('Get pending consultation error:', error);
      res.status(500).json({ message: error.message });
    }
  };

  const cancelConsultation = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
  
    try {
      await prisma.$transaction(async (tx) => {
        const consultation = await tx.consultation.findFirst({
          where: {
            id,
            userId,
            status: { not: 'COMPLETED' }
          },
          include: {
            doctor: true
          }
        });
  
        if (!consultation) {
          throw new Error('Consultation not found');
        }
  
        // Update consultation status
        await tx.consultation.update({
          where: { id },
          data: { status: 'CANCELLED' }
        });
  
        // Update payment status if exists
        if (consultation.payment) {
          await tx.payment.update({
            where: { consultationId: id },
            data: { paymentStatus: 'FAILED' }
          });
        }
  
        // Update doctor schedule availability
        const scheduleDate = new Date(consultation.schedule);
        await tx.doctorSchedule.updateMany({
          where: {
            doctorId: consultation.doctorId,
            dayOfWeek: scheduleDate.getDay(),
            startTime: {
              lte: scheduleDate.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              })
            },
            endTime: {
              gte: scheduleDate.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          },
          data: { 
            isAvailable: true,
            bookedDates: {
              // Remove this date from bookedDates array
              set: [] // or update your logic to remove specific date
            }
          }
        });
      });
  
      res.json({ message: 'Consultation cancelled successfully' });
    } catch (error) {
      console.error('Cancel consultation error:', error);
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
    getAllConsultationsAdmin,
    startConsultation,
    getPendingConsultation,
    cancelConsultation
  };