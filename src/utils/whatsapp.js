const axios = require('axios');
const FormData = require('form-data');

const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    const formData = new FormData();
    formData.append('target', phoneNumber);
    formData.append('message', message);
    formData.append('delay', '2');
    formData.append('countryCode', '62');

    const response = await axios({
      method: 'post',
      url: 'https://api.fonnte.com/send',
      headers: {
        'Authorization': process.env.FONNTE_TOKEN,
        ...formData.getHeaders()
      },
      data: formData
    });

    console.log('Fonnte Response:', response.data);

    if (response.data.status !== true) {
      throw new Error(response.data.reason || 'WhatsApp send failed');
    }

    return response.data;
  } catch (error) {
    console.error('WhatsApp send error:', error.response?.data || error.message);
    throw error;
  }
};

const sendDailyReminder = async (profile) => {
    const messageEN = `🇬🇧 English:
  Hi ${profile.fullName}! 🤰
  Time for your daily pregnancy check-in ✨
  
  Quick reply with numbers:
  1️⃣ Record weight & symptoms
  2️⃣ Log today's meals
  3️⃣ Track exercise
  4️⃣ View recommendations
  
  Stay healthy! 💪`;
  
    const messageID = `🇮🇩 Indonesia:
  Halo ${profile.fullName}! 🤰
  Waktunya pemeriksaan kehamilan harian ✨
  
  Balas dengan angka:
  1️⃣ Catat berat badan & gejala
  2️⃣ Catat makanan hari ini
  3️⃣ Catat olahraga
  4️⃣ Lihat rekomendasi
  
  Jaga kesehatan! 💪`;
  
    const fullMessage = `${messageEN}\n\n${messageID}`;
    return sendWhatsAppMessage(profile.phoneNumber, fullMessage);
  };
  
  module.exports = { sendWhatsAppMessage, sendDailyReminder };