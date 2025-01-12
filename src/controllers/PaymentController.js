const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const snap = require('../utils/midtrans');
const { calculateFees, generatePaymentGuide } = require('../utils/payment/paymentUtils');

const createPayment = async (req, res) => {
  try {
    const { consultationId, paymentMethod, bankCode } = req.body;

    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { doctor: true }
    });

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    const { baseAmount, platformFee, tax, totalAmount } = calculateFees(
      consultation.doctor.consultationFee,
      paymentMethod
    );

    const payment = await prisma.payment.create({
      data: {
        consultationId,
        amount: baseAmount,
        platformFee,
        tax,
        totalAmount,
        paymentMethod,
        paymentStatus: 'PENDING',
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    const response = {
      success: true,
      data: {
        payment,
        guide: generatePaymentGuide(paymentMethod, bankCode),
        breakdown: {
          consultationFee: baseAmount,
          platformFee,
          tax,
          total: totalAmount
        }
      }
    };

    if (paymentMethod === 'QRIS') {
      response.data.qrisUrl = '/uploads/qris.jpeg';
    }

    res.json(response);
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

    // Add debug logging
    console.log('Uploading payment proof:', {
      paymentId,
      filename: paymentProof,
      file: req.file
    });

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { 
        paymentProof,
        paymentStatus: 'PENDING'
      }
    });

    res.json({
      message: 'Payment proof uploaded',
      data: {
        ...payment,
        paymentProofUrl: `/api/uploads/payments/${paymentProof}`
      }
    });
  } catch (error) {
    console.error('Payment proof upload error:', error);
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
        OR: [
          { status: 'PENDING' },
          { payment: { paymentStatus: 'PENDING' } }
        ]
      },
      include: { 
        doctor: true,
        user: {
          include: { profile: true }
        },
        payment: true
      }
    });

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Calculate fees including platform fee and tax
    const { baseAmount, platformFee, tax, totalAmount } = calculateFees(
      consultation.doctor.consultationFee,
      'MIDTRANS'
    );

    // Create or use existing payment
    let payment = consultation.payment;
    
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          consultationId,
          amount: baseAmount,
          platformFee,
          tax,
          totalAmount,
          paymentMethod: 'MIDTRANS',
          paymentStatus: 'PENDING',
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }
      });
    }

    // Create Midtrans transaction with correct total amount
    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: payment.id,
        gross_amount: totalAmount // Use total amount including fees
      },
      customer_details: {
        first_name: consultation.user.profile.fullName,
        email: consultation.user.email,
      },
      item_details: [
        {
          id: consultationId,
          price: baseAmount,
          quantity: 1,
          name: `Consultation with Dr. ${consultation.doctor.fullName}`,
        },
        {
          id: 'platform-fee',
          price: platformFee,
          quantity: 1,
          name: 'Platform Fee',
        },
        {
          id: 'tax',
          price: tax,
          quantity: 1,
          name: 'Tax',
        }
      ]
    });

    console.log('Created Midtrans transaction:', {
      orderId: payment.id,
      totalAmount,
      breakdown: { baseAmount, platformFee, tax }
    });

    res.status(201).json({
      success: true,
      data: {
        payment,
        snapToken: transaction.token,
        breakdown: {
          consultationFee: baseAmount,
          platformFee,
          tax,
          total: totalAmount
        }
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
    console.log('Midtrans Notification:', notification);

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    // Find in both tables
    const [productTransaction, consultationPayment] = await Promise.all([
      prisma.transaction.findUnique({
        where: { id: orderId },
        include: { cart: true }
      }),
      prisma.payment.findUnique({
        where: { id: orderId },
        include: { consultation: true }
      })
    ]);

    let paymentStatus;
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      paymentStatus = fraudStatus === 'accept' ? 'PAID' : 'FAILED';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      paymentStatus = 'FAILED';
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'PENDING';
    }

    console.log('Processing payment status:', paymentStatus);

    if (productTransaction) {
      // Update transaction and clear cart if payment is successful
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: orderId },
          data: {
            paymentStatus,
            paidAt: paymentStatus === 'PAID' ? new Date() : null,
            midtransId: notification.transaction_id,
            updatedAt: new Date()
          }
        }),
        // If payment is successful, clear the cart
        ...(paymentStatus === 'PAID' ? [
          prisma.cartProduct.deleteMany({
            where: { cartId: productTransaction.cartId }
          }),
          prisma.cart.update({
            where: { id: productTransaction.cartId },
            data: { 
              status: 'COMPLETED',
              updatedAt: new Date()
            }
          })
        ] : [])
      ]);
    } else if (consultationPayment) {
      // Update consultation payment
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: orderId },
          data: {
            paymentStatus,
            paidAt: paymentStatus === 'PAID' ? new Date() : null,
            midtransId: notification.transaction_id,
            updatedAt: new Date()
          }
        }),
        prisma.consultation.update({
          where: { id: consultationPayment.consultationId },
          data: {
            status: paymentStatus === 'PAID' ? 'CONFIRMED' : 'PENDING',
            updatedAt: new Date()
          }
        })
      ]);
    }

    console.log('Payment processed successfully');
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