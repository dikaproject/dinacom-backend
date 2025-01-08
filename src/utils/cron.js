const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendDailyReminder } = require('./whatsapp');

const prisma = new PrismaClient();

const setupCronJobs = () => {
  console.log('Setting up cron jobs...');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const wibNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      
      console.log('=== Cron Job Running ===');
      console.log(`Current WIB Time: ${wibNow.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })}`);

      // Create time window for current minute in UTC
      const startTime = new Date();
      startTime.setUTCMinutes(startTime.getUTCMinutes(), 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setUTCMinutes(endTime.getUTCMinutes() + 1);

      console.log(`Looking for reminders set to UTC: ${startTime.toISOString()}`);

      const profiles = await prisma.pregnantProfile.findMany({
        where: {
          isWhatsappActive: true,
          reminderTime: {
            gte: startTime,
            lt: endTime
          },
          OR: [
            { lastReminderSent: null },
            {
              lastReminderSent: {
                lt: new Date(startTime.setUTCHours(0, 0, 0, 0))
              }
            }
          ]
        }
      });

      console.log(`Found ${profiles.length} profiles to remind`);

      for (const profile of profiles) {
        try {
          await sendDailyReminder(profile);
          await prisma.pregnantProfile.update({
            where: { id: profile.id },
            data: { lastReminderSent: now }
          });
        } catch (error) {
          console.error(`Failed to send reminder to ${profile.phoneNumber}:`, error);
        }
      }
    } catch (error) {
      console.error('Cron job error:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta"
  });
};

module.exports = { setupCronJobs };