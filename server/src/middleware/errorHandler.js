const logger = require('../utils/logger');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
  // Log the error
  if (err.statusCode >= 500 || !err.statusCode) {
    logger.error(`${err.message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn(`${err.statusCode} - ${err.message} - ${req.originalUrl}`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiResponse.error(res, {
      message: 'Validation failed',
      statusCode: 400,
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    return ApiResponse.error(res, {
      message: `Duplicate value for field(s): ${field}`,
      statusCode: 409,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return ApiResponse.error(res, {
      message: `Invalid ${err.path}: ${err.value}`,
      statusCode: 400,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, {
      message: 'Invalid token',
      statusCode: 401,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, {
      message: 'Token expired',
      statusCode: 401,
    });
  }

  // Our custom ApiError
  if (err instanceof ApiError) {
    return ApiResponse.error(res, {
      message: err.message,
      statusCode: err.statusCode,
      errors: err.errors,
    });
  }

  // Unknown errors
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  return ApiResponse.error(res, { message, statusCode });
};

/**
 * Handle 404 routes
 */
const notFoundHandler = (req, res) => {
  return ApiResponse.error(res, {
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
};

module.exports = { errorHandler, notFoundHandler };
