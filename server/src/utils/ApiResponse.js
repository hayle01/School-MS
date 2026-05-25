class ApiResponse {
  /**
   * Send a success response
   */
  static success(res, { data = null, message = 'Success', statusCode = 200, pagination = null }) {
    const response = {
      success: true,
      message,
      data,
    };
    if (pagination) {
      response.pagination = pagination;
    }
    return res.status(statusCode).json(response);
  }

  /**
   * Send a created response
   */
  static created(res, { data = null, message = 'Resource created successfully' }) {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Send an error response
   */
  static error(res, { message = 'Something went wrong', statusCode = 500, errors = null }) {
    const response = {
      success: false,
      message,
    };
    if (errors) {
      response.errors = errors;
    }
    return res.status(statusCode).json(response);
  }

  /**
   * Build pagination metadata
   */
  static buildPagination({ page, limit, total }) {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}

module.exports = ApiResponse;
