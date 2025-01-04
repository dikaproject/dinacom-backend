const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  getCartProducts,
  addCartProduct,
  updateCartProduct,
  deleteCartProduct,
} = require('../controllers/cartController');

const router = express.Router();

router.get('/:userId', authMiddleware, getCartProducts);
router.post('/', authMiddleware, addCartProduct);
router.patch('/:id', authMiddleware, updateCartProduct);
router.delete('/:id', authMiddleware, deleteCartProduct);

module.exports = router;
