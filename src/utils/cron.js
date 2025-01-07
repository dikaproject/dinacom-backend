const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendDailyReminder } = require('./whatsapp');

const prisma = new PrismaClient();

const setupCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const todayEnd = new Date(now.setHours(23, 59, 59, 999));

      const profiles = await prisma.pregnantProfile.findMany({
        where: {
          isWhatsappActive: true,
          reminderTime: {
            gte: new Date(now.setMinutes(now.getMinutes() - 1)),
            lt: new Date(now.setMinutes(now.getMinutes() + 1))
          },
          OR: [
            { lastReminderSent: null },
            {
              lastReminderSent: {
                lt: todayStart
              }
            }
          ]
        }
      });

      for (const profile of profiles) {
        try {
          await sendDailyReminder(profile);
          await prisma.pregnantProfile.update({
            where: { id: profile.id },
            data: { lastReminderSent: now }
          });
          console.log(`Reminder sent to ${profile.phoneNumber} at ${now.toISOString()}`);
        } catch (error) {
          console.error(`Failed to send reminder to ${profile.phoneNumber}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });
};

module.exports = { setupCronJobs };