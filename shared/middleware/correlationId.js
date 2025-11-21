// Correlation ID middleware for request tracing
const { v4: uuidv4 } = require('uuid');

const correlationIdMiddleware = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
};

module.exports = { correlationIdMiddleware };
