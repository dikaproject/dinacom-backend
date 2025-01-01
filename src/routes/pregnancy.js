const express = require('express');
const router = express.Router();

const dailyCheckupRoutes = require('./pregnancy/dailyCheckup');
const nutritionRoutes = require('./pregnancy/nutrition');
const exerciseRoutes = require('./pregnancy/exercise');
const aiRecommendationRoutes = require('./pregnancy/aiRecommendation');
const reminderRoutes = require('./whatsapp/reminder');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { createProfile } = require('../controllers/pregnancyProfileController');

router.post('/profile', authMiddleware, checkRole(['USER']), createProfile);

router.use('/daily-checkup', dailyCheckupRoutes);
router.use('/nutrition', nutritionRoutes);
router.use('/exercise', exerciseRoutes);
router.use('/ai-recommendation', aiRecommendationRoutes);
router.use('/reminder', reminderRoutes);

module.exports = router;