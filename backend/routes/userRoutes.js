const express = require('express');
const router = express.Router();
const { updateProfile, updateAvatar } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar: uploadAvatarMiddleware } = require('../config/cloudinary');

router.put('/profile', protect, updateProfile);
router.put('/profile/avatar', protect, uploadAvatarMiddleware.single('avatar'), updateAvatar);

module.exports = router;
