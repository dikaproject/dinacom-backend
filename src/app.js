const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authRoutes = require('./routes/auth');
const consultationRoutes = require('./routes/consultation');
const doctorVerificationRoutes = require('./routes/VerificationDoctor');
const layananKesehatanRoutes = require('./routes/LayananKesehatan');
const articleCategoryRoutes = require('./routes/articleCategory');
const articleRoutes = require('./routes/article');
const paymentRoutes = require('./routes/payment');
const messageRoutes = require('./routes/message');
const pregnancyRoutes = require('./routes/pregnancy');
const communityChatRoutes = require('./routes/comunityChat');
const doctorScheduleRoutes = require('./routes/doctorSchedule');
const doctorRoutes = require('./routes/doctor');
const userAdminRoutes = require('./routes/userAdmin');
const patientAdminRoutes = require('./routes/patient');
const adminRoutes = require('./routes/admin')
const { setupCronJobs } = require('./utils/cron');



const productCategoryRoutes = require('./routes/productCategory');
const productRoutes = require('./routes/product');
const cartProductRoutes = require('./routes/cart')
const transactionRoutes = require('./routes/transaction');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://dinacom.intechofficial.com"]
      : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true
});

// Add debugging
io.engine.on("connection_error", (err) => {
  console.log('Connection error details:', {
    req: err.req,
    code: err.code,
    message: err.message,
    context: err.context
  });
});
// Add this before socket.io connection handling
io.engine.on("connection_error", (err) => {
  console.log('Connection error:', err.req);      // the request that failed
  console.log('Error code:', err.code);     // the error code
  console.log('Error message:', err.message);   // the error message
  console.log('Error context:', err.context);   // some additional error context
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes)
app.use('/api/consultation', consultationRoutes);
app.use('/api/doctor-verification', doctorVerificationRoutes);
app.use('/api/layanan-kesehatan', layananKesehatanRoutes);
app.use('/api/article-category', articleCategoryRoutes);
app.use('/api/article', articleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/pregnancy', pregnancyRoutes);
app.use('/api/community', communityChatRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/product-category', productCategoryRoutes);
app.use('/api/product', productRoutes);
app.use('/api/cart', cartProductRoutes);
app.use('/api/settings', require('./routes/settings'));
app.use('/api/settings/doctor', require('./routes/settingsDoctor'));
app.use('/api/webhooks/whatsapp', require('./routes/whatsapp/webhooks'));
app.use('/api/doctor-schedules', doctorScheduleRoutes);
app.use('/api/user-admin', userAdminRoutes);
app.use('/api/patients-admin', patientAdminRoutes);
console.log('Initializing cron jobs...');

setupCronJobs();


// Socket.IO for Consultation Chat
io.on('connection', (socket) => {
  // Add connection logging
  console.log('New client connected:', socket.id);

  // Send immediate ping to verify connection
  socket.emit('connection_established', { id: socket.id });

  // Add heartbeat mechanism
  const heartbeat = setInterval(() => {
    socket.emit('ping');
  }, 25000);

  socket.on('join_consultation', async (consultationId) => {
    try {
      // Verify consultation exists and user has access
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId }
      });

      if (!consultation) {
        socket.emit('error', { message: 'Consultation not found' });
        return;
      }

      socket.join(consultationId);
      console.log(`Client ${socket.id} joined consultation: ${consultationId}`);
    } catch (error) {
      console.error('Join consultation error:', error);
      socket.emit('error', { message: 'Failed to join consultation' });
    }
  });

  socket.on('send_message', async (data, callback) => {
    try {
      // Add validation
      if (!data.consultationId || !data.content || !data.senderId) {
        callback({ error: 'Invalid message data' });
        return;
      }

      const message = await prisma.message.create({
        data: {
          consultationId: data.consultationId,
          senderId: data.senderId,
          content: data.content,
        },
        include: {
          sender: {
            select: {
              email: true,
              role: true,
              doctor: { select: { fullName: true } },
              profile: { select: { fullName: true } },
            },
          },
        },
      });

      io.to(data.consultationId).emit('receive_message', message);
      callback({ success: true }); // Send success acknowledgment
    } catch (error) {
      console.error('Message error:', error);
      callback({ error: error.message });
    }
  });

  // Socket.IO for Community Chat
  socket.on('join_community', () => {
    socket.join('community_chat');
    console.log(`Socket ${socket.id} joined community chat.`);
  });

  socket.on('send_community_message', async (data) => {
    const { userId, message } = data;

    try {
      const newMessage = await prisma.chatCommunity.create({
        data: {
          userId,
          message,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      io.to('community_chat').emit('receive_community_message', newMessage);
    } catch (error) {
      console.error('Message error:', error);
      socket.emit('message_error', { error: error.message });
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    clearInterval(heartbeat);
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

module.exports = { app, httpServer };
