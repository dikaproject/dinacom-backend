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
const { thumbnailArticleUpload } = require('../middleware/upload');

router.get('/', getAllArticle);
router.get('/:id', authMiddleware, checkRole(['ADMIN']), getArticleById);
router.post('/', authMiddleware, checkRole(['ADMIN']), thumbnailArticleUpload.single('thumbnail'), createArticle);
router.put('/:id', authMiddleware, checkRole(['ADMIN']), thumbnailArticleUpload.single('thumbnail'), updateArticle);
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteArticle);

module.exports = router;