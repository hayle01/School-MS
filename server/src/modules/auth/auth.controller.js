const authService = require('./auth.service');
const ApiResponse = require('../../utils/ApiResponse');

class AuthController {
  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { phone, password } = req.body;
      const userAgent = req.headers['user-agent'] || '';

      const result = await authService.login(phone, password, userAgent);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
      });

      return ApiResponse.success(res, {
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const userData = {
        ...req.body,
        schoolId: req.user.schoolId,
      };

      const user = await authService.register(userData);

      return ApiResponse.created(res, {
        data: user,
        message: 'User registered successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const result = await authService.refreshAccessToken(refreshToken);

      return ApiResponse.success(res, {
        data: { accessToken: result.accessToken },
        message: 'Token refreshed',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      await authService.logout(req.user.id, refreshToken);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      return ApiResponse.success(res, {
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

      return ApiResponse.success(res, {
        data: result,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);

      return ApiResponse.success(res, {
        data: user,
        message: 'Profile fetched',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.id, req.body);

      return ApiResponse.success(res, {
        data: user,
        message: 'Profile updated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/users
   */
  async listUsers(req, res, next) {
    try {
      const result = await authService.listUsers(req.user.schoolId, req.query);

      return ApiResponse.success(res, {
        data: result.users,
        pagination: ApiResponse.buildPagination({
          page: result.page,
          limit: result.limit,
          total: result.total,
        }),
        message: 'Users fetched',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/auth/users/:id/deactivate
   */
  async deactivateUser(req, res, next) {
    try {
      const user = await authService.deactivateUser(req.params.id, req.user.id);

      return ApiResponse.success(res, {
        data: user,
        message: 'User deactivated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/auth/users/:id/activate
   */
  async activateUser(req, res, next) {
    try {
      const user = await authService.activateUser(req.params.id);

      return ApiResponse.success(res, {
        data: user,
        message: 'User activated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/users/:id/reset-password
   */
  async resetUserPassword(req, res, next) {
    try {
      const { newPassword } = req.body;
      const result = await authService.resetUserPassword(req.params.id, newPassword);

      return ApiResponse.success(res, {
        data: result,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
