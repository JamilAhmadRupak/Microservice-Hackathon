// Request validation utility
const { ValidationError } = require('./errors');

const validateRequired = (fields, data) => {
  const missing = [];
  
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

const validateAmount = (amount) => {
  if (typeof amount !== 'number' || amount <= 0) {
    throw new ValidationError('Amount must be a positive number');
  }
};

const validatePhone = (phone) => {
  if (phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
      throw new ValidationError('Invalid phone number format');
    }
  }
};

const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError('Invalid date format');
  }
  
  if (end <= start) {
    throw new ValidationError('End date must be after start date');
  }
};

module.exports = {
  validateRequired,
  validateEmail,
  validateAmount,
  validatePhone,
  validateDateRange
};
