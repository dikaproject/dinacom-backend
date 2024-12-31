const express = require('express');
const CommunityController = require('../controllers/communityController');

const router = express.Router();

router.get('/', CommunityController.getAllCommunities);
router.get('/:id', CommunityController.getCommunityById);
router.post('/', CommunityController.createCommunity);
router.put('/:id', CommunityController.updateCommunity);
router.delete('/:id', CommunityController.deleteCommunity);

module.exports = router;
