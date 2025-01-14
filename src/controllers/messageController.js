const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMessages = async (req, res) => {
  try {
    const { consultationId } = req.params;
    
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      select: {
        status: true,
        type: true,
        schedule: true
      }
    });

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Modify chat availability check to allow access until consultation is marked as completed
    const chatEnabled = consultation.status === 'CONFIRMED' || 
                       consultation.status === 'IN_PROGRESS' && 
                       consultation.type === 'ONLINE';

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
      chatEnabled,
      messages,
      consultation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { content, type = 'TEXT' } = req.body;
    const senderId = req.user.id;

    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        OR: [
          { userId: senderId },
          { doctor: { userId: senderId } }
        ]
      },
      include: {
        doctor: true,
        user: true
      }
    });

    if (!consultation) {
      return res.status(404).json({
        message: 'Consultation not found or not active'
      });
    }

    const message = await prisma.message.create({
      data: {
        consultationId,
        senderId,
        content,
        type,
        isRead: false
      },
      include: {
        sender: {
          select: {
            email: true,
            role: true,
            doctor: { select: { fullName: true, photoProfile: true } },
            profile: { select: { fullName: true, photoProfile: true } }
          }
        }
      }
    });

    // Create notification for recipient
    const recipientId = senderId === consultation.userId 
      ? consultation.doctor.userId 
      : consultation.userId;

    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: 'New Message',
        message: `You have a new message in consultation #${consultation.id}`,
        type: 'MESSAGE'
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMessages, sendMessage };