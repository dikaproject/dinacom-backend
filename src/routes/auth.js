const express = require('express');
const router = express.Router();
const { register, registerDoctor, login } = require('../controllers/authController');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { documentsUpload, profileUpload } = require('../middleware/upload');


// Use multiple single uploads instead of fields
router.post('/register', register);

router.post('/register-doctor', 
  profileUpload.fields([
    { name: 'photoProfile', maxCount: 1 },
    { name: 'documentsProof', maxCount: 1 }
  ]), 
  registerDoctor
);

router.post('/login', login);


module.exports = router;