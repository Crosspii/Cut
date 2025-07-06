/**
 * AuthManager - Frontend authentication management
 * Handles user authentication, token management, and API communication
 */
class AuthManager {
    constructor() {
        this.baseURL = '/api/auth';
        this.tokenKey = 'cut_auth_token';
        this.userKey = 'cut_user_data';
    }

    /**
     * Check if user is currently logged in
     */
    isLoggedIn() {
        const token = this.getToken();
        const user = this.getUser();
        return !!(token && user);
    }

    /**
     * Get stored authentication token
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Get stored user data
     */
    getUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Store authentication token and user data
     */
    setAuthData(token, user) {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    /**
     * Clear authentication data
     */
    clearAuthData() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    /**
     * Make authenticated API request
     */
    async apiRequest(endpoint, options = {}) {
        const token = this.getToken();
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    this.clearAuthData();
                    window.location.href = '/login';
                }
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    /**
     * Register new user
     */
    async register(userData) {
        try {
            const response = await this.apiRequest('/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (response.success) {
                this.setAuthData(response.data.token, response.data.user);
            }

            return response;
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Login user
     */
    async login(email, password) {
        try {
            const response = await this.apiRequest('/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (response.success) {
                this.setAuthData(response.data.token, response.data.user);
            }

            return response;
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await this.apiRequest('/logout', {
                method: 'POST'
            });
        } catch (error) {
            // Continue with logout even if API call fails
            console.warn('Logout API call failed:', error.message);
        } finally {
            this.clearAuthData();
            window.location.href = '/login';
        }
    }

    /**
     * Get current user profile
     */
    async getProfile() {
        try {
            const response = await this.apiRequest('/profile');
            
            if (response.success) {
                // Update stored user data
                this.setAuthData(this.getToken(), response.data);
            }
            
            return response;
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(userData) {
        try {
            const response = await this.apiRequest('/profile', {
                method: 'PUT',
                body: JSON.stringify(userData)
            });

            if (response.success) {
                // Update stored user data
                this.setAuthData(this.getToken(), response.data);
            }

            return response;
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.apiRequest('/password', {
                method: 'PUT',
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword: newPassword
                })
            });

            return response;
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Verify current token
     */
    async verifyToken() {
        try {
            const response = await this.apiRequest('/verify');
            
            if (response.success) {
                // Update stored user data
                this.setAuthData(this.getToken(), response.data);
            }
            
            return response;
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Initialize authentication state
     * Call this on page load to verify token validity
     */
    async init() {
        if (!this.isLoggedIn()) {
            return false;
        }

        try {
            const result = await this.verifyToken();
            return result.success;
        } catch (error) {
            this.clearAuthData();
            return false;
        }
    }

    /**
     * Require authentication for a page
     * Redirects to login if not authenticated
     */
    async requireAuth() {
        const isValid = await this.init();
        
        if (!isValid) {
            window.location.href = '/login';
            return false;
        }
        
        return true;
    }

    /**
     * Redirect if already authenticated
     * Useful for login/register pages
     */
    async redirectIfAuthenticated(redirectTo = '/') {
        const isValid = await this.init();
        
        if (isValid) {
            window.location.href = redirectTo;
            return true;
        }
        
        return false;
    }
}

/**
 * Form validation utilities
 */
class FormValidator {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password) {
        return password.length >= 6 && /^(?=.*[A-Za-z])(?=.*\d)/.test(password);
    }

    static validatePhone(phone) {
        if (!phone) return true; // Phone is optional
        const phoneRegex = /^(\+212|0)[567]\d{8}$/;
        return phoneRegex.test(phone);
    }

    static validateName(name) {
        return name && name.trim().length >= 2 && name.trim().length <= 100;
    }
}

/**
 * DOM utilities for form handling
 */
class DOMHelper {
    static showAlert(elementId, message, type = 'info') {
        const alertEl = document.getElementById(elementId);
        if (alertEl) {
            alertEl.textContent = message;
            alertEl.className = `alert ${type}`;
            alertEl.style.display = 'block';
        }
    }

    static hideAlert(elementId) {
        const alertEl = document.getElementById(elementId);
        if (alertEl) {
            alertEl.style.display = 'none';
        }
    }

    static showFieldError(fieldName, message) {
        const input = document.getElementById(fieldName);
        const errorEl = document.getElementById(fieldName + 'Error');
        
        if (input) input.classList.add('error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    static clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => el.style.display = 'none');
        
        const inputs = document.querySelectorAll('input.error');
        inputs.forEach(input => input.classList.remove('error'));
    }

    static setLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = isLoading;
            if (isLoading) {
                button.setAttribute('data-original-text', button.textContent);
                button.textContent = 'Loading...';
            } else {
                const originalText = button.getAttribute('data-original-text');
                if (originalText) {
                    button.textContent = originalText;
                }
            }
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, FormValidator, DOMHelper };
}