const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../../middleware/auth');
const { analyzeHealthData } = require('../../controllers/pregnancy/aiRecommendationController');

// Ensure user is authenticated and has USER role
router.post('/analyze', 
  authMiddleware, 
  checkRole(['USER']), 
  analyzeHealthData
);

module.exports = router;