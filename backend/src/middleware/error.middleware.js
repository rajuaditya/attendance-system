const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * 404 handler for unmatched routes.
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Central error handler. Converts known error types (Sequelize validation,
 * JSON parse errors, etc.) into ApiError shape, logs server-side, and
 * NEVER leaks stack traces or internal details to the client in production.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (error.name === 'SequelizeUniqueConstraintError') {
    const fields = Object.keys(error.fields || {}).join(', ');
    error = ApiError.conflict(`A record with this ${fields || 'value'} already exists`);
  } else if (error.name === 'SequelizeValidationError') {
    const messages = error.errors.map((e) => e.message);
    error = ApiError.badRequest('Validation failed', messages);
  } else if (error.name === 'SequelizeForeignKeyConstraintError') {
    error = ApiError.badRequest('Invalid reference to a related record');
  } else if (error.type === 'entity.parse.failed') {
    error = ApiError.badRequest('Malformed JSON in request body');
  } else if (!(error instanceof ApiError)) {
    // Unknown/unexpected error — do not leak details
    logger.error(err);
    error = ApiError.internal(
      env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    );
  }

  if (error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${error.message}`);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
