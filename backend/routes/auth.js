const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');

// Public routes (no authentication required)

// User registration
router.post('/register', 
    ValidationMiddleware.sanitizeBody,
    ValidationMiddleware.registrationValidation(),
    AuthController.register
);

// User login
router.post('/login',
    ValidationMiddleware.sanitizeBody,
    ValidationMiddleware.loginValidation(),
    AuthController.login
);

// Protected routes (authentication required)

// Get current user profile
router.get('/profile',
    AuthMiddleware.authenticate,
    AuthController.getProfile
);

// Update user profile
router.put('/profile',
    AuthMiddleware.authenticate,
    ValidationMiddleware.sanitizeBody,
    ValidationMiddleware.profileUpdateValidation(),
    AuthController.updateProfile
);

// Change password
router.put('/password',
    AuthMiddleware.authenticate,
    ValidationMiddleware.sanitizeBody,
    ValidationMiddleware.passwordChangeValidation(),
    AuthController.changePassword
);

// Verify token
router.get('/verify',
    AuthMiddleware.authenticate,
    AuthController.verifyToken
);

// Logout
router.post('/logout',
    AuthMiddleware.authenticate,
    AuthController.logout
);

module.exports = router;