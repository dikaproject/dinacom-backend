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
    const { userId } = req.params;
    const { isWhatsappActive, reminderTime } = req.body;

    const updated = await prisma.pregnantProfile.update({
      where: { userId },
      data: { isWhatsappActive, reminderTime }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendReminder, updateReminderSettings };