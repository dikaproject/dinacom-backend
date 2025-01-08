const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      include: {
        profile: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        },
        layananKesehatan: true
      }
    });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyDoctor = async (req, res) => {
  try {
    const { doctorId, status } = req.body;
    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        verificationStatus: status,
        verifiedAt: status === 'APPROVED' ? new Date() : null
      }
    });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getAllDoctors,
  verifyDoctor
};