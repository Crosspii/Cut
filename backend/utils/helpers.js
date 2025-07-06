const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/config');

class AuthHelpers {
    // Generate JWT token
    static generateToken(userId, role) {
        try {
            const payload = {
                userId,
                role,
                iat: Date.now()
            };
            
            return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
        } catch (error) {
            throw new Error('Token generation failed');
        }
    }

    // Verify JWT token
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // Extract token from Authorization header
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        
        return authHeader.substring(7); // Remove 'Bearer ' prefix
    }
}

class ValidationHelpers {
    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    static isValidPassword(password) {
        // At least 6 characters, contains at least one letter and one number
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
        return passwordRegex.test(password);
    }

    // Validate phone number (Moroccan format)
    static isValidPhone(phone) {
        if (!phone) return true; // Phone is optional
        const phoneRegex = /^(\+212|0)[567]\d{8}$/;
        return phoneRegex.test(phone);
    }

    // Validate name
    static isValidName(name) {
        return name && name.trim().length >= 2 && name.trim().length <= 100;
    }

    // Validate role
    static isValidRole(role) {
        return ['customer', 'barber'].includes(role);
    }

    // Sanitize string input
    static sanitizeString(str) {
        if (!str) return '';
        return str.trim().replace(/[<>]/g, '');
    }
}

class ResponseHelpers {
    // Success response
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    // Error response
    static error(res, message = 'Internal server error', statusCode = 500, errors = null) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors
        });
    }

    // Validation error response
    static validationError(res, errors) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    // Unauthorized response
    static unauthorized(res, message = 'Unauthorized') {
        return res.status(401).json({
            success: false,
            message
        });
    }

    // Forbidden response
    static forbidden(res, message = 'Forbidden') {
        return res.status(403).json({
            success: false,
            message
        });
    }

    // Not found response
    static notFound(res, message = 'Resource not found') {
        return res.status(404).json({
            success: false,
            message
        });
    }
}

module.exports = {
    AuthHelpers,
    ValidationHelpers,
    ResponseHelpers
};