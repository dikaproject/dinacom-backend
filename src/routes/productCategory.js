const express = require('express');
const router = express.Router();
const { 
  getAllProductCategory, 
  getProductCategoryById, 
  createProductCategory, 
  updateProductCategory, 
  deleteProductCategory 
} = require('../controllers/productCategoryController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', getAllProductCategory);
router.get('/:id', authMiddleware, checkRole(['ADMIN']), getProductCategoryById);
router.post('/', authMiddleware, checkRole(['ADMIN']), createProductCategory);
router.put('/:id', authMiddleware, checkRole(['ADMIN']), updateProductCategory);
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteProductCategory);

module.exports = router;