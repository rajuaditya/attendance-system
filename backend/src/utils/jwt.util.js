const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

/**
 * Generates a short-lived JWT access token carrying only non-sensitive
 * claims (id, role) — never password hashes or other secrets.
 */
const generateAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });

const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);

/**
 * Refresh tokens are opaque random strings (not JWTs) stored hashed in the
 * DB. This lets us revoke individual sessions server-side (JWT refresh
 * tokens alone cannot be revoked before expiry).
 */
const generateRefreshTokenValue = () => crypto.randomBytes(48).toString('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshTokenValue,
  hashToken,
};
