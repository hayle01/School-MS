const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const User = require('./auth.model');
const ApiError = require('../../utils/ApiError');

class AuthService {
  /**
   * Generate access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      { id: user._id, schoolId: user.schoolId, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { id: user._id, type: 'refresh' },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  /**
   * Login with phone and password
   */
  async login(phone, password, userAgent = '') {
    const user = await User.findOne({ phone, isActive: true })
      .select('+password')
      .populate('schoolId', 'name code isActive');

    if (!user) {
      throw ApiError.unauthorized('Invalid phone number or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid phone number or password');
    }

    if (user.schoolId && !user.schoolId.isActive) {
      throw ApiError.forbidden('Your school account is currently inactive');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Calculate refresh token expiry (30 days)
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 30);

    // Store refresh token (keep max 5 sessions)
    if (user.refreshTokens && user.refreshTokens.length >= 5) {
      user.refreshTokens = user.refreshTokens.slice(-4);
    }
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: refreshExpiry,
      userAgent,
    });

    user.lastLogin = new Date();
    await user.save();

    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Register a new user (admin action)
   */
  async register(userData) {
    // Check if phone already exists for this school
    const existing = await User.findOne({
      phone: userData.phone,
      schoolId: userData.schoolId,
    });

    if (existing) {
      throw ApiError.conflict('A user with this phone number already exists in this school');
    }

    const user = await User.create(userData);
    return user.toSafeObject();
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    // Verify refresh token exists in user's stored tokens
    const storedToken = user.refreshTokens.find(
      (rt) => rt.token === refreshToken && rt.expiresAt > new Date()
    );

    if (!storedToken) {
      throw ApiError.unauthorized('Refresh token not found or expired');
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(user);

    return { accessToken };
  }

  /**
   * Logout — remove refresh token
   */
  async logout(userId, refreshToken) {
    const user = await User.findById(userId).select('+refreshTokens');
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== refreshToken);
      await user.save();
    }
    return true;
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    user.password = newPassword;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();

    return { message: 'Password changed successfully' };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    const user = await User.findById(userId)
      .select('-refreshTokens')
      .populate('schoolId', 'name code logo');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user.toSafeObject();
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const allowedFields = ['name', 'email', 'avatar'];
    const updates = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-refreshTokens');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user.toSafeObject();
  }

  /**
   * List all users for a school (admin)
   */
  async listUsers(schoolId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { schoolId };

    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { phone: new RegExp(query.search, 'i') },
        { email: new RegExp(query.search, 'i') },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-refreshTokens')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return { users, total, page, limit };
  }

  /**
   * Admin: deactivate user
   */
  async deactivateUser(userId, adminId) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    user.isActive = false;
    user.refreshTokens = [];
    await user.save();

    return user.toSafeObject();
  }

  /**
   * Admin: activate user
   */
  async activateUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    user.isActive = true;
    await user.save();

    return user.toSafeObject();
  }

  /**
   * Admin: reset user password
   */
  async resetUserPassword(userId, newPassword) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();

    return { message: 'Password reset successfully' };
  }
}

module.exports = new AuthService();
