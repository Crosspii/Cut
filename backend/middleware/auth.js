const { AuthHelpers, ResponseHelpers } = require('../utils/helpers');
const User = require('../models/User');

class AuthMiddleware {
    // Verify JWT token and attach user to request
    static async authenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const token = AuthHelpers.extractTokenFromHeader(authHeader);

            if (!token) {
                return ResponseHelpers.unauthorized(res, 'Access token is required');
            }

            // Verify token
            const decoded = AuthHelpers.verifyToken(token);
            
            // Get user from database
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                return ResponseHelpers.unauthorized(res, 'User not found');
            }

            if (user.status !== 'active') {
                return ResponseHelpers.forbidden(res, 'Account is not active');
            }

            // Attach user to request
            req.user = user;
            next();
        } catch (error) {
            console.error('Authentication error:', error.message);
            
            if (error.message === 'Invalid token') {
                return ResponseHelpers.unauthorized(res, 'Invalid or expired token');
            }
            
            return ResponseHelpers.error(res, 'Authentication failed');
        }
    }

    // Optional authentication - doesn't fail if token is missing
    static async optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const token = AuthHelpers.extractTokenFromHeader(authHeader);

            if (!token) {
                return next();
            }

            // Verify token
            const decoded = AuthHelpers.verifyToken(token);
            
            // Get user from database
            const user = await User.findById(decoded.userId);
            
            if (user && user.status === 'active') {
                req.user = user;
            }

            next();
        } catch (error) {
            // Continue without authentication if token is invalid
            next();
        }
    }

    // Role-based authorization
    static authorize(...roles) {
        return (req, res, next) => {
            if (!req.user) {
                return ResponseHelpers.unauthorized(res, 'Authentication required');
            }

            if (!roles.includes(req.user.role)) {
                return ResponseHelpers.forbidden(res, 'Insufficient permissions');
            }

            next();
        };
    }

    // Check if user owns the resource or is admin
    static checkOwnership(userIdField = 'userId') {
        return (req, res, next) => {
            if (!req.user) {
                return ResponseHelpers.unauthorized(res, 'Authentication required');
            }

            const resourceUserId = req.params[userIdField] || req.body[userIdField];
            
            if (req.user.id !== parseInt(resourceUserId) && req.user.role !== 'admin') {
                return ResponseHelpers.forbidden(res, 'Access denied');
            }

            next();
        };
    }
}

module.exports = AuthMiddleware;