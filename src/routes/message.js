const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/auth');
const { getMessages, sendMessage } = require('../controllers/messageController');
const { startConsultation } = require('../controllers/consultationController');

const checkConsultationAccess = async (req, res, next) => {
  const { consultationId } = req.params;
  const userId = req.user.id;

  try {
    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        OR: [
          { userId },
          { doctor: { userId } }
        ]
      }
    });

    if (!consultation) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Authentication middleware should be first
router.use(authMiddleware);

// Then consultation access check for all consultation routes
router.use('/consultation/:consultationId', checkConsultationAccess);

// Chat routes
router.get('/consultation/:consultationId/chat', startConsultation);
router.get('/consultation/:consultationId', getMessages);
router.post('/consultation/:consultationId', sendMessage);

module.exports = router;