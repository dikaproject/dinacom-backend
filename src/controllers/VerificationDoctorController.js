const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPendingDoctors = async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        user: { select: { email: true } },
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
    const { doctorId } = req.params;
    const { status, reason } = req.body;

    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        verificationStatus: status,
        verifiedAt: status === 'APPROVED' ? new Date() : null,
      },
      include: {
        user: true,
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        title: `Doctor Verification ${status}`,
        message: status === 'APPROVED' 
          ? 'Your doctor account has been approved!' 
          : `Your verification was rejected. Reason: ${reason}`,
        type: 'SYSTEM'
      }
    });

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingDoctors,
  verifyDoctor
};