const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllArticleCategory = async (req, res) => {
    try {
        const ArticleCategory = await prisma.ArticleCategory.findMany();
        res.json(ArticleCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getArticleCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const ArticleCategory = await prisma.ArticleCategory.findUnique({
            where: { id },
        });
        if (!ArticleCategory) {
            return res.status(404).json({ message: 'Article Category not found' });
        }
        res.json(ArticleCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createArticleCategory = async (req, res) => {
    try {
        const { name, slug } = req.body;
        const ArticleCategory = await prisma.articleCategory.create({
            data: {
                name,
                slug
            }
        });
        res.status(201).json(ArticleCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateArticleCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const ArticleCategory = await prisma.articleCategory.update({
            where: { id },
            data: req.body
        });
        res.json(ArticleCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteArticleCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.articleCategory.delete({
            where: { id }
        });
        res.json({ message: 'Article Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllArticleCategory,
    getArticleCategoryById,
    createArticleCategory,
    updateArticleCategory,
    deleteArticleCategory
};