const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { sendReminder, updateReminderSettings } = require('../../controllers/whatsapp/reminderController');

router.post('/send', authMiddleware, sendReminder);
router.put('/settings', authMiddleware, updateReminderSettings);

module.exports = router;