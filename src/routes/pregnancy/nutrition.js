const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { createNutritionLog, getLogs } = require('../../controllers/pregnancy/nutritionController');

router.post('/', authMiddleware, createNutritionLog);
router.get('/', authMiddleware, getLogs);

module.exports = router;