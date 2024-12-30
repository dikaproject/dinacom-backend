const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMessages = async (req, res) => {
  try {
    const { consultationId } = req.params;
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
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    // Verify consultation is active
    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        status: 'CONFIRMED'
      }
    });

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found or not active' });
    }

    const message = await prisma.message.create({
      data: {
        consultationId,
        senderId,
        content,
        isRead: false
      },
      include: {
        sender: {
          select: {
            email: true,
            role: true,
            doctor: { select: { fullName: true } },
            profile: { select: { fullName: true } }
          }
        }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMessages, sendMessage };