const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getChatCommunity, sendChatCommunity} = require('../controllers/communityChatController');

router.get('/', authMiddleware, getChatCommunity);
router.post('/', authMiddleware, sendChatCommunity);

module.exports = router;
