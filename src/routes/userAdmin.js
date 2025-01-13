const express = require('express');
const router = express.Router();
const userAdminController = require('../controllers/userAdminController');
const { authMiddleware, checkRole } = require('../middleware/auth');

// Remove auth middleware temporarily for testing
router.get('/users', userAdminController.getAllUsers);
router.get('/users/:id', userAdminController.getUserById);
router.post('/users', userAdminController.createUser);
router.put('/users/:id', userAdminController.updateUser);
router.delete('/users/:id', userAdminController.deleteUser);

module.exports = router;
