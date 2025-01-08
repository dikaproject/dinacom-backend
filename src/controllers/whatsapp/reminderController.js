const { PrismaClient } = require('@prisma/client');
const { sendWhatsAppMessage, sendDailyReminder } = require('../../utils/whatsapp');
const prisma = new PrismaClient();

const sendReminder = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await prisma.pregnantProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const result = await sendDailyReminder(profile);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReminderSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isWhatsappActive, reminderTime } = req.body;

    const profile = await prisma.pregnantProfile.update({
      where: { userId },
      data: {
        isWhatsappActive,
        reminderTime: new Date(reminderTime),
        lastReminderSent: null
      }
    });

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Update reminder settings error:', error);
    res.status(500).json({
      message: 'Failed to update reminder settings',
      error: error.message
    });
  }
};

module.exports = { sendReminder, updateReminderSettings };