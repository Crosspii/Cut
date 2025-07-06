const { body, validationResult } = require('express-validator');
const { ValidationHelpers, ResponseHelpers } = require('../utils/helpers');
const User = require('../models/User');

class ValidationMiddleware {
    // Handle validation results
    static handleValidationErrors(req, res, next) {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => ({
                field: error.path,
                message: error.msg
            }));
            
            return ResponseHelpers.validationError(res, errorMessages);
        }
        
        next();
    }

    // Registration validation rules
    static registrationValidation() {
        return [
            body('name')
                .notEmpty()
                .withMessage('Name is required')
                .isLength({ min: 2, max: 100 })
                .withMessage('Name must be between 2 and 100 characters')
                .trim()
                .escape(),
            
            body('email')
                .notEmpty()
                .withMessage('Email is required')
                .isEmail()
                .withMessage('Please provide a valid email')
                .normalizeEmail()
                .custom(async (email) => {
                    const emailExists = await User.emailExists(email);
                    if (emailExists) {
                        throw new Error('Email already exists');
                    }
                }),
            
            body('password')
                .notEmpty()
                .withMessage('Password is required')
                .isLength({ min: 6 })
                .withMessage('Password must be at least 6 characters long')
                .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
                .withMessage('Password must contain at least one letter and one number'),
            
            body('confirmPassword')
                .notEmpty()
                .withMessage('Password confirmation is required')
                .custom((confirmPassword, { req }) => {
                    if (confirmPassword !== req.body.password) {
                        throw new Error('Passwords do not match');
                    }
                    return true;
                }),
            
            body('phone')
                .optional()
                .isMobilePhone('ar-MA')
                .withMessage('Please provide a valid Moroccan phone number')
                .customSanitizer(value => value ? value.trim() : value),
            
            body('role')
                .optional()
                .isIn(['customer', 'barber'])
                .withMessage('Role must be either customer or barber')
                .customSanitizer(value => value || 'customer'),
            
            this.handleValidationErrors
        ];
    }

    // Login validation rules
    static loginValidation() {
        return [
            body('email')
                .notEmpty()
                .withMessage('Email is required')
                .isEmail()
                .withMessage('Please provide a valid email')
                .normalizeEmail(),
            
            body('password')
                .notEmpty()
                .withMessage('Password is required'),
            
            this.handleValidationErrors
        ];
    }

    // Profile update validation rules
    static profileUpdateValidation() {
        return [
            body('name')
                .optional()
                .isLength({ min: 2, max: 100 })
                .withMessage('Name must be between 2 and 100 characters')
                .trim()
                .escape(),
            
            body('email')
                .optional()
                .isEmail()
                .withMessage('Please provide a valid email')
                .normalizeEmail()
                .custom(async (email, { req }) => {
                    if (email) {
                        const emailExists = await User.emailExists(email, req.user.id);
                        if (emailExists) {
                            throw new Error('Email already exists');
                        }
                    }
                }),
            
            body('phone')
                .optional()
                .isMobilePhone('ar-MA')
                .withMessage('Please provide a valid Moroccan phone number')
                .customSanitizer(value => value ? value.trim() : value),
            
            this.handleValidationErrors
        ];
    }

    // Password change validation rules
    static passwordChangeValidation() {
        return [
            body('currentPassword')
                .notEmpty()
                .withMessage('Current password is required'),
            
            body('newPassword')
                .notEmpty()
                .withMessage('New password is required')
                .isLength({ min: 6 })
                .withMessage('New password must be at least 6 characters long')
                .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
                .withMessage('New password must contain at least one letter and one number'),
            
            body('confirmPassword')
                .notEmpty()
                .withMessage('Password confirmation is required')
                .custom((confirmPassword, { req }) => {
                    if (confirmPassword !== req.body.newPassword) {
                        throw new Error('Passwords do not match');
                    }
                    return true;
                }),
            
            this.handleValidationErrors
        ];
    }

    // Sanitize request body
    static sanitizeBody(req, res, next) {
        if (req.body) {
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = ValidationHelpers.sanitizeString(req.body[key]);
                }
            });
        }
        next();
    }
}

module.exports = ValidationMiddleware;