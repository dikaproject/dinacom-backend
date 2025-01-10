const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../../controllers/whatsapp/webhooks');

router.get('/', (req, res) => {
    res.status(200).send('Webhook is ready');
  });

router.post('/', handleWebhook);

module.exports = router;