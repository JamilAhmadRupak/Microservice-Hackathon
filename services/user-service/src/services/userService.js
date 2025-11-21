const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { ValidationError, UnauthorizedError, ConflictError } = require('../../../shared/utils/errors');
const { validateRequired, validateEmail } = require('../../../shared/utils/validation');

class UserService {
  constructor(logger) {
    this.logger = logger;
  }

  generateToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };
    
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    return jwt.sign(payload, secret, { expiresIn });
  }

  async register(userData) {
    try {
      validateRequired(['email', 'password', 'name'], userData);
      validateEmail(userData.email);

      if (userData.password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      const user = new User(userData);
      await user.save();

      const token = this.generateToken(user);

      this.logger.info('User registered successfully', { userId: user._id, email: user.email });

      return {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        token
      };
    } catch (error) {
      this.logger.error('Registration error:', { error: error.message });
      throw error;
    }
  }

  async login(email, password) {
    try {
      validateRequired(['email', 'password'], { email, password });
      validateEmail(email);

      const user = await User.findOne({ email });
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const token = this.generateToken(user);

      this.logger.info('User logged in successfully', { userId: user._id, email: user.email });

      return {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        token
      };
    } catch (error) {
      this.logger.error('Login error:', { error: error.message });
      throw error;
    }
  }

  async getProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return {
        userId: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      };
    } catch (error) {
      this.logger.error('Get profile error:', { error: error.message, userId });
      throw error;
    }
  }

  async updateProfile(userId, updates) {
    try {
      const allowedUpdates = ['name', 'phone'];
      const updateData = {};

      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          updateData[key] = updates[key];
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { ...updateData, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new NotFoundError('User not found');
      }

      this.logger.info('Profile updated successfully', { userId: user._id });

      return {
        userId: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone
      };
    } catch (error) {
      this.logger.error('Update profile error:', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = UserService;
