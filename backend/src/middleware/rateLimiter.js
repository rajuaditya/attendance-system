const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * General API rate limiter — protects all routes from abuse/DoS.
 */
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MIN * 60 * 1000,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

/**
 * Stricter limiter for login/forgot-password to blunt brute-force and
 * credential-stuffing attacks.
 */
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MIN * 60 * 1000,
  max: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
  skipSuccessfulRequests: true,
});

/**
 * QR scan endpoint limiter — a kiosk may scan frequently, but this still
 * caps abuse from a single source.
 */
const qrScanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many scan attempts. Please slow down.' },
});

module.exports = { apiLimiter, authLimiter, qrScanLimiter };
