const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: 'uploads/profiles/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Update doctor profile settings
router.put('/profile', 
  authMiddleware, 
  checkRole(['DOCTOR']), 
  upload.single('photoProfile'),
  async (req, res) => {
    try {
      const {
        fullName,
        phoneNumber,
        province,
        city,
        district,
        address,
        postalCode,
        educationBackground
      } = req.body;

      const updateData = {
        fullName,
        phoneNumber,
        provinsi: province,
        kabupaten: city,
        kecamatan: district,
        address,
        codePos: postalCode,
        educationBackground
      };

      if (req.file) {
        updateData.photoProfile = req.file.filename;
      }

      const doctor = await prisma.doctor.update({
        where: { userId: req.user.id },
        data: updateData
      });

      res.json(doctor);
    } catch (error) {
      console.error('Update doctor profile error:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Change password
router.put('/password',
  authMiddleware,
  checkRole(['DOCTOR']),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword }
      });

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;