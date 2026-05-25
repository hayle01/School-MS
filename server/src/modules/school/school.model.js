const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'School name is required'],
      trim: true,
    },
    nameAr: {
      type: String,
      trim: true,
      default: '',
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['primary', 'secondary', 'combined', 'madrasa', 'university'],
      default: 'combined',
    },
    address: {
      street: { type: String, trim: true, default: '' },
      district: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      region: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'Somalia' },
    },
    contact: {
      phone: { type: String, trim: true, default: '' },
      phone2: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
      website: { type: String, trim: true, default: '' },
    },
    logo: {
      type: String,
      default: null,
    },
    motto: {
      type: String,
      trim: true,
      default: '',
    },
    establishedYear: {
      type: Number,
      default: null,
    },
    settings: {
      currency: { type: String, default: 'USD' },
      language: { type: String, default: 'so' },
      timezone: { type: String, default: 'Africa/Mogadishu' },
      academicYearStart: { type: Number, default: 9 }, // September
      gradingSystem: { type: String, enum: ['percentage', 'gpa', 'letter'], default: 'percentage' },
      passPercentage: { type: Number, default: 50 },
      attendanceRequired: { type: Number, default: 80 }, // percentage
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
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

schoolSchema.index({ code: 1 }, { unique: true });
schoolSchema.index({ isActive: 1 });
schoolSchema.index({ createdAt: -1 });

// Auto-generate school code if not provided
schoolSchema.pre('save', async function (next) {
  if (!this.code) {
    const prefix = this.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
    const count = await mongoose.model('School').countDocuments();
    this.code = `${prefix}${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

schoolSchema.pre(/^find/, function () {
  if (this.getOptions().includeSoftDeleted) return;
  this.where({ isDeleted: { $ne: true } });
});

const School = mongoose.model('School', schoolSchema);
module.exports = School;
