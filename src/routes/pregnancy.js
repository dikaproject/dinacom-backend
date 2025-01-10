const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { createProfile, getProfile, updateProfile } = require('../controllers/pregnancyProfileController');
const { profileUpload } = require('../middleware/upload');

router.post('/profile', 
    authMiddleware, 
    checkRole(['USER']), 
    profileUpload.single('photoProfile'), 
    createProfile
  );
  
  router.put('/profile', 
    authMiddleware, 
    checkRole(['USER']), 
    profileUpload.single('photoProfile'), 
    updateProfile
  );
  
  router.get('/profile', 
    authMiddleware, 
    checkRole(['USER']), 
    getProfile
  );

const dailyCheckupRoutes = require('./pregnancy/dailyCheckup');
const nutritionRoutes = require('./pregnancy/nutrition');
const exerciseRoutes = require('./pregnancy/exercise');
const aiRecommendationRoutes = require('./pregnancy/aiRecommendation');
const reminderRoutes = require('./whatsapp/reminder');

router.use('/daily-checkup', dailyCheckupRoutes);
router.use('/nutrition', nutritionRoutes);
router.use('/exercise', exerciseRoutes);
router.use('/ai-recommendation', aiRecommendationRoutes);
router.use('/reminder', reminderRoutes);

module.exports = router;