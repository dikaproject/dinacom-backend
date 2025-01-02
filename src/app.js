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
const { setupCronJobs } = require('./utils/cron');



const productCategoryRoutes = require('./routes/productCategory');
const productRoutes = require('./routes/product');
const cartProductRoutes = require('./routes/cart')

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/consultation', consultationRoutes);
app.use('/api/doctor-verification', doctorVerificationRoutes);
app.use('/api/layanan-kesehatan', layananKesehatanRoutes);
app.use('/api/article-category', articleCategoryRoutes);
app.use('/api/article', articleRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/pregnancy', pregnancyRoutes);
app.use('/api/community', communityChatRoutes);

app.use('/api/product-category', productCategoryRoutes);
app.use('/api/product', productRoutes);
app.use('/api/cart', cartProductRoutes);
setupCronJobs();


// Socket.IO for Consultation Chat
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join Consultation Room
  socket.on('join_consultation', (consultationId) => {
    socket.join(consultationId);
    console.log(`Socket ${socket.id} joined consultation: ${consultationId}`);
  });

  socket.on('send_message', async (data) => {
    const { consultationId, content, senderId } = data;

    try {
      const message = await prisma.message.create({
        data: {
          consultationId,
          senderId,
          content,
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

      io.to(consultationId).emit('receive_message', message);
    } catch (error) {
      console.error('Message error:', error);
      socket.emit('message_error', { error: error.message });
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

  // Handle client disconnect
  socket.on('disconnect', () => {
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
