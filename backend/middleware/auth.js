const { verifyToken, errorResponse } = require('../utils/helpers');
const User = require('../models/User');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json(errorResponse('Access token required'));
        }

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json(errorResponse('Invalid token'));
        }

        if (user.status !== 'active') {
            return res.status(401).json(errorResponse('Account is inactive'));
        }

        // Add user info to request
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json(errorResponse('Token expired'));
        }
        return res.status(401).json(errorResponse('Invalid token'));
    }
};

// Check if user is barber
const requireBarber = (req, res, next) => {
    if (req.user.role !== 'barber') {
        return res.status(403).json(errorResponse('Barber access required'));
    }
    next();
};

// Check if user is customer
const requireCustomer = (req, res, next) => {
    if (req.user.role !== 'customer') {
        return res.status(403).json(errorResponse('Customer access required'));
    }
    next();
};

// Optional authentication (for public routes that can benefit from user info)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.userId);

            if (user && user.status === 'active') {
                req.user = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
            }
        }
        next();
    } catch (error) {
        // Continue without authentication for optional auth
        next();
    }
};

module.exports = {
    authenticateToken,
    requireBarber,
    requireCustomer,
    optionalAuth
};
