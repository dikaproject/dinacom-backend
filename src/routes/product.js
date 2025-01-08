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
const { productUpload } = require('../middleware/upload');

router.get('/', getAllProduct);
router.get('/:id', getProductById);
router.post('/', authMiddleware, checkRole(['ADMIN']), productUpload.single('thumbnail'), createProduct);
router.put('/:id', authMiddleware, checkRole(['ADMIN']), productUpload.single('thumbnail'), updateProduct);
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteProduct);

module.exports = router;