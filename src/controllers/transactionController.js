const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const snap = require('../utils/midtrans');

const createTransaction = async (req, res) => {
    try {
        const { cartId } = req.body;
        const userId = req.user.id; // Diasumsikan user diambil dari middleware auth

        // Ambil data cart beserta produk dan kuantitasnya
        const cart = await prisma.cart.findFirst({
            where: {
                id: cartId,
                userId,
            },
            include: {
                cartProducts: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!cart || cart.cartProducts.length === 0) {
            return res.status(404).json({ message: 'Cart tidak ditemukan atau kosong' });
        }

        // Hitung total harga
        const totalPrice = cart.cartProducts.reduce((sum, cartProduct) => {
            return sum + cartProduct.quantity * cartProduct.product.price;
        }, 0);

        // Buat data transaksi di database
        const transaction = await prisma.transaction.create({
            data: {
                userId,
                cartId,
                totalPrice,
                status: 'PENDING',
            },
        });

        // Detail produk untuk Midtrans
        const itemDetails = cart.cartProducts.map((cartProduct) => ({
            id: cartProduct.product.id,
            price: Math.round(cartProduct.product.price),
            quantity: cartProduct.quantity,
            name: cartProduct.product.title,
        }));

        // Buat transaksi di Midtrans
        const midtransTransaction = await snap.createTransaction({
            transaction_details: {
                order_id: transaction.id,
                gross_amount: Math.round(totalPrice),
            },
            customer_details: {
                first_name: req.user.name, // Pastikan middleware mengisi nama
                email: req.user.email, // Pastikan middleware mengisi email
            },
            item_details: itemDetails,
        });

        res.status(201).json({
            message: 'Transaksi berhasil dibuat',
            data: {
                transaction,
                snapToken: midtransTransaction.token,
            },
        });
    } catch (error) {
        console.error('Error membuat transaksi:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat membuat transaksi' });
    }
};

const handleMidtransNotification = async (req, res) => {
    try {
        const notification = await snap.transaction.notification(req.body);
        const orderId = notification.order_id;
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;

        const transaction = await prisma.transaction.findUnique({
            where: { id: orderId },
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

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        let paymentStatus;
        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
            if (fraudStatus === 'accept') {
                paymentStatus = 'PAID';
            }
        } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
            paymentStatus = 'FAILED';
        }

        if (paymentStatus) {
            await prisma.$transaction([
                prisma.transaction.update({
                    where: { id: orderId },
                    data: {
                        status: paymentStatus,
                        paidAt: paymentStatus === 'PAID' ? new Date() : null,
                        midtransId: notification.transaction_id,
                    },
                }),
                prisma.cart.update({
                    where: { id: transaction.cartId },
                    data: {
                        status: paymentStatus === 'PAID' ? 'CONFIRMED' : 'PENDING',
                    },
                }),
            ]);
        }

        res.json({ message: 'OK' });
    } catch (error) {
        console.error('Midtrans notification error:', error);
        res.status(500).json({ message: error.message });
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

module.exports = {
    getTransaction,
    getTransactionById,
    createTransaction,
    handleMidtransNotification
};
