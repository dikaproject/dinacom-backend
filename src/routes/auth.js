// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, registerDoctor, login } = require('../controllers/authController');
const { authMiddleware, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Assume you have multer configured

router.post('/register', register);
router.post('/register-doctor', upload.fields([
  { name: 'photoProfile', maxCount: 1 },
  { name: 'documentsProof', maxCount: 1 }
]), registerDoctor);
router.post('/login', login);

// Protected routes example
router.get('/doctor-only', authMiddleware, checkRole(['DOCTOR']), (req, res) => {
  res.json({ message: 'Doctor access only' });
});

module.exports = router;