const { Router } = require('express');
const { z } = require('zod');
const authController = require('./auth.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { validate } = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiter');

const router = Router();

// Validation schemas
const loginSchema = z.object({
  phone: z.string().min(9, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  phone: z.string().min(9, 'Valid phone number required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum([
    'school_admin', 'principal', 'vice_principal', 'academic_coordinator',
    'teacher', 'accountant', 'secretary', 'parent',
  ]),
  email: z.string().email().optional().or(z.literal('')),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  avatar: z.string().optional(),
});

// Public routes
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);

// Authenticated routes
router.use(authenticate);

router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.put('/profile', validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', validate(changePasswordSchema), authController.changePassword);

// Admin routes
router.post(
  '/register',
  authorize('super_admin', 'school_admin', 'principal'),
  validate(registerSchema),
  authController.register
);

router.get(
  '/users',
  authorize('super_admin', 'school_admin', 'principal'),
  authController.listUsers
);

router.patch(
  '/users/:id/deactivate',
  authorize('super_admin', 'school_admin'),
  authController.deactivateUser
);

router.patch(
  '/users/:id/activate',
  authorize('super_admin', 'school_admin'),
  authController.activateUser
);

router.post(
  '/users/:id/reset-password',
  authorize('super_admin', 'school_admin'),
  validate(resetPasswordSchema),
  authController.resetUserPassword
);

module.exports = router;
