const express = require('express');
const auth = require('../middleware/auth');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.get('/', auth, messageController.getConversationsList);
router.get('/:otherUserId', auth, messageController.getConversation);
router.post('/:receiverId', auth, messageController.sendMessage);

module.exports = router;
