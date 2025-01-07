require('dotenv').config();
const { sendReminders } = require('./src/utils/cron');

console.log('Starting immediate reminder test...');
sendReminders();