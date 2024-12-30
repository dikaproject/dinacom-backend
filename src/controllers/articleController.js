const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllArticle = async (req, res) => {
    try {
        const Article = await prisma.Article.findMany();
        res.json(Article);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        const Article = await prisma.Article.findUnique({
            where: { id },
        });
        if (!Article) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.json(Article);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createArticle = async (req, res) => {
    try {
        const { name, slug } = req.body;
        const Article = await prisma.article.create({
            data: {
                name,
                slug,
                thumbnail,
                title,
                content,
                categoryId: categoryId,
                slug        
            },
            include: {
                category: true,
              }
        });
        res.status(201).json(Article);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const Article = await prisma.article.update({
            where: { id },
            data: req.body
        });
        res.json(Article);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.article.delete({
            where: { id }
        });
        res.json({ message: 'Article  deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllArticle,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle
};