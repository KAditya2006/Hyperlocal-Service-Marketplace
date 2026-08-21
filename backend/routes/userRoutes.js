const express = require('express');
const router = express.Router();
const { updateProfile, updateAvatar, uploadKYC, getUserPublicProfile } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadAvatar: uploadAvatarMiddleware, upload } = require('../config/cloudinary');

router.get('/:userId/public-profile', protect, getUserPublicProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/avatar', protect, uploadAvatarMiddleware.single('avatar'), updateAvatar);
router.post('/upload-kyc', protect, authorize('user'), upload.single('idProof'), uploadKYC);

module.exports = router;
