const midtransClient = require('midtrans-client');
const prisma = require('../prisma'); // Sesuaikan dengan konfigurasi Prisma Anda

// Initialize Midtrans client
const snap = new midtransClient.Snap({
    isProduction: false, // Ganti ke true jika sudah di produksi
    serverKey: 'YOUR_SERVER_KEY', // Ganti dengan Server Key Midtrans
    clientKey: 'YOUR_CLIENT_KEY', // Ganti dengan Client Key Midtrans
});

const createTransaction = async (req, res) => {
    const { userId, cartId, totalPrice } = req.body;

    try {
        // Validasi cart
        const cart = await prisma.cart.findUnique({
            where: { id: cartId },
            include: { cartProducts: true },
        });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Buat order_id unik untuk Midtrans
        const orderId = `TRANS-${new Date().getTime()}-${cartId}`;

        // Buat transaksi di Prisma
        const transaction = await prisma.transaction.create({
            data: {
                userId,
                cartId,
                totalPrice,
                externalId: orderId,
                status: 'PENDING',
            },
        });

        // Parameter pembayaran Midtrans
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: totalPrice,
            },
            customer_details: {
                userId, // Bisa Anda kustomisasi lebih lanjut
            },
        };

        // Generate payment URL dari Midtrans
        const paymentUrl = await snap.createTransaction(parameter);

        res.status(201).json({
            message: 'Transaction created successfully',
            transaction,
            paymentUrl: paymentUrl.redirect_url,
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
};
