// Shared response formatter for consistent API responses
const successResponse = (data, statusCode = 200, correlationId = null) => {
  return {
    status: statusCode,
    body: {
      success: true,
      data,
      correlationId
    }
  };
};

const errorResponse = (error, statusCode = 500, correlationId = null) => {
  const message = typeof error === 'string' ? error : error.message;
  const code = error.code || 'INTERNAL_ERROR';
  
  return {
    status: statusCode,
    body: {
      success: false,
      error: message,
      code,
      correlationId
    }
  };
};

const sendSuccess = (res, data, statusCode = 200, correlationId = null) => {
  const response = successResponse(data, statusCode, correlationId);
  return res.status(response.status).json(response.body);
};

const sendError = (res, error, statusCode = 500, correlationId = null) => {
  const response = errorResponse(error, statusCode, correlationId);
  return res.status(response.status).json(response.body);
};

module.exports = {
  successResponse,
  errorResponse,
  sendSuccess,
  sendError
};
