require('dotenv').config();
const { sendWhatsAppMessage } = require('./src/utils/whatsapp');

const testWhatsApp = async () => {
  try {
    console.log('Starting WhatsApp test...');
    console.log('Using token:', process.env.FONNTE_TOKEN);
    
    const result = await sendWhatsAppMessage('6281227848422', 'Hello from Health Platform Test');
    
    console.log('Message sent successfully:', result);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

testWhatsApp();