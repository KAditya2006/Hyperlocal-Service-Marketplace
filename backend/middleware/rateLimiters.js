const rateLimit = require('express-rate-limit');

const createJsonLimiter = ({ windowMs, limit, message, skipSuccessfulRequests = false }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests,
  message: {
    success: false,
    message
  }
});

const authLimiter = createJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  message: 'Too many authentication requests. Please wait a few minutes and try again.'
});

const registrationLimiter = createJsonLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  message: 'Too many signup attempts from this device. Please try again later.'
});

const loginLimiter = createJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts. Please wait and try again.'
});

const otpLimiter = createJsonLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  message: 'Too many verification attempts. Please request a new code after a short wait.'
});

const passwordResetLimiter = createJsonLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 6,
  message: 'Too many password reset attempts. Please try again later.'
});

module.exports = {
  authLimiter,
  loginLimiter,
  otpLimiter,
  passwordResetLimiter,
  registrationLimiter
};
