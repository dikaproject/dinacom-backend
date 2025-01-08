const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const {
  getAllUsers,
  getAllDoctors,
  verifyDoctor
} = require('../controllers/adminController');

router.get('/users', authMiddleware, checkRole(['ADMIN']), getAllUsers);
router.get('/doctors', authMiddleware, checkRole(['ADMIN']), getAllDoctors);
router.put('/doctors/verify', authMiddleware, checkRole(['ADMIN']), verifyDoctor);

module.exports = router;