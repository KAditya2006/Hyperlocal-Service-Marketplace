const express = require('express');
const router = express.Router();
const { getChats, getMessages, initiateChat, markChatRead, sendTextMessage, uploadImageMessage } = require('../controllers/chatController');
const { dashboardApprovedOnly, protect, verifiedOnly } = require('../middleware/authMiddleware');
const { chatMessageLimiter } = require('../middleware/rateLimiters');
const { uploadImage } = require('../config/cloudinary');

router.use(protect);
router.use(verifiedOnly);
router.use(dashboardApprovedOnly);

router.get('/', getChats);
router.get('/:chatId', getMessages);
router.post('/initiate', initiateChat);
router.post('/:chatId/messages', chatMessageLimiter, sendTextMessage);
router.patch('/:chatId/read', markChatRead);
router.post('/upload-image', chatMessageLimiter, uploadImage.single('image'), uploadImageMessage);

module.exports = router;
