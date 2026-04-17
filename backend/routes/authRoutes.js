const express = require('express');
const router = express.Router();
const { register, verifyOTP, login, resendOTP, me, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  authLimiter,
  loginLimiter,
  otpLimiter,
  passwordResetLimiter,
  registrationLimiter
} = require('../middleware/rateLimiters');

router.use(authLimiter);

router.post('/register', registrationLimiter, register);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/login', loginLimiter, login);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.get('/me', protect, me);

module.exports = router;
