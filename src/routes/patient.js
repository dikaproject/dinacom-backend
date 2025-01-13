const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const patientAdminController = require('../controllers/patientAdminController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/patients', authMiddleware, checkRole(['ADMIN']), patientAdminController.getAllPatients);
router.get('/patients/:id', authMiddleware, checkRole(['ADMIN']), patientAdminController.getPatientById);
router.post('/patients', authMiddleware, checkRole(['ADMIN']), upload.single('photoProfile'), patientAdminController.createPatient);
router.put('/patients/:id', authMiddleware, checkRole(['ADMIN']), upload.single('photoProfile'), patientAdminController.updatePatient);
router.delete('/patients/:id', authMiddleware, checkRole(['ADMIN']), patientAdminController.deletePatient);

module.exports = router;