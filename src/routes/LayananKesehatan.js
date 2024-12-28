const express = require('express');
const router = express.Router();
const { 
  getAllLayananKesehatan, 
  getLayananKesehatanById, 
  createLayananKesehatan, 
  updateLayananKesehatan, 
  deleteLayananKesehatan 
} = require('../controllers/LayananKesehatanController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', getAllLayananKesehatan);
router.get('/:id', getLayananKesehatanById);
router.post('/', authMiddleware, checkRole(['ADMIN']), createLayananKesehatan);
router.put('/:id', authMiddleware, checkRole(['ADMIN']), updateLayananKesehatan);
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteLayananKesehatan);

module.exports = router;