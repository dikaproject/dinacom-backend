const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAnalytics = async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Get overall statistics
    const totalStats = await prisma.$transaction([
      // Total Users
      prisma.user.count({ where: { role: 'USER' } }),
      // Total Doctors
      prisma.doctor.count(),
      // Total Revenue
      prisma.transaction.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true }
      }),
      // Total Products Sold
      prisma.cartProduct.aggregate({
        where: {
          cart: {
            transactions: {
              some: {
                paymentStatus: 'PAID',
                createdAt: { gte: startDate }
              }
            }
          }
        },
        _sum: { quantity: true }
      })
    ]);

    // Get doctors growth
    const doctorsGrowth = await prisma.doctor.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' }
    });

    // Get user growth
    const userAcquisition = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate },
        role: 'USER'
      },
      orderBy: { createdAt: 'asc' }
    });

    // Get revenue analysis with more detail
    const revenueAnalytics = await prisma.transaction.groupBy({
      by: ['createdAt'],
      _sum: {
        totalAmount: true,
        subtotal: true,
        platformFee: true,
        tax: true
      },
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Get product sales with more detail
    const productSales = await prisma.cart.findMany({
      where: {
        transactions: {
          some: {
            paymentStatus: 'PAID',
            createdAt: { gte: startDate }
          }
        }
      },
      include: {
        cartProducts: {
          include: {
            product: {
              select: {
                title: true,
                price: true,
                category: { select: { name: true } }
              }
            }
          }
        },
        transactions: {
          where: {
            paymentStatus: 'PAID',
            createdAt: { gte: startDate }
          },
          select: {
            createdAt: true
          }
        }
      }
    });

    // Group product sales by product
    const groupedProductSales = productSales.reduce((acc, cart) => {
      cart.cartProducts.forEach(cartProduct => {
        const key = cartProduct.product.title;
        if (!acc[key]) {
          acc[key] = {
            productName: key,
            category: cartProduct.product.category.name,
            totalQuantity: 0,
            totalRevenue: 0,
            createdAt: cart.transactions[0]?.createdAt || cart.createdAt
          };
        }
        acc[key].totalQuantity += cartProduct.quantity;
        acc[key].totalRevenue += cartProduct.quantity * cartProduct.product.price;
      });
      return acc;
    }, {});

    // Sort product sales by quantity
    const sortedProductSales = Object.values(groupedProductSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    // Get consultation statistics
    const consultationStats = await prisma.consultation.groupBy({
      by: ['status', 'createdAt'],
      _count: { id: true },
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      overview: {
        totalUsers: totalStats[0],
        totalDoctors: totalStats[1],
        totalRevenue: totalStats[2]._sum.totalAmount || 0,
        totalProductsSold: totalStats[3]._sum.quantity || 0
      },
      doctorsGrowth,
      userAcquisition,
      revenueAnalytics: revenueAnalytics.map(item => ({
        createdAt: item.createdAt,
        revenue: Number(item._sum.totalAmount) || 0,
        subtotal: Number(item._sum.subtotal) || 0,
        platformFee: Number(item._sum.platformFee) || 0,
        tax: Number(item._sum.tax) || 0
      })),
      productSales: sortedProductSales,
      consultationStats
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics };
