const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendDailyReminder } = require('./whatsapp');

const prisma = new PrismaClient();

const setupCronJobs = () => {
  console.log('Setting up cron jobs...');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const hourUTC0 = now.getUTCHours();
      const minuteUTC0 = now.getUTCMinutes();

      console.log(`[CRON] ${now.toISOString()} Checking with UTC+0: hour=${hourUTC0}, minute=${minuteUTC0}`);

      const allProfiles = await prisma.pregnantProfile.findMany({
        where: { isWhatsappActive: true }
      });

      const profiles = allProfiles.filter((profile) => {
        if (!profile.reminderTime) return false;

        const reminderTime = new Date(profile.reminderTime);
        const lastSent = profile.lastReminderSent ? new Date(profile.lastReminderSent) : null;

        console.log(`[CRON] Profile: ${profile.id} | reminderTime=${reminderTime.toISOString()} | lastSent=${lastSent ? lastSent.toISOString() : 'none'}`);

        // Check if current time is within 5 minutes of reminder time
        const timeDiffMinutes = Math.abs(
          (hourUTC0 * 60 + minuteUTC0) - 
          (reminderTime.getUTCHours() * 60 + reminderTime.getUTCMinutes())
        );

        // Check if should send reminder (within 5 minutes of target time AND either no last sent OR different day)
        const shouldSendReminder = 
          timeDiffMinutes <= 5 && 
          (!lastSent || 
           lastSent.toDateString() !== now.toDateString());

        console.log(`[CRON] Profile ${profile.id} timeDiff=${timeDiffMinutes}min, shouldSend=${shouldSendReminder}`);
        
        return shouldSendReminder;
      });

      console.log(`[CRON] Found ${profiles.length} profiles to remind`);

      for (const profile of profiles) {
        try {
          await sendDailyReminder(profile);
          await prisma.pregnantProfile.update({
            where: { id: profile.id },
            data: { lastReminderSent: now }
          });
          console.log(`[CRON] Successfully sent reminder to ${profile.id}`);
        } catch (error) {
          console.error(`[CRON] Failed to send reminder to ${profile.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[CRON] Cron job error:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta"
  });
};

module.exports = { setupCronJobs };