const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../../middleware/auth');
const { analyzeHealthData, generateHealthInsights } = require('../../controllers/pregnancy/aiRecommendationController');

// Ensure user is authenticated and has USER role
router.post('/analyze', 
  authMiddleware, 
  checkRole(['USER']), 
  analyzeHealthData
);

router.post('/insights', 
  authMiddleware, 
  checkRole(['USER']), 
  generateHealthInsights
);

module.exports = router;