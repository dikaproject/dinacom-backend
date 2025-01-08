const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { updateProfile, updatePassword } = require('../controllers/settingsController');

router.put('/profile', authMiddleware, updateProfile);
router.put('/password', authMiddleware, updatePassword);

module.exports = router;