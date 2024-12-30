const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllArticle = async (req, res) => {
    try {
        const articles = await prisma.article.findMany({
            include: {
                categories: true, 
            },
        });
        res.json(articles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        const article = await prisma.article.findUnique({
            where: { id },
            include: {
                categories: true, 
            },
        });
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.json(article);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createArticle = async (req, res) => {
    try {
        const { thumbnail, title, content, slug, categories } = req.body;
        const article = await prisma.article.create({
            data: {
                thumbnail,
                title,
                content,
                slug,
                categories: {
                    connect: categories.map(category => ({ slug: category.slug })),
                },
            },
        });
        res.status(201).json(article);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { thumbnail, title, content, slug, categories } = req.body;

        const existingArticle = await prisma.article.findUnique({
            where: { slug },
        });

        if (existingArticle && existingArticle.id !== id) {
            return res.status(400).json({ message: 'Slug sudah digunakan oleh artikel lain.' });
        }

        const article = await prisma.article.update({
            where: { id },
            data: {
                thumbnail,
                title,
                content,
                slug,
                categories: {
                    connect: categories.map(category => ({ slug: category.slug })),
                },
            },
        });
        res.json(article);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.article.delete({
            where: { id },
        });
        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllArticle,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
};
