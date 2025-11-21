// Error handling middleware
const { sendError } = require('../utils/response');

const errorHandler = (logger) => {
  return (err, req, res, next) => {
    logger.error('Error caught:', {
      error: err.message,
      stack: err.stack,
      correlationId: req.correlationId,
      path: req.path,
      method: req.method
    });

    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';
    const code = err.code || 'INTERNAL_ERROR';

    sendError(res, { message, code }, statusCode, req.correlationId);
  };
};

module.exports = { errorHandler };
