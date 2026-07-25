const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const env = require('../config/env');
const { User, RefreshToken, PasswordResetToken } = require('../models');
const { comparePassword, hashPassword, generateResetToken } = require('../utils/password.util');
const {
  generateAccessToken,
  generateRefreshTokenValue,
  hashToken,
} = require('../utils/jwt.util');
const { recordAudit } = require('../utils/audit.util');

const REFRESH_COOKIE_NAME = 'refreshToken';
const ACCESS_COOKIE_NAME = 'accessToken';

const refreshCookieOptions = () => {
  const days = 7; // matches default JWT_REFRESH_EXPIRES_IN scale; expiry enforced server-side too
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
    maxAge: days * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  };
};

const accessCookieOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000,
  path: '/',
});

const msFromExpiry = (expiry) => {
  // supports formats like '7d', '15m'
  const match = /^(\d+)([smhd])$/.exec(expiry);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
};

/**
 * POST /api/auth/login
 * Authenticates a user, issues a short-lived access token (JWT) and a
 * long-lived opaque refresh token (stored hashed, revocable).
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user) {
    await recordAudit({ req, action: 'LOGIN_FAILED', details: { email, reason: 'user_not_found' } });
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.is_active) {
    await recordAudit({ req, actorId: user.id, action: 'LOGIN_FAILED', details: { reason: 'inactive' } });
    throw ApiError.forbidden('Account has been deactivated. Contact your administrator.');
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    await recordAudit({ req, actorId: user.id, action: 'LOGIN_FAILED', details: { reason: 'bad_password' } });
    throw ApiError.unauthorized('Invalid email or password');
  }

  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  const refreshTokenValue = generateRefreshTokenValue();
  const refreshExpiresAt = new Date(Date.now() + msFromExpiry(env.JWT_REFRESH_EXPIRES_IN));

  await RefreshToken.create({
    user_id: user.id,
    token_hash: hashToken(refreshTokenValue),
    user_agent: req.headers['user-agent'] || null,
    ip_address: req.ip,
    expires_at: refreshExpiresAt,
  });

  await user.update({ last_login_at: new Date() });
  await recordAudit({ req, actorId: user.id, action: 'LOGIN_SUCCESS' });

  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, refreshTokenValue, refreshCookieOptions());

  return new ApiResponse(200, {
    accessToken,
    user: {
      id: user.id,
      employeeCode: user.employee_code,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      profilePhotoUrl: user.profile_photo_url,
    },
  }, 'Login successful').send(res);
});

/**
 * POST /api/auth/refresh
 * Exchanges a valid, unexpired, unrevoked refresh token for a new access
 * token. Implements refresh-token rotation: the old token is revoked and
 * a new one issued, limiting the blast radius of a stolen token.
 */
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized('Refresh token missing');

  const tokenHash = hashToken(token);
  const stored = await RefreshToken.findOne({ where: { token_hash: tokenHash } });

  if (!stored || stored.revoked_at || stored.expires_at < new Date()) {
    throw ApiError.unauthorized('Refresh token invalid or expired. Please log in again.');
  }

  const user = await User.findByPk(stored.user_id);
  if (!user || !user.is_active) {
    throw ApiError.unauthorized('Account unavailable');
  }

  // Rotate: revoke old, issue new
  await stored.update({ revoked_at: new Date() });
  const newRefreshValue = generateRefreshTokenValue();
  const refreshExpiresAt = new Date(Date.now() + msFromExpiry(env.JWT_REFRESH_EXPIRES_IN));

  await RefreshToken.create({
    user_id: user.id,
    token_hash: hashToken(newRefreshValue),
    user_agent: req.headers['user-agent'] || null,
    ip_address: req.ip,
    expires_at: refreshExpiresAt,
  });

  const accessToken = generateAccessToken({ id: user.id, role: user.role });

  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, newRefreshValue, refreshCookieOptions());

  return new ApiResponse(200, { accessToken }, 'Token refreshed').send(res);
});

/**
 * POST /api/auth/logout
 * Revokes the current refresh token and clears cookies.
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) {
    const tokenHash = hashToken(token);
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { token_hash: tokenHash, revoked_at: null } }
    );
  }

  res.clearCookie(ACCESS_COOKIE_NAME, { path: '/' });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });

  if (req.user) {
    await recordAudit({ req, actorId: req.user.id, action: 'LOGOUT' });
  }

  return new ApiResponse(200, null, 'Logged out successfully').send(res);
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user's public profile.
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [
      { association: 'Department', attributes: ['id', 'name'] },
      { association: 'Designation', attributes: ['id', 'title'] },
    ],
  });
  if (!user) throw ApiError.notFound('User not found');

  return new ApiResponse(200, { user }).send(res);
});

/**
 * POST /api/auth/forgot-password
 * Always responds with a generic success message (does not reveal
 * whether the email exists) to prevent user enumeration.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });

  if (user) {
    const { rawToken, hashedToken } = generateResetToken();
    const expiresAt = new Date(Date.now() + env.RESET_TOKEN_EXPIRES_MIN * 60 * 1000);

    await PasswordResetToken.create({
      user_id: user.id,
      token_hash: hashedToken,
      expires_at: expiresAt,
    });

    await recordAudit({ req, actorId: user.id, action: 'PASSWORD_RESET_REQUESTED' });

    // In production this token would be emailed to the user rather than
    // returned in the API response. Returned here only for demo/dev use
    // since no email/SMTP provider was specified.
    if (env.NODE_ENV !== 'production') {
      return new ApiResponse(200, { devResetToken: rawToken }, 'If that email exists, a reset link has been sent').send(res);
    }
  }

  return new ApiResponse(200, null, 'If that email exists, a reset link has been sent').send(res);
});

/**
 * POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const tokenHash = hashToken(token);

  const resetRecord = await PasswordResetToken.findOne({
    where: { token_hash: tokenHash, used_at: null, expires_at: { [Op.gt]: new Date() } },
  });

  if (!resetRecord) {
    throw ApiError.badRequest('Reset token is invalid or has expired');
  }

  const user = await User.findByPk(resetRecord.user_id);
  if (!user) throw ApiError.notFound('User not found');

  const password_hash = await hashPassword(newPassword);
  await user.update({ password_hash, password_changed_at: new Date() });
  await resetRecord.update({ used_at: new Date() });

  // Revoke all existing sessions for this user as a security measure
  await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { user_id: user.id, revoked_at: null } }
  );

  await recordAudit({ req, actorId: user.id, action: 'PASSWORD_RESET_COMPLETED' });

  return new ApiResponse(200, null, 'Password reset successful. Please log in again.').send(res);
});

/**
 * POST /api/auth/change-password
 * For an already-authenticated user changing their own password.
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.scope('withPassword').findByPk(req.user.id);
  const isMatch = await comparePassword(currentPassword, user.password_hash);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  const password_hash = await hashPassword(newPassword);
  await user.update({ password_hash, password_changed_at: new Date() });

  await recordAudit({ req, actorId: user.id, action: 'PASSWORD_CHANGED' });

  return new ApiResponse(200, null, 'Password changed successfully').send(res);
});

module.exports = {
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
};
