const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const { 
  getUserProfile,
  getUserConsultations,
  updateUserProfile
} = require('../controllers/userController');

router.get('/profile', authMiddleware, checkRole(['USER']), getUserProfile);
router.get('/consultations', authMiddleware, checkRole(['USER']), getUserConsultations);
router.put('/profile', authMiddleware, checkRole(['USER']), updateUserProfile);

module.exports = router;