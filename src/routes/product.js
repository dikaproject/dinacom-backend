const express = require('express');
const router = express.Router();
const { 
  getAllProduct, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} = require('../controllers/productController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', getAllProduct);
router.get('/:id', getProductById);
router.post('/', authMiddleware, checkRole(['ADMIN']), createProduct);
router.put('/:id', authMiddleware, checkRole(['ADMIN']), updateProduct);
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteProduct);

module.exports = router;