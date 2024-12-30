const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const articleSeeder = async () => {
    console.log('Seeding articles...');

    const technologyCategory = await prisma.articleCategory.findUnique({
        where: { slug: 'teknologi' },
    });
    const healthCategory = await prisma.articleCategory.findUnique({
        where: { slug: 'kesehatan' },
    });

    if (!technologyCategory || !healthCategory) {
        throw new Error('Required categories not found. Please seed categories first.');
    }

    const articles = [
        {
            title: 'The Future of AI',
            slug: 'the-future-of-ai',
            content: 'An article about the future of AI.',
            thumbnail: 'https://via.placeholder.com/150',
            categories: [technologyCategory, healthCategory], 
        },
        {
            title: '10 Tips for a Healthy Lifestyle',
            slug: '10-tips-for-a-healthy-lifestyle',
            content: 'An article about health tips.',
            thumbnail: 'https://via.placeholder.com/150',
            categories: [healthCategory],
        },
    ];

    for (const article of articles) {
        await prisma.article.upsert({
            where: { slug: article.slug },
            update: {
                categories: {
                    set: article.categories.map((category) => ({ id: category.id })),
                },
            },
            create: {
                title: article.title,
                slug: article.slug,
                content: article.content,
                thumbnail: article.thumbnail,
                categories: {
                    connect: article.categories.map((category) => ({ id: category.id })),
                },
            },
        });
    }
};

module.exports = articleSeeder;
