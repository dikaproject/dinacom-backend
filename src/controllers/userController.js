const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getUserProfile = async (req, res) => {
  try {
    const profile = await prisma.pregnantProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserConsultations = async (req, res) => {
  try {
    const consultations = await prisma.consultation.findMany({
      where: { userId: req.user.id },
      include: {
        doctor: {
          select: {
            fullName: true,
            photoProfile: true,
            layananKesehatan: true
          }
        },
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      phoneNumber,
      address,
      bloodType,
      height,
      pregnancyStartDate,
      dueDate
    } = req.body;

    const profile = await prisma.pregnantProfile.update({
      where: { userId: req.user.id },
      data: {
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        phoneNumber,
        address,
        bloodType,
        height,
        pregnancyStartDate: new Date(pregnancyStartDate),
        dueDate: new Date(dueDate)
      }
    });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  getUserConsultations,
  updateUserProfile
};