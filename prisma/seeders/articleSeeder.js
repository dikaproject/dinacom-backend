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
        {
            title: 'Understanding Quantum Computing',
            slug: 'understanding-quantum-computing',
            content: 'An article explaining quantum computing.',
            thumbnail: 'https://via.placeholder.com/150',
            categories: [technologyCategory],
        },
        {
            title: 'Healthy Eating Habits',
            slug: 'healthy-eating-habits',
            content: 'An article about healthy eating.',
            thumbnail: 'https://via.placeholder.com/150',
            categories: [healthCategory],
        },
        {
            title: 'The Rise of Renewable Energy',
            slug: 'the-rise-of-renewable-energy',
            content: 'An article discussing renewable energy sources.',
            thumbnail: 'https://via.placeholder.com/150',
            categories: [technologyCategory],
        },
        {
            title: 'Mental Health Awareness',
            slug: 'mental-health-awareness',
            content: 'An article on the importance of mental health.',
            thumbnail: 'https://via.placeholder.com/150',
            categories: [healthCategory],
        },
        {
            title: 'The Impact of 5G Technology',
            slug: 'the-impact-of-5g-technology',
            content: 'An article about the effects of 5G technology.',
            thumbnail: 'https://via.placeholder.com/150',
            categories: [technologyCategory],
        },
        {
            title: 'Exercise for a Better Life',
            slug: 'exercise-for-a-better-life',
            content: 'An article about the benefits of exercise.',
            thumbnail: 'https://via.placeholder.com/150',
            categories: [healthCategory],
        },
        {
            title: 'Artificial Intelligence in Healthcare',
            slug: 'artificial-intelligence-in-healthcare',
            content: 'An article on AI applications in healthcare.',
            thumbnail: 'https://via.placeholder.com/150',
            categories: [technologyCategory, healthCategory],
        },
        {
            title: 'The Future of Space Exploration',
            slug: 'the-future-of-space-exploration',
            content: 'An article about upcoming space missions.',
            thumbnail: 'https://via.placeholder.com/150',
            categories: [technologyCategory],
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
