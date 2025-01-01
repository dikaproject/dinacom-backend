const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { createExerciseLog, getLogs } = require('../../controllers/pregnancy/exerciseController');

router.post('/', authMiddleware, createExerciseLog);
router.get('/', authMiddleware, getLogs);

module.exports = router;