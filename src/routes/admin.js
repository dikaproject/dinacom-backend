const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  getAllUsers,
  getAllDoctors,
  verifyDoctor,
  createDoctor,
  updateDoctor,
  getDoctorById,
  getDashboardStats,    
  getRecentOrders,      
  getRecentUsers,       
  getDoctorSchedules,
  deleteDoctor
} = require('../controllers/adminController');
const { getAnalytics } = require('../controllers/analyticsController');

router.post('/doctors', 
  authMiddleware, 
  checkRole(['ADMIN']),
  upload.fields([
    { name: 'photoProfile', maxCount: 1 },
    { name: 'documentsProof', maxCount: 1 }
  ]),
  createDoctor
);

router.put('/doctors/:id',
  authMiddleware,
  checkRole(['ADMIN']),
  upload.fields([
    { name: 'photoProfile', maxCount: 1 },
    { name: 'documentsProof', maxCount: 1 }
  ]),
  updateDoctor
);
router.get('/doctors/:id', 
  authMiddleware, 
  checkRole(['ADMIN']), 
  getDoctorById
);

router.get('/users', authMiddleware, checkRole(['ADMIN']), getAllUsers);
router.get('/doctors', authMiddleware, checkRole(['ADMIN']), getAllDoctors);
router.patch('/doctors/:id/verify', authMiddleware, checkRole(['ADMIN']), verifyDoctor);
router.get('/analytics', authMiddleware, checkRole(['ADMIN']), getAnalytics);
// delete doctor
router.delete('/doctors/:id', authMiddleware, checkRole(['ADMIN']), deleteDoctor);


router.get('/dashboard/stats', authMiddleware, checkRole(['ADMIN']), getDashboardStats);
router.get('/dashboard/orders', authMiddleware, checkRole(['ADMIN']), getRecentOrders);
router.get('/dashboard/recent-users', authMiddleware, checkRole(['ADMIN']), getRecentUsers);
router.get('/dashboard/doctor-schedules', authMiddleware, checkRole(['ADMIN']), getDoctorSchedules);

module.exports = router;