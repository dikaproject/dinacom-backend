const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { sendReminder, updateReminderSettings } = require('../../controllers/whatsapp/reminderController');

router.post('/send/:userId', authMiddleware, sendReminder);
router.put('/settings/:userId', authMiddleware, updateReminderSettings);

module.exports = router;