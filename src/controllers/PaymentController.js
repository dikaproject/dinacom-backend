const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateFees } = require('../utils/payment');
const snap = require('../utils/midtrans');

const createPayment = async (req, res) => {
    try {
      const { consultationId, paymentMethod } = req.body;
      const userId = req.user.id;
  
      const consultation = await prisma.consultation.findFirst({
        where: { 
          id: consultationId,
          userId,
          payment: null
        },
        include: { 
          doctor: {
            select: {
              fullName: true,
              consultationFee: true
            }
          }
        }
      });
  
      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found or payment exists' });
      }
  
      const { baseAmount, platformFee, totalAmount } = calculateFees(consultation.doctor.consultationFee);
  
      const payment = await prisma.payment.create({
        data: {
          consultationId,
          amount: baseAmount,
          platformFee,
          totalAmount,
          paymentMethod,
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        include: {
          consultation: {
            include: {
              doctor: true
            }
          }
        }
      });
  
      res.status(201).json({
        message: 'Payment created',
        data: {
          ...payment,
          doctorName: consultation.doctor.fullName,
          consultationFee: consultation.doctor.consultationFee
        }
      });
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({ message: error.message });
    }
  };

const uploadPaymentProof = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const paymentProof = req.file?.filename;

    if (!paymentProof) {
      return res.status(400).json({ message: 'Payment proof required' });
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { 
        paymentProof,
        paymentStatus: 'PENDING'
      }
    });

    res.json({
      message: 'Payment proof uploaded',
      data: payment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyManualPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId },
      include: {
        consultation: {
          include: {
            doctor: true,
            user: true
          }
        }
      }
    });

    if (!payment || payment.consultation.doctor.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Transaction for payment verification and consultation update
    const result = await prisma.$transaction(async (prisma) => {
      // Update payment
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          paymentStatus: status,
          paidAt: status === 'PAID' ? new Date() : null
        }
      });

      if (status === 'PAID') {
        // Update consultation status
        const updatedConsultation = await prisma.consultation.update({
          where: { id: payment.consultationId },
          data: { status: 'CONFIRMED' }
        });

        // Create notifications
        await prisma.notification.createMany({
          data: [
            {
              userId: payment.consultation.userId,
              title: 'Payment Verified',
              message: 'Your payment has been verified. You can start consultation.',
              type: 'CONSULTATION_SCHEDULE'
            },
            {
              userId: payment.consultation.doctor.userId,
              title: 'New Consultation',
              message: `New consultation scheduled with ${payment.consultation.user.email}`,
              type: 'CONSULTATION_SCHEDULE'
            }
          ]
        });

        return { payment: updatedPayment, consultation: updatedConsultation };
      }

      return { payment: updatedPayment };
    });

    res.json({
      message: 'Payment verification successful',
      data: result
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: error.message });
  }
};

const createMidtransPayment = async (req, res) => {
    try {
      const { consultationId } = req.body;
      const userId = req.user.id;
  
      const consultation = await prisma.consultation.findFirst({
        where: { 
          id: consultationId,
          userId,
          payment: null
        },
        include: { 
          doctor: true,
          user: {
            include: {
              profile: true
            }
          }
        }
      });
  
      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found or payment exists' });
      }
  
      const { baseAmount, platformFee, totalAmount } = calculateFees(150000);
  
      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          consultationId,
          amount: baseAmount,
          platformFee,
          totalAmount,
          paymentMethod: 'MIDTRANS',
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }
      });
  
      // Create Midtrans transaction
      const transaction = await snap.createTransaction({
        transaction_details: {
          order_id: payment.id,
          gross_amount: Math.round(totalAmount)
        },
        customer_details: {
          first_name: consultation.user.profile.fullName,
          email: consultation.user.email,
        },
        item_details: [{
          id: consultationId,
          price: Math.round(baseAmount),
          quantity: 1,
          name: `Konsultasi dengan Dr. ${consultation.doctor.fullName}`,
        }, {
          id: 'platform-fee',
          price: Math.round(platformFee),
          quantity: 1,
          name: 'Biaya Platform',
        }]
      });
  
      res.status(201).json({
        message: 'Midtrans payment created',
        data: {
          payment,
          snapToken: transaction.token
        }
      });
    } catch (error) {
      console.error('Midtrans payment error:', error);
      res.status(500).json({ message: error.message });
    }
  };
  
  const handleMidtransNotification = async (req, res) => {
    try {
      const notification = await snap.transaction.notification(req.body);
      const orderId = notification.order_id;
      const transactionStatus = notification.transaction_status;
      const fraudStatus = notification.fraud_status;
  
      const payment = await prisma.payment.findUnique({
        where: { id: orderId },
        include: {
          consultation: true
        }
      });
  
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
  
      let paymentStatus;
      if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
        if (fraudStatus === 'accept') {
          paymentStatus = 'PAID';
        }
      } else if (transactionStatus === 'cancel' || 
                 transactionStatus === 'deny' || 
                 transactionStatus === 'expire') {
        paymentStatus = 'FAILED';
      }
  
      if (paymentStatus) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: orderId },
            data: {
              paymentStatus,
              paidAt: paymentStatus === 'PAID' ? new Date() : null,
              midtransId: notification.transaction_id
            }
          }),
          prisma.consultation.update({
            where: { id: payment.consultationId },
            data: { 
              status: paymentStatus === 'PAID' ? 'CONFIRMED' : 'PENDING'
            }
          })
        ]);
      }
  
      res.json({ message: 'OK' });
    } catch (error) {
      console.error('Midtrans notification error:', error);
      res.status(500).json({ message: error.message });
    }
  };

module.exports = {
  createPayment,
  uploadPaymentProof,
  verifyManualPayment,
  createMidtransPayment,
  handleMidtransNotification
};