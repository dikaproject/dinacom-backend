const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const productSeeder = async () => {
    console.log('Seeding products...');

    // Ambil semua kategori produk
    const categories = await prisma.productCategory.findMany();
    if (categories.length === 0) {
        throw new Error('No product categories found. Please seed categories first.');
    }

    const products = [
        {
            title: 'Paracetamol',
            slug: 'paracetamol',
            description: 'Obat pereda nyeri dan penurun demam',
            thumbnail: 'https://via.placeholder.com/150',
            price: Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000,
        },
        {
            title: 'Amoxicillin',
            slug: 'amoxicillin',
            description: 'Antibiotik untuk mengobati infeksi bakteri',
            thumbnail: 'https://via.placeholder.com/150',
            price: Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000,
        },
        {
            title: 'Ibuprofen',
            slug: 'ibuprofen',
            description: 'Obat antiinflamasi nonsteroid untuk nyeri',
            thumbnail: 'https://via.placeholder.com/150',
            price: Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000,
        },
        {
            title: 'Cetirizine',
            slug: 'cetirizine',
            description: 'Obat antihistamin untuk alergi',
            thumbnail: 'https://via.placeholder.com/150',
            price: Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000,
        },
        {
            title: 'Loperamide',
            slug: 'loperamide',
            description: 'Obat untuk mengatasi diare',
            thumbnail: 'https://via.placeholder.com/150',
            price: Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000,
        },
        {
            title: 'Omeprazole',
            slug: 'omeprazole',
            description: 'Obat untuk mengatasi masalah lambung',
            thumbnail: 'https://via.placeholder.com/150',
            price: Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000,
        },
        {
            title: 'Simvastatin',
            slug: 'simvastatin',
            description: 'Obat untuk menurunkan kolesterol',
            thumbnail: 'https://via.placeholder.com/150',
            price: Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000,
        },
        {
            title: 'Metformin',
            slug: 'metformin',
            description: 'Obat untuk mengontrol gula darah pada diabetes',
            thumbnail: 'https://via.placeholder.com/150',
            price: Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000,
        },
        {
            title: 'Amlodipine',
            slug: 'amlodipine',
            description: 'Obat untuk mengatasi hipertensi',
            thumbnail: 'https://via.placeholder.com/150',
            price: Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000,
        },
        {
            title: 'Levothyroxine',
            slug: 'levothyroxine',
            description: 'Obat untuk mengatasi hipotiroidisme',
            thumbnail: 'https://via.placeholder.com/150',
            price: Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000,
        },
    ];

    const getRandomCategory = () =>
        categories[Math.floor(Math.random() * categories.length)];

    for (const product of products) {
        await prisma.product.upsert({
            where: { slug: product.slug },
            update: {
                title: product.title,
                description: product.description,
                thumbnail: product.thumbnail,
                price: product.price,
                category: {
                    connect: { id: getRandomCategory().id },
                },
            },
            create: {
                title: product.title,
                slug: product.slug,
                description: product.description,
                thumbnail: product.thumbnail,
                price: product.price,
                category: {
                    connect: { id: getRandomCategory().id },
                },
            },
        });
    }

    console.log('Products seeded!');
};

module.exports = productSeeder;
