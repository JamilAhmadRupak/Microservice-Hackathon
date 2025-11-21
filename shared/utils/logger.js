// Shared logger utility for all services
const winston = require('winston');
const { createLogger, format, transports } = winston;

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const createServiceLogger = (serviceName) => {
  return createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: serviceName },
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.printf(({ timestamp, level, message, service, correlationId, ...meta }) => {
            let msg = `${timestamp} [${service}] ${level}: ${message}`;
            if (correlationId) {
              msg += ` [CID: ${correlationId}]`;
            }
            if (Object.keys(meta).length > 0) {
              msg += ` ${JSON.stringify(meta)}`;
            }
            return msg;
          })
        )
      }),
      // File transport for production
      new transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 5242880,
        maxFiles: 5
      })
    ]
  });
};

module.exports = { createServiceLogger };
