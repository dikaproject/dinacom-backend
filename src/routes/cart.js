const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  getCartProducts,
  addCartProduct,
  updateCartProduct,
  deleteCartProduct,
  getShippingAddresses,
  addShippingAddress
} = require('../controllers/cartController');

const router = express.Router();

router.get('/user', authMiddleware, getCartProducts);
router.get('/shipping-addresses', authMiddleware, getShippingAddresses);
router.post('/shipping-address', authMiddleware, addShippingAddress);
router.post('/', authMiddleware, addCartProduct);
router.patch('/:cartProductId', authMiddleware, updateCartProduct);
router.delete('/:cartProductId', authMiddleware, deleteCartProduct);


module.exports = router;
