
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get cart products
const getCartProducts = async (req, res) => {
    const { userId } = req.params;

    try {
        const cartProducts = await prisma.cartProduct.findMany({
            where: {
                cart: { userId }, 
            },
            include: {
                product: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                        thumbnail: true,
                        description: true
                    }
                }
            },
        });

        if (cartProducts.length === 0) {
            return res.status(200).json({ message: 'Tidak ada produk di keranjang' });
        }

        res.json(cartProducts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cart products' });
    }
};

const addCartProduct = async (req, res) => {
    const { userId, productId, quantity } = req.body;

    try {
        if (!userId || !productId) {
            return res.status(400).json({ error: 'User ID and Product ID are required' });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let cart = await prisma.cart.findFirst({
            where: { userId },
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
            });
        }

        const cartProduct = await prisma.cartProduct.create({
            data: {
                cartId: cart.id, 
                productId,
                quantity: quantity || 1, 
            },
        });

        res.status(201).json(cartProduct);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add product to cart' });
    }
};


const updateCartProduct = async (req, res) => {
    const { cartProductId: id } = req.params; 
    const { quantity } = req.body;

    try {
        if (!id || quantity === undefined) {
            return res.status(400).json({ error: 'Cart Product ID and quantity are required' });
        }

        if (quantity === 0) {
            await prisma.cartProduct.delete({
                where: { id },
            });
            return res.status(200).json({ message: 'Product removed from cart' });
        }

        const cartProduct = await prisma.cartProduct.update({
            where: { id },
            data: { quantity },
        });

        res.status(200).json(cartProduct);
    } catch (error) {
        console.error('Error updating cart product:', error.message, error.stack);

        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Cart Product not found' });
        }

        res.status(500).json({ error: 'Failed to update cart product' });
    }
};



const deleteCartProduct = async (req, res) => {
    const { cartProductId } = req.params;

    try {
        if (!cartProductId) {
            return res.status(400).json({ error: 'Cart Product ID is required' });
        }

        const deletedProduct = await prisma.cartProduct.delete({
            where: { id: cartProductId },
        });

        res.status(200).json({
            message: 'Cart product successfully deleted',
            deletedProduct,
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Cart Product not found' });
        }
        res.status(500).json({ error: 'Failed to remove product from cart' });
    }
};


module.exports = {
    getCartProducts,
    addCartProduct,
    updateCartProduct,
    deleteCartProduct,
};
