const ApiError = require('../utils/ApiError');

/**
 * Restricts a route to the given roles. Usage: authorize('admin', 'super_admin')
 * Must run after `authenticate` middleware.
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Not authenticated'));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

module.exports = authorize;
