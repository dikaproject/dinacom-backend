const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cartSeeder = async () => {
    console.log('Seeding Cart and CartProduct data...');

    const users = await prisma.user.findMany();
    if (users.length === 0) {
        throw new Error('No users found in the database. Please add users first.');
    }

    const products = await prisma.product.findMany();
    if (products.length === 0) {
        throw new Error('No products found in the database. Please add products first.');
    }

    console.log(`Found ${users.length} users and ${products.length} products.`);

    // Tambahkan keranjang dan produk untuk setiap pengguna
    for (const user of users) {
        console.log(`Creating cart for user: ${user.email}`);

        // Buat cart untuk pengguna
        const cart = await prisma.cart.create({
            data: {
                userId: user.id,
            },
        });

        console.log(`Cart created for user: ${user.email}`);

        // Tambahkan beberapa produk ke cart
        for (const product of products.slice(0, 3)) { // Ambil 3 produk pertama
            await prisma.cartProduct.create({
                data: {
                    cartId: cart.id,
                    productId: product.id,
                    quantity: Math.floor(Math.random() * 5) + 1, // Jumlah acak 1-5
                },
            });
        }

        console.log(`Added products to cart for user: ${user.email}`);
    }

    console.log('Seeding completed.');
};

module.exports = cartSeeder;
