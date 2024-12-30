const { httpServer } = require('./app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.error('Error:', err);
  
  httpServer.close(() => {
    process.exit(1);
  });
});