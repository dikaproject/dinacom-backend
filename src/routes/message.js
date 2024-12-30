const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getMessages, sendMessage } = require('../controllers/messageController');
const { startConsultation } = require('../controllers/consultationController');

router.get('/:consultationId', authMiddleware, getMessages);
router.post('/:consultationId', authMiddleware, sendMessage);

router.get('/consultation/:consultationId/chat', 
    authMiddleware, 
    startConsultation
  );

module.exports = router;