const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllProductCategory = async (req, res) => {
    try {
        const productCategory = await prisma.productCategory.findMany();
        res.json(productCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProductCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const productCategory = await prisma.productCategory.findUnique({
            where: { id },
        });
        if (!productCategory) {
            return res.status(404).json({ message: 'Product Category not found' });
        }
        res.json(productCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createProductCategory = async (req, res) => {
    try {
        const { name, slug } = req.body;

        const existingCategory = await prisma.productCategory.findUnique({
            where: { slug },
        });
        if (existingCategory) {
            return res.status(400).json({ message: 'Slug sudah ada' });
        }

        const productCategory = await prisma.productCategory.create({
            data: {
                name,
                slug
            }
        });
        res.status(201).json({ message: 'Product Category berhasil ditambahkan', productCategory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProductCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug } = req.body;

        const existingCategory = await prisma.productCategory.findUnique({
            where: { slug },
        });
        if (existingCategory) {
            return res.status(400).json({ message: 'Slug sudah ada' });
        }

        const productCategory = await prisma.productCategory.update({
            where: { id },
            data: { name, slug }
        });
        res.json(productCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteProductCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.productCategory.delete({
            where: { id }
        });
        res.json({ message: 'Product Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllProductCategory,
    getProductCategoryById,
    createProductCategory,
    updateProductCategory,
    deleteProductCategory
};