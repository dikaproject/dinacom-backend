const express = require('express');
const router = express.Router();
const { 
  getAllArticleCategory, 
  getArticleCategoryById, 
  createArticleCategory, 
  updateArticleCategory, 
  deleteArticleCategory 
} = require('../controllers/articleCategoryController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', getAllArticleCategory);
router.get('/:id', authMiddleware, checkRole(['ADMIN']), getArticleCategoryById);
router.post('/', authMiddleware, checkRole(['ADMIN']), createArticleCategory);
router.put('/:id', authMiddleware, checkRole(['ADMIN']), updateArticleCategory);
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteArticleCategory);

module.exports = router;