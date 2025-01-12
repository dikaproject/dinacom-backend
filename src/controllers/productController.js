const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllProduct = async (req, res) => {
    try {
        const { minPrice, maxPrice, categoryId } = req.query;

        const filters = {};

        if (minPrice || maxPrice) {
            filters.price = {};
            if (minPrice) filters.price.gte = parseFloat(minPrice); 
            if (maxPrice) filters.price.lte = parseFloat(maxPrice);
        }

        if (categoryId) {
            filters.categoryId = categoryId; 
        }

        const products = await prisma.product.findMany({
            where: filters,
            include: { category: true },
        });

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: { category: true }, 
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const { title, slug, description, price, categoryId } = req.body;
        const thumbnail = req.file?.filename;

        const generatedSlug = slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const existingProduct = await prisma.product.findUnique({
            where: { slug: generatedSlug },
        });
        if (existingProduct) {
            return res.status(400).json({ message: 'Slug already exists.' });
        }

        const product = await prisma.product.create({
            data: {
                thumbnail,
                title,
                slug: generatedSlug,
                description,
                price,
                category: { connect: { id: categoryId } }, 
            },
        });
        res.status(201).json({ message: 'Product created successfully.', product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, description, price, categoryId } = req.body;
        const thumbnail = req.file?.filename;

        const generatedSlug = slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const existingProduct = await prisma.product.findUnique({
            where: { slug: generatedSlug },
        });

        if (existingProduct && existingProduct.id !== id) {
            return res.status(400).json({ message: 'Slug already used by another product.' });
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                thumbnail,
                title,
                slug: generatedSlug,
                description,
                price,
                category: { connect: { id: categoryId } }, // Directly connect to the new category by ID
            },
        });
        res.json({ message: 'Product updated successfully.', product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        await prisma.product.delete({ where: { id } });
        res.json({ message: 'Product deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProductBySlug = async (req, res) => {
    try {
      const { slug } = req.params;
      const product = await prisma.product.findUnique({
        where: { slug },
        include: { category: true },
      });
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

module.exports = {
    getAllProduct,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductBySlug,
};
