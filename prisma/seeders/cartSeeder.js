const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const cartSeeder = async () => {
    console.log('Seeding CartProduct data...');

    const users = await prisma.user.findMany();
    if (users.length === 0) {
        throw new Error('No users found in the database. Please add users first.');
    }

    const products = await prisma.product.findMany();
    if (products.length === 0) {
        throw new Error('No products found in the database. Please add products first.');
    }

    console.log(`Found ${users.length} users and ${products.length} products.`);

    // Tambahkan produk ke keranjang untuk setiap pengguna
    for (const user of users) {
        console.log(`Adding cart items for user: ${user.email}`);

        for (const product of products.slice(0, 2)) { 
            const cartProduct = await prisma.cartProduct.create({
                data: {
                    productId: product.id,
                    userId: user.id,
                    quantity: Math.floor(Math.random() * 5) + 1, 
                },
            });

        }
    }

    console.log('Seeding completed.');

};

module.exports = cartSeeder;