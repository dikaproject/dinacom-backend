const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        products: true // Include TransactionProduct relation
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      totalAmount: transaction.totalAmount,
      paymentStatus: transaction.paymentStatus,
      createdAt: transaction.createdAt,
      products: transaction.products
        .map(item => `${item.productTitle} (${item.quantity})`)
        .join(', ')
    }));

    res.json(formattedTransactions);
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ message: 'Failed to get transaction history' });
  }
};

module.exports = { getTransactionHistory };