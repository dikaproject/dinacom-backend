const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get cart products
const getCartProducts = async (req, res) => {
    try {
        const userId = req.user.id;

        const cartProducts = await prisma.cartProduct.findMany({
            where: {
                cart: { 
                    userId,
                    status: 'ACTIVE' 
                }
            },
            include: {
                product: true,
                cart: true
            }
        });

        res.json(cartProducts);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ message: 'Failed to fetch cart' });
    }
};


  const addCartProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let cart = await prisma.cart.findFirst({
            where: { 
                userId,
                status: 'ACTIVE'
            },
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { 
                    userId,
                    status: 'ACTIVE'
                },
            });
        }

        const basePrice = product.price;
        const subtotal = basePrice * quantity;

        const cartProduct = await prisma.cartProduct.create({
            data: {
                cartId: cart.id,
                productId,
                quantity,
                basePrice,
                subtotal
            },
            include: {
                product: true,
            },
        });

        res.status(201).json(cartProduct);
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Failed to add product to cart' });
    }
};

const updateCartProduct = async (req, res) => {
    try {
        const { cartProductId } = req.params;
        const { quantity } = req.body;
        const userId = req.user.id;

        const existingProduct = await prisma.cartProduct.findFirst({
            where: {
                id: cartProductId,
                cart: { 
                    userId,
                    status: 'ACTIVE'
                }
            },
            include: { product: true }
        });

        if (!existingProduct) {
            return res.status(404).json({ error: 'Cart Product not found' });
        }

        const subtotal = existingProduct.basePrice * quantity;

        const updatedProduct = await prisma.cartProduct.update({
            where: { id: cartProductId },
            data: { 
                quantity,
                subtotal
            },
            include: { product: true }
        });

        res.json(updatedProduct);
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Failed to update cart' });
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

const getShippingAddresses = async (req, res) => {
    try {
        const userId = req.user.id;

        const addresses = await prisma.shippingAddress.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(addresses);
    } catch (error) {
        console.error('Get shipping addresses error:', error);
        res.status(500).json({ error: 'Failed to fetch shipping addresses' });
    }
};

const addShippingAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            fullName,
            phoneNumber,
            province,
            city,
            district,
            address,
            postalCode,
            isDefault
        } = req.body;

        // Validate required fields
        if (!fullName || !phoneNumber || !province || !city || !district || !address || !postalCode) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // If this is set as default, unset other default addresses
        if (isDefault) {
            await prisma.shippingAddress.updateMany({
                where: { userId },
                data: { isDefault: false }
            });
        }

        const shippingAddress = await prisma.shippingAddress.create({
            data: {
                userId,
                fullName,
                phoneNumber,
                province,
                city,
                district,
                address,
                postalCode,
                isDefault: isDefault || false
            }
        });

        res.status(201).json(shippingAddress);
    } catch (error) {
        console.error('Add shipping address error:', error);
        res.status(500).json({ error: 'Failed to add shipping address' });
    }
};



module.exports = {
    getCartProducts,
    addCartProduct,
    updateCartProduct,
    deleteCartProduct,
    getShippingAddresses,
    addShippingAddress
};
