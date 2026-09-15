import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authenticate incoming requests via Bearer JWT token
 */
export const authenticateUser = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'dev_jwt_secret_key_12345'
      );

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists. Authorization denied.',
        });
      }

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided. Access denied.',
    });
  }
};

/**
 * Restrict access to users possessing specific roles
 * @param {...string} roles - Permitted roles (e.g. 'student', 'instructor', 'admin')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

export default {
  authenticateUser,
  authorizeRoles,
};
