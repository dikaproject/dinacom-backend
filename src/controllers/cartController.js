const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getCartProducts = async (req, res) => {
    const { userId } = req.params;

    try {
        const cartProducts = await prisma.cartProduct.findMany({
            where: { userId },
            include: {
                product: true, // Memuat data produk
                user: {        // Memuat data pengguna
                    select: { email: true }, // Hanya memuat email
                },
            },
        });

        if (cartProducts.length === 0) {
            return res.status(404).json({ error: 'No products found in cart' });
        }

        res.json(cartProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch cart products' });
    }
};

const addCartProduct = async (req, res) => {
    const { productId, userId, quantity } = req.body;

    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const cartProduct = await prisma.cartProduct.upsert({
            where: {
                id: (await prisma.cartProduct.findUnique({
                    where: { 
                        productId_userId: { productId, userId }
                    }
                }).id),
            },
            update: { quantity: { increment: quantity || 1 } },
            create: { productId, userId, quantity: quantity || 1 },
        });
        

        res.status(201).json(cartProduct);
    } catch (error) {
        console.error(error); 
        res.status(500).json({ error: 'Failed to add product to cart' });
    }
};


const updateCartProduct = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be greater than zero' });
    }

    try {
        const cartProduct = await prisma.cartProduct.update({
            where: { id },
            data: { quantity },
        });
        res.json(cartProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update cart product' });
    }
};

const deleteCartProduct = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.cartProduct.delete({ where: { id } });
        res.status(204).send(); // No Content
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to remove product from cart' });
    }
};

module.exports = {
    getCartProducts,
    addCartProduct,
    updateCartProduct,
    deleteCartProduct,
};
