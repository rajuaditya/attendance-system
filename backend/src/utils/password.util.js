const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = 12;

const hashPassword = async (plain) => bcrypt.hash(plain, SALT_ROUNDS);

const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);

/**
 * Generates a secure random token for password reset flows, plus its
 * SHA-256 hash for DB storage. Only the hash is persisted; the raw token
 * is emailed/returned once and never stored in plaintext.
 */
const generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
};

/**
 * Basic password strength check: min 8 chars, at least one uppercase,
 * one lowercase, one digit, one special character.
 */
const isStrongPassword = (password) => {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return strongRegex.test(password);
};

module.exports = { hashPassword, comparePassword, generateResetToken, isStrongPassword };
