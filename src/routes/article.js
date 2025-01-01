const express = require('express');
const router = express.Router();
const { 
  getAllArticle, 
  getArticleById, 
  createArticle, 
  updateArticle, 
  deleteArticle 
} = require('../controllers/articleController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', getAllArticle);
router.get('/:id', authMiddleware, checkRole(['ADMIN']), getArticleById);
router.post('/', authMiddleware, checkRole(['ADMIN']), createArticle);
router.put('/:id', authMiddleware, checkRole(['ADMIN']), updateArticle);
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteArticle);

module.exports = router;