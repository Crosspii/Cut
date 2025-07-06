const User = require('../models/User');
const { AuthHelpers, ResponseHelpers } = require('../utils/helpers');

class AuthController {
    // User registration
    static async register(req, res) {
        try {
            const { name, email, password, phone, role } = req.body;

            // Create user
            const userData = {
                name,
                email,
                password,
                phone,
                role: role || 'customer'
            };

            const user = await User.create(userData);

            // Generate token
            const token = AuthHelpers.generateToken(user.id, user.role);

            // Prepare response data
            const responseData = {
                user: user.toJSON(),
                token
            };

            return ResponseHelpers.success(
                res, 
                responseData, 
                'User registered successfully', 
                201
            );
        } catch (error) {
            console.error('Registration error:', error);

            if (error.code === 'ER_DUP_ENTRY') {
                return ResponseHelpers.error(res, 'Email already exists', 400);
            }

            return ResponseHelpers.error(res, 'Registration failed');
        }
    }

    // User login
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Authenticate user
            const user = await User.authenticate(email, password);

            if (!user) {
                return ResponseHelpers.error(res, 'Invalid email or password', 401);
            }

            if (user.status !== 'active') {
                return ResponseHelpers.error(res, 'Account is not active', 403);
            }

            // Generate token
            const token = AuthHelpers.generateToken(user.id, user.role);

            // Prepare response data
            const responseData = {
                user: user.toJSON(),
                token
            };

            return ResponseHelpers.success(res, responseData, 'Login successful');
        } catch (error) {
            console.error('Login error:', error);
            return ResponseHelpers.error(res, 'Login failed');
        }
    }

    // Get current user profile
    static async getProfile(req, res) {
        try {
            const user = req.user;
            return ResponseHelpers.success(res, user.toJSON(), 'Profile retrieved successfully');
        } catch (error) {
            console.error('Get profile error:', error);
            return ResponseHelpers.error(res, 'Failed to retrieve profile');
        }
    }

    // Update user profile
    static async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { name, email, phone } = req.body;

            // Prepare update data
            const updateData = {};
            if (name) updateData.name = name;
            if (email) updateData.email = email;
            if (phone !== undefined) updateData.phone = phone;

            if (Object.keys(updateData).length === 0) {
                return ResponseHelpers.error(res, 'No data provided for update', 400);
            }

            // Update user
            const updatedUser = await User.updateById(userId, updateData);

            if (!updatedUser) {
                return ResponseHelpers.notFound(res, 'User not found');
            }

            return ResponseHelpers.success(
                res, 
                updatedUser.toJSON(), 
                'Profile updated successfully'
            );
        } catch (error) {
            console.error('Update profile error:', error);

            if (error.code === 'ER_DUP_ENTRY') {
                return ResponseHelpers.error(res, 'Email already exists', 400);
            }

            return ResponseHelpers.error(res, 'Failed to update profile');
        }
    }

    // Change password
    static async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;

            // Get user with password
            const user = await User.findById(userId);
            
            if (!user) {
                return ResponseHelpers.notFound(res, 'User not found');
            }

            // Verify current password
            const isCurrentPasswordValid = await User.comparePassword(currentPassword, user.password);
            
            if (!isCurrentPasswordValid) {
                return ResponseHelpers.error(res, 'Current password is incorrect', 400);
            }

            // Hash new password and update
            const hashedNewPassword = await User.hashPassword(newPassword);
            await User.updateById(userId, { password: hashedNewPassword });

            return ResponseHelpers.success(res, null, 'Password changed successfully');
        } catch (error) {
            console.error('Change password error:', error);
            return ResponseHelpers.error(res, 'Failed to change password');
        }
    }

    // Logout (client-side token removal)
    static async logout(req, res) {
        try {
            // In a JWT implementation, logout is typically handled client-side
            // by removing the token. Server-side logout would require token blacklisting.
            return ResponseHelpers.success(res, null, 'Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            return ResponseHelpers.error(res, 'Logout failed');
        }
    }

    // Verify token
    static async verifyToken(req, res) {
        try {
            const user = req.user;
            return ResponseHelpers.success(res, user.toJSON(), 'Token is valid');
        } catch (error) {
            console.error('Token verification error:', error);
            return ResponseHelpers.error(res, 'Token verification failed');
        }
    }
}

module.exports = AuthController;