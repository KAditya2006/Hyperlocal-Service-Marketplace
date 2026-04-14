const express = require('express');
const router = express.Router();
const { getChats, getMessages, initiateChat, uploadImageMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { uploadImage } = require('../config/cloudinary');

router.use(protect);

router.get('/', getChats);
router.get('/:chatId', getMessages);
router.post('/initiate', initiateChat);
router.post('/upload-image', uploadImage.single('image'), uploadImageMessage);

module.exports = router;
