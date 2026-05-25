const mongoose = require('mongoose');

/**
 * Generate auto-incrementing ID with prefix
 * e.g., DGS-2024-001, STF-2024-001
 */
const generateId = async (Model, prefix, schoolId, field = 'studentId') => {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-`;

  const query = { schoolId };
  query[field] = { $regex: `^${pattern}` };

  const lastRecord = await Model.findOne(query)
    .sort({ [field]: -1 })
    .select(field)
    .lean();

  let nextNum = 1;
  if (lastRecord && lastRecord[field]) {
    const lastNum = parseInt(lastRecord[field].split('-').pop(), 10);
    nextNum = lastNum + 1;
  }

  const padLength = prefix === 'REC' ? 5 : 3;
  return `${pattern}${String(nextNum).padStart(padLength, '0')}`;
};

/**
 * Build a pagination/filter query for Mongoose
 */
const buildQuery = (queryParams, allowedFilters = []) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const sort = {};
  if (queryParams.sortBy) {
    const order = queryParams.sortOrder === 'asc' ? 1 : -1;
    sort[queryParams.sortBy] = order;
  } else {
    sort.createdAt = -1;
  }

  const filters = {};
  for (const key of allowedFilters) {
    if (queryParams[key] !== undefined && queryParams[key] !== '') {
      if (mongoose.Types.ObjectId.isValid(queryParams[key])) {
        filters[key] = queryParams[key];
      } else {
        filters[key] = queryParams[key];
      }
    }
  }

  if (queryParams.search) {
    filters.$or = [];
  }

  return { page, limit, skip, sort, filters };
};

/**
 * Build search conditions for text fields
 */
const buildSearchConditions = (search, fields) => {
  if (!search || !fields.length) return [];
  const regex = new RegExp(search, 'i');
  return fields.map((field) => ({ [field]: regex }));
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Clean an object removing undefined/null values
 */
const cleanObject = (obj) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

/**
 * Get current academic year string
 */
const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // Somali school year typically starts in September
  if (month >= 9) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
};

module.exports = {
  generateId,
  buildQuery,
  buildSearchConditions,
  isValidObjectId,
  cleanObject,
  getCurrentAcademicYear,
};
