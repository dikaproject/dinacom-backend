const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const snap = require('../utils/midtrans');

const createTransaction = async (req, res) => {
    try {
        const { cartId, shippingAddressId } = req.body;
        const userId = req.user.id;

        const cart = await prisma.cart.findFirst({
            where: { id: cartId, userId },
            include: {
                cartProducts: {
                    include: { product: true },
                },
            },
        });

        if (!cart || cart.cartProducts.length === 0) {
            return res.status(404).json({ message: 'Cart tidak ditemukan atau kosong' });
        }

        // Calculate fees
        const subtotal = cart.cartProducts.reduce((sum, cartProduct) => {
            return sum + cartProduct.quantity * cartProduct.product.price;
        }, 0);

        const platformFee = Math.round(subtotal * 0.05); // 5% platform fee
        const tax = Math.round(subtotal * 0.12); // 12% tax
        const shippingCost = 10000; // Fixed shipping cost
        const totalAmount = subtotal + platformFee + tax + shippingCost;

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                cartId,
                shippingAddressId,
                subtotal,
                platformFee,
                tax,
                shippingCost,
                totalAmount,
                paymentStatus: 'PENDING',
                paymentMethod: 'MIDTRANS',
                expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
            },
        });

        // Store products in TransactionProduct
        const transactionProducts = await Promise.all(
            cart.cartProducts.map(cartProduct => 
                prisma.transactionProduct.create({
                    data: {
                        transactionId: transaction.id,
                        productId: cartProduct.product.id,
                        productTitle: cartProduct.product.title,
                        quantity: cartProduct.quantity,
                        price: cartProduct.product.price
                    }
                })
            )
        );

        const itemDetails = cart.cartProducts.map((cartProduct) => ({
            id: cartProduct.product.id,
            price: Math.round(cartProduct.product.price),
            quantity: cartProduct.quantity,
            name: cartProduct.product.title,
        }));

        

        // Add fee items
        itemDetails.push(
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
            },
            {
                id: 'shipping',
                price: shippingCost,
                quantity: 1,
                name: 'Shipping Cost',
            }
        );

        const midtransTransaction = await snap.createTransaction({
            transaction_details: {
                order_id: transaction.id,
                gross_amount: Math.round(totalAmount)
            },
            customer_details: {
                first_name: req.user.name,
                email: req.user.email
            },
            item_details: itemDetails
        });

        res.status(201).json({
            message: 'Transaksi berhasil dibuat',
            data: {
                transaction,
                token: midtransTransaction.token // Change snapToken to token
            }
        });
    } catch (error) {
        console.error('Error membuat transaksi:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat membuat transaksi' });
    }
};

const getTransaction = async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany();

        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan', error });
    }
};

const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await prisma.transaction.findUnique({
            where: { id },
        });
        if (!transaction) {
            return res.status(404).json({ message: 'transaction not found' });
        }
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getHistoryTransaction = async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                cart: {
                    include: {
                        cartProducts: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan', error });
    }
};

const cancelTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const transaction = await prisma.transaction.findFirst({
            where: { 
                id,
                userId,
                paymentStatus: 'PENDING',
            }
        });

        if (!transaction) {
            return res.status(404).json({ 
                message: 'Transaction not found or already processed' 
            });
        }

        // Update transaction status
        const updatedTransaction = await prisma.transaction.update({
            where: { id },
            data: {
                paymentStatus: 'CANCELLED',
                status: 'CANCELLED',
                updatedAt: new Date()
            }
        });

        // No need to update cart status since it's still active
        res.json({ 
            message: 'Transaction cancelled successfully',
            transaction: updatedTransaction
        });
    } catch (error) {
        console.error('Cancel transaction error:', error);
        res.status(500).json({ 
            message: 'Failed to cancel transaction',
            error: error.message 
        });
    }
};

module.exports = {
    getTransaction,
    getTransactionById,
    createTransaction,
    getHistoryTransaction,
    cancelTransaction
};
