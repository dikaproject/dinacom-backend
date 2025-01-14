const express = require('express');
const router = express.Router();
const { register, registerDoctor, login } = require('../controllers/authController');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { documentsUpload, profileUpload, upload } = require('../middleware/upload');


// Use multiple single uploads instead of fields
router.post('/register', register);

router.post('/register-doctor', 
  // Add error handling for file upload
  (req, res, next) => {
    const uploadFields = upload.fields([
      { name: 'photoProfile', maxCount: 1 },
      { name: 'documentsProof', maxCount: 1 }
    ]);

    uploadFields(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          message: 'File upload error',
          error: err.message
        });
      }
      next();
    });
  },
  registerDoctor
);

router.post('/login', login);


module.exports = router;