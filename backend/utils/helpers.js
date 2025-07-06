const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Generate JWT token
const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRE }
    );
};

// Verify JWT token
const verifyToken = (token) => {
    return jwt.verify(token, config.JWT_SECRET);
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
const isValidPassword = (password) => {
    // At least 6 characters
    return password && password.length >= 6;
};

// Validate phone number (Moroccan format)
const isValidPhone = (phone) => {
    const phoneRegex = /^(\+212|0)(5|6|7)[0-9]{8}$/;
    return phoneRegex.test(phone);
};

// Format success response
const successResponse = (data, message = 'Success') => {
    return {
        success: true,
        message,
        data
    };
};

// Format error response
const errorResponse = (message, errors = null) => {
    return {
        success: false,
        message,
        errors
    };
};

module.exports = {
    generateToken,
    verifyToken,
    isValidEmail,
    isValidPassword,
    isValidPhone,
    successResponse,
    errorResponse
};
