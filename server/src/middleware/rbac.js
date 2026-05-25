const ApiError = require('../utils/ApiError');

/**
 * Role hierarchy (higher number = more permissions)
 */
const ROLE_HIERARCHY = {
  super_admin: 100,
  school_admin: 80,
  principal: 70,
  vice_principal: 60,
  academic_coordinator: 50,
  teacher: 30,
  accountant: 30,
  secretary: 20,
  parent: 10,
};

/**
 * Check if user has one of the allowed roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Role '${req.user.role}' is not authorized to access this resource`)
      );
    }

    next();
  };
};

/**
 * Check if user has at least the minimum role level
 */
const authorizeMinLevel = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      return next(
        ApiError.forbidden(`Insufficient permissions. Requires at least '${minRole}' role`)
      );
    }

    next();
  };
};

/**
 * Ensure user belongs to the same school (multi-tenancy guard)
 */
const schoolGuard = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  // Super admins can access any school
  if (req.user.role === 'super_admin') {
    return next();
  }

  // For requests with schoolId param, ensure user belongs to that school
  const requestSchoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;

  if (requestSchoolId && requestSchoolId.toString() !== req.user.schoolId.toString()) {
    return next(ApiError.forbidden('You can only access resources within your school'));
  }

  next();
};

module.exports = { authorize, authorizeMinLevel, schoolGuard, ROLE_HIERARCHY };
