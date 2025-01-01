const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { analyzeHealthData } = require('../../controllers/pregnancy/aiRecommendationController');

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const analysis = await analyzeHealthData(req.body);
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;