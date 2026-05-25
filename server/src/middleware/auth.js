const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const User = require('../modules/auth/auth.model');

/**
 * Authenticate JWT token from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw ApiError.unauthorized('Access token is required');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Find user and check if still active
    const user = await User.findById(decoded.id)
      .select('-password')
      .lean();

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is deactivated');
    }

    if (user.isDeleted) {
      throw ApiError.unauthorized('Account has been deleted');
    }

    // Attach user to request
    req.user = {
      id: user._id,
      schoolId: user.schoolId,
      role: user.role,
      phone: user.phone,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired'));
    }
    next(error);
  }
};

/**
 * Optional auth — attaches user if token present but doesn't fail
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.id).select('-password').lean();
      if (user && user.isActive && !user.isDeleted) {
        req.user = {
          id: user._id,
          schoolId: user.schoolId,
          role: user.role,
          phone: user.phone,
          name: user.name,
        };
      }
    }
  } catch (_err) {
    // Ignore — optional auth
  }
  next();
};

module.exports = { authenticate, optionalAuth };
