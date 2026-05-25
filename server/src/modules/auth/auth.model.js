const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../../config/env');

const userSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: [
        'super_admin',
        'school_admin',
        'principal',
        'vice_principal',
        'academic_coordinator',
        'teacher',
        'accountant',
        'secretary',
        'parent',
      ],
      default: 'teacher',
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    refreshTokens: [
      {
        token: String,
        expiresAt: Date,
        userAgent: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Soft delete fields
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique phone per school
userSchema.index({ phone: 1, schoolId: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

// Pre-save: hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, config.bcryptRounds);
  next();
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: return user without sensitive data
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.__v;
  return obj;
};

// Default query filter: exclude soft-deleted
userSchema.pre(/^find/, function () {
  if (this.getOptions().includeSoftDeleted) return;
  this.where({ isDeleted: { $ne: true } });
});

const User = mongoose.model('User', userSchema);
module.exports = User;
