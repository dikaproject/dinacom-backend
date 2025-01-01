const express = require('express');
const router = express.Router();
const { register, registerDoctor, login } = require('../controllers/authController');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { documentsUpload, profileUpload } = require('../middleware/upload');


// Use multiple single uploads instead of fields
router.post('/register', register);

router.post('/register-doctor',
  // Handle each file upload separately
  profileUpload.single('photoProfile'),
  documentsUpload.single('documentsProof'),
  registerDoctor
);

router.post('/login', login);

router.get('/doctor-only', authMiddleware, checkRole(['DOCTOR']), (req, res) => {
  res.json({ message: 'Doctor access only' });
});

module.exports = router;