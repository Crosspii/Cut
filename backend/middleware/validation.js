const { isValidEmail, isValidPassword, isValidPhone, errorResponse } = require('../utils/helpers');

// Validate registration data
const validateRegistration = (req, res, next) => {
    const { name, email, password, phone, role } = req.body;
    const errors = [];

    // Name validation
    if (!name || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }

    // Email validation
    if (!email || !isValidEmail(email)) {
        errors.push('Valid email is required');
    }

    // Password validation
    if (!password || !isValidPassword(password)) {
        errors.push('Password must be at least 6 characters long');
    }

    // Phone validation (optional)
    if (phone && !isValidPhone(phone)) {
        errors.push('Invalid phone number format');
    }

    // Role validation
    if (role && !['customer', 'barber'].includes(role)) {
        errors.push('Role must be either customer or barber');
    }

    if (errors.length > 0) {
        return res.status(400).json(errorResponse('Validation failed', errors));
    }

    next();
};

// Validate login data
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !isValidEmail(email)) {
        errors.push('Valid email is required');
    }

    if (!password) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        return res.status(400).json(errorResponse('Validation failed', errors));
    }

    next();
};

module.exports = {
    validateRegistration,
    validateLogin
};
