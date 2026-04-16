const express = require('express');
const router = express.Router();
const { updateProfile, updateAvatar, uploadKYC } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar: uploadAvatarMiddleware, upload } = require('../config/cloudinary');

router.put('/profile', protect, updateProfile);
router.put('/profile/avatar', protect, uploadAvatarMiddleware.single('avatar'), updateAvatar);
router.post('/upload-kyc', protect, upload.single('idProof'), uploadKYC);

module.exports = router;
