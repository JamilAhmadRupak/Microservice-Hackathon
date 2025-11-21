# Shared Utilities

This directory contains shared utilities and middleware used across all microservices.

## Structure

- **utils/**: Common utility functions
  - `logger.js`: Winston logger configuration
  - `response.js`: Standardized API response formatter
  - `errors.js`: Custom error classes
  - `database.js`: MongoDB connection utility
  - `validation.js`: Input validation helpers

- **middleware/**: Express middleware
  - `correlationId.js`: Request tracing
  - `errorHandler.js`: Global error handler
  - `auth.js`: JWT authentication

## Usage

Install in each service:
```bash
npm install
```

Import in services:
```javascript
const { createServiceLogger } = require('../../shared/utils/logger');
const { sendSuccess, sendError } = require('../../shared/utils/response');
const { authMiddleware } = require('../../shared/middleware/auth');
```
