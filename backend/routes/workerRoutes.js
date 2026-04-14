const express = require('express');
const router = express.Router();
const { getWorkerProfile, updateProfile, uploadKYC } = require('../controllers/workerController');
const { protect, authorize, verifiedOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.use(protect);
router.use(authorize('worker'));

router.get('/profile', getWorkerProfile);
router.patch('/profile', verifiedOnly, updateProfile);
router.post('/upload-kyc', verifiedOnly, upload.fields([
  { name: 'idProof', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), uploadKYC);

module.exports = router;
