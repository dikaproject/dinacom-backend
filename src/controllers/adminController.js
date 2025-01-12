const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      include: {
        profile: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        },
        layananKesehatan: true
      }
    });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        verificationStatus: status,
        verifiedAt: status === 'APPROVED' ? new Date() : null
      },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        },
        layananKesehatan: true
      }
    });

    res.json(doctor);
  } catch (error) {
    console.error('Verify doctor error:', error);
    res.status(500).json({ message: error.message });
  }
};

const createDoctor = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      strNumber,
      sipNumber,
      phoneNumber,
      provinsi,
      kabupaten,
      kecamatan,
      address,
      codePos,
      layananKesehatanId,
      educationBackground
    } = req.body;

    // Log received files
    console.log('Received files:', req.files);

    const photoProfile = req.files?.photoProfile?.[0]?.filename;
    const documentsProof = req.files?.documentsProof?.[0]?.filename;

    // Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    const doctor = await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(password, 10),
          role: 'DOCTOR'
        }
      });

      return prisma.doctor.create({
        data: {
          userId: user.id,
          fullName,
          strNumber,
          sipNumber,
          phoneNumber,
          provinsi,
          kabupaten,
          kecamatan,
          address,
          codePos,
          layananKesehatanId,
          educationBackground,
          photoProfile,
          documentsProof,
          verificationStatus: 'PENDING'
        },
        include: {
          user: {
            select: {
              email: true,
              role: true
            }
          },
          layananKesehatan: true
        }
      });
    });

    res.status(201).json(doctor);
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({ 
      message: 'Failed to create doctor',
      error: error.message 
    });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      strNumber,
      sipNumber,
      phoneNumber,
      provinsi,
      kabupaten,
      kecamatan,
      address,
      codePos,
      layananKesehatanId,
      educationBackground
    } = req.body;

    // Check if doctor exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingDoctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Prepare update data
    const updateData = {
      fullName,
      strNumber,
      sipNumber,
      phoneNumber,
      provinsi,
      kabupaten,
      kecamatan,
      address,
      codePos,
      layananKesehatanId,
      educationBackground,
      updatedAt: new Date()
    };

    // Handle photo profile upload
    if (req.files && req.files['photoProfile']) {
      const photoProfile = req.files['photoProfile'][0];
      updateData.photoProfile = photoProfile.filename;
      
      // Delete old photo if exists
      if (existingDoctor.photoProfile) {
        const fs = require('fs');
        const path = require('path');
        const oldPath = path.join(__dirname, '../../uploads/profiles', existingDoctor.photoProfile);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    // Handle documents proof upload
    if (req.files && req.files['documentsProof']) {
      const documentsProof = req.files['documentsProof'][0];
      updateData.documentsProof = documentsProof.filename;
      
      // Delete old document if exists
      if (existingDoctor.documentsProof) {
        const fs = require('fs');
        const path = require('path');
        const oldPath = path.join(__dirname, '../../uploads/documents', existingDoctor.documentsProof);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    // Update doctor data
    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        },
        layananKesehatan: true
      }
    });

    res.json({
      message: 'Doctor updated successfully',
      data: updatedDoctor
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ 
      message: 'Failed to update doctor',
      error: error.message 
    });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        },
        layananKesehatan: true
      }
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get current counts
    const [
      totalDoctors,
      lastMonthDoctors,
      totalUsers,
      lastMonthUsers,
      totalProducts,
      lastMonthProducts
    ] = await Promise.all([
      prisma.doctor.count(),
      prisma.doctor.count({
        where: { createdAt: { lt: now, gte: lastMonth } }
      }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({
        where: {
          role: 'USER',
          createdAt: { lt: now, gte: lastMonth }
        }
      }),
      prisma.product.count(),
      prisma.product.count({
        where: { createdAt: { lt: now, gte: lastMonth } }
      })
    ]);

    // Get revenue data
    const [totalRevenue, lastMonthRevenue] = await Promise.all([
      prisma.transaction.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true }
      }),
      prisma.transaction.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: { lt: now, gte: lastMonth }
        },
        _sum: { totalAmount: true }
      })
    ]);

    // Calculate growth percentages
    const doctorsGrowth = ((lastMonthDoctors / totalDoctors) * 100) - 100;
    const usersGrowth = ((lastMonthUsers / totalUsers) * 100) - 100;
    const productsGrowth = ((lastMonthProducts / totalProducts) * 100) - 100;
    const revenueGrowth = ((lastMonthRevenue._sum.totalAmount || 0) / (totalRevenue._sum.totalAmount || 1) * 100) - 100;

    res.json({
      totalDoctors,
      doctorsGrowth,
      totalUsers,
      usersGrowth,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      revenueGrowth,
      totalProducts,
      productsGrowth
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecentOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const orders = await prisma.transaction.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        cart: {
          include: {
            cartProducts: {
              include: { product: true }
            }
          }
        }
      }
    });

    const formattedOrders = orders.map(order => ({
      id: order.id,
      customer: `Customer ${order.userId.slice(-4)}`,
      product: order.cart.cartProducts[0]?.product.title || 'N/A',
      status: order.paymentStatus,
      amount: order.totalAmount,
      date: order.createdAt
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecentUsers = async (req, res) => {
  try {
    const recentUsers = await prisma.user.findMany({
      where: { role: 'USER' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { profile: true }
    });

    const formattedUsers = recentUsers.map(user => ({
      id: user.id,
      name: user.profile?.fullName || `User ${user.id.slice(-4)}`,
      joinDate: user.createdAt,
      status: 'Active',
      avatar: user.profile?.photoProfile
    }));

    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctorSchedules = async (req, res) => {
  try {
    const today = new Date();
    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        dayOfWeek: today.getDay(),
        isAvailable: true
      },
      include: {
        doctor: {
          include: {
            user: true
          }
        }
      },
      take: 5
    });

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getAllDoctors,
  verifyDoctor,
  createDoctor,
  updateDoctor,
  getDoctorById,
  getDashboardStats,
  getRecentOrders,
  getRecentUsers,
  getDoctorSchedules
};