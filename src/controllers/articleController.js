const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllArticle = async (req, res) => {
    try {
        const articles = await prisma.article.findMany({
            include: { categories: true },
        });
        res.json(articles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        // Add type check and validation for id
        if (!id) {
            return res.status(400).json({ message: 'Article ID is required' });
        }

        const article = await prisma.article.findUnique({
            where: { 
                id: id.toString() // Ensure ID is string
            },
            include: { 
                categories: true 
            },
        });

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }
        
        console.log('Found article:', article); // Debug log
        res.json(article);
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({ message: error.message });
    }
};

const createArticle = async (req, res) => {
    try {
        const { title, content, slug } = req.body;
        const thumbnail = req.file?.filename;

        let categories = req.body.categories;
        if (typeof categories === 'string') {
            categories = JSON.parse(categories); 
        }

        const existingArticle = await prisma.article.findUnique({
            where: { slug },
        });

        if (existingArticle) {
            return res.status(400).json({ message: 'Slug already exists.' });
        }

        const article = await prisma.article.create({
            data: {
                thumbnail,
                title,
                content,
                slug,
                categories: {
                    connect: categories.map((category) => ({ slug: category.slug })),
                },
            },
        });
        res.status(201).json({ message: 'Article created successfully.', article });
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ message: error.message });
    }
};


const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, categories } = req.body;
        const thumbnail = req.file?.filename;

        // Parse categories if it's a string
        let parsedCategories = categories;
        if (typeof categories === 'string') {
            parsedCategories = JSON.parse(categories);
        }

        const updatedData = {
            title,
            content,
            categories: {
                set: [], // Clear existing categories
                connect: parsedCategories.map((slug) => ({ slug }))
            }
        };

        // Only include thumbnail if it's provided
        if (thumbnail) {
            updatedData.thumbnail = thumbnail;
        }

        const article = await prisma.article.update({
            where: { 
                id: id.toString() 
            },
            data: updatedData,
            include: {
                categories: true
            }
        });

        res.json({ message: 'Article updated successfully', article });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ message: error.message });
    }
}


const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;

        const article = await prisma.article.findUnique({ where: { id } });
        if (!article) {
            return res.status(404).json({ message: 'Article not found.' });
        }

        await prisma.article.delete({ where: { id } });
        res.json({ message: 'Article deleted successfully.' });
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
