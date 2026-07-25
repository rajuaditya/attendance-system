const { verifyAccessToken } = require('../utils/jwt.util');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { User } = require('../models');

/**
 * Requires a valid access token (from Authorization header or cookie).
 * Attaches a minimal, trusted `req.user` object. Re-checks the user is
 * still active on every request so a deactivated employee is locked out
 * immediately, not just after their token expires.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication token missing');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired');
    }
    throw ApiError.unauthorized('Invalid access token');
  }

  const user = await User.findByPk(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }
  if (!user.is_active) {
    throw ApiError.forbidden('Account has been deactivated. Contact your administrator.');
  }

  req.user = {
    id: user.id,
    role: user.role,
    employee_code: user.employee_code,
    full_name: user.full_name,
    email: user.email,
  };

  next();
});

module.exports = authenticate;
