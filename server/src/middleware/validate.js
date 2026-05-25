const ApiError = require('../utils/ApiError');

/**
 * Validate request body/query/params against a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} source - Which part of the request to validate
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return next(ApiError.badRequest('Validation failed', errors));
    }

    // Replace with parsed (and transformed) data
    req[source] = result.data;
    next();
  };
};

module.exports = { validate };
