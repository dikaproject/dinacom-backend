const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const transactionSeeder = async () => {
    console.log('Seeding Transaction...');
    
    const carts = await prisma.cart.findMany({
        include: {
            cartProducts: {
                include: {
                    product: true, // Ambil detail produk
                },
            },
        },
    });

    for (const cart of carts) {
        const totalPrice = cart.cartProducts.reduce((sum, cartProduct) => {
            return sum + cartProduct.quantity * cartProduct.product.price;
        }, 0);

        // Cek apakah transaksi untuk cart ini sudah ada
        const existingTransaction = await prisma.transaction.findFirst({
            where: { cartId: cart.id },
        });

        if (!existingTransaction) {
            await prisma.transaction.create({
                data: {
                    userId: cart.userId,
                    cartId: cart.id,
                    totalPrice, // Total price hasil perhitungan
                    status: 'PENDING',
                },
            });
        }
    }

    console.log('Transaction seeded!');
};

module.exports = transactionSeeder;
