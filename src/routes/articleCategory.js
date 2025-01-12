const express = require('express');
const router = express.Router();
const articleCategoryController = require('../controllers/articleCategoryController');
const { authMiddleware, checkRole } = require('../middleware/auth');

// Public routes
router.get('/', articleCategoryController.getAllArticleCategory);
router.get('/:id', articleCategoryController.getArticleCategoryById);


router.post('/', 
  authMiddleware, 
  checkRole(['ADMIN']), 
  articleCategoryController.createArticleCategory
);

router.put('/:id', 
  authMiddleware, 
  checkRole(['ADMIN']), 
  articleCategoryController.updateArticleCategory
);

router.delete('/:id', 
  authMiddleware, 
  checkRole(['ADMIN']), 
  articleCategoryController.deleteArticleCategory
);

module.exports = router;