const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const articleCategorySeeder = async () => {
    console.log('Seeding article categories...');

    const categories = [
        { name: 'Teknologi', slug: 'teknologi' },
        { name: 'Kesehatan', slug: 'kesehatan' },
        { name: 'Gaya Hidup', slug: 'gaya-hidup' },
        { name: 'Pendidikan', slug: 'pendidikan' },
        { name: 'Olahraga', slug: 'olahraga' },
        { name: 'Bisnis', slug: 'bisnis' },
        { name: 'Seni', slug: 'seni' },
        { name: 'Travel', slug: 'travel' },
        { name: 'Makanan', slug: 'makanan' },
        { name: 'Teknologi Informasi', slug: 'teknologi-informasi' },
    ];

    for (const category of categories) {
        await prisma.articleCategory.upsert({
            where: { slug: category.slug },
            update: {},
            create: category,
        });
    }
};

module.exports = articleCategorySeeder;
