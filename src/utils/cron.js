const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendDailyReminder } = require('./whatsapp');

const prisma = new PrismaClient();

const setupCronJobs = () => {
  // Run every day at 9 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      const profiles = await prisma.pregnantProfile.findMany({
        where: {
          isWhatsappActive: true
        }
      });

      for (const profile of profiles) {
        await sendDailyReminder(profile);
      }
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });
};

module.exports = { setupCronJobs };