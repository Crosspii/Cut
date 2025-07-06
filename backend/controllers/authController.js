const User = require('../models/User');
const { generateToken, successResponse, errorResponse } = require('../utils/helpers');

// Register new user
const register = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json(errorResponse('User already exists with this email'));
        }

        // Create new user
        const userData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            phone: phone ? phone.trim() : null,
            role: role || 'customer'
        };

        const user = new User(userData);
        const userId = await user.save();

        // Generate token
        const token = generateToken(userId, userData.role);

        // Get created user (without password)
        const createdUser = await User.findById(userId);
        delete createdUser.password;

        res.status(201).json(successResponse({
            user: createdUser,
            token
        }, 'User registered successfully'));

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json(errorResponse('Registration failed. Please try again.'));
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findByEmail(email.toLowerCase().trim());
        if (!user) {
            return res.status(400).json(errorResponse('Invalid email or password'));
        }

        // Check if account is active
        if (user.status !== 'active') {
            return res.status(400).json(errorResponse('Account is inactive. Please contact support.'));
        }

        // Validate password
        const isPasswordValid = await User.validatePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json(errorResponse('Invalid email or password'));
        }

        // Generate token
        const token = generateToken(user.id, user.role);

        // Remove password from response
        delete user.password;

        res.json(successResponse({
            user,
            token
        }, 'Login successful'));

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json(errorResponse('Login failed. Please try again.'));
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json(errorResponse('User not found'));
        }

        delete user.password;
        res.json(successResponse(user));

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json(errorResponse('Failed to fetch profile'));
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const updateData = {};

        if (name && name.trim().length >= 2) {
            updateData.name = name.trim();
        }

        if (phone) {
            if (isValidPhone(phone)) {
                updateData.phone = phone.trim();
            } else {
                return res.status(400).json(errorResponse('Invalid phone number format'));
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json(errorResponse('No valid fields to update'));
        }

        const updatedUser = await User.update(req.user.id, updateData);
        delete updatedUser.password;

        res.json(successResponse(updatedUser, 'Profile updated successfully'));

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json(errorResponse('Failed to update profile'));
    }
};

// Logout (client-side token removal)
const logout = (req, res) => {
    res.json(successResponse(null, 'Logout successful'));
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    logout
};
