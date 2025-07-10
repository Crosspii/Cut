// Authentication utility class
class Auth {
    static API_BASE = '/api';
    
    // Check if user is logged in
    static isLoggedIn() {
        return localStorage.getItem('auth_token') !== null;
    }
    
    // Get current user data
    static getCurrentUser() {
        const userData = localStorage.getItem('cut_user');
        return userData ? JSON.parse(userData) : null;
    }
    
    // Get auth token
    static getToken() {
        return localStorage.getItem('auth_token');
    }
    
    // Set auth data
    static setAuthData(token, user) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('cut_user', JSON.stringify(user));
    }
    
    // Clear auth data
    static clearAuthData() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('cut_user');
    }
    
    // Make authenticated API request
    static async makeRequest(endpoint, options = {}) {
        const token = Auth.getToken();
        
        console.log(`Making request to: ${Auth.API_BASE}${endpoint}`);
        console.log('Token:', token ? 'Present' : 'Missing');
        console.log('Options:', options);
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        console.log('Final options:', finalOptions);
        
        try {
            const response = await fetch(`${Auth.API_BASE}${endpoint}`, finalOptions);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('makeRequest error:', error);
            throw error;
        }
    }
    
    // Show alert message
    static showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;
        
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible fade show`;
        alertElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alertElement);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertElement.remove();
        }, 5000);
    }
    
    // Handle login form
    static handleLogin() {
        const form = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        const togglePassword = document.getElementById('togglePassword');
        
        // Toggle password visibility
        if (togglePassword) {
            togglePassword.addEventListener('click', function() {
                const passwordInput = document.getElementById('password');
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        }
        
        // Handle form submission
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password')
            };
            
            try {
                // Show loading state
                loginBtn.querySelector('.btn-text').classList.add('d-none');
                loginBtn.querySelector('.loading').classList.remove('d-none');
                loginBtn.disabled = true;
                
                // Make login request
                const response = await Auth.makeRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify(loginData)
                });

                if (response.success) {
                    // Store auth data
                    Auth.setAuthData(response.data.token, response.data.user);
                    
                    // Show success message
                    Auth.showAlert('Login successful! Redirecting...', 'success');
                    
                    // Redirect based on role
                    setTimeout(() => {
                        if (response.data.user.role === 'barber') {
                            window.location.href = 'barber-dashboard.html';
                        } else {
                            window.location.href = 'dashboard.html';
                        }
                    }, 1000);
                } else {
                    Auth.showAlert(response.message, 'danger');
                }

            } catch (error) {
                Auth.showAlert(error.message || 'Login failed. Please try again.', 'danger');
            } finally {
                // Reset button state
                loginBtn.querySelector('.btn-text').classList.remove('d-none');
                loginBtn.querySelector('.loading').classList.add('d-none');
                loginBtn.disabled = false;
            }
        });
    }
    
    // Handle registration form
    static handleRegistration() {
        const form = document.getElementById('registerForm');
        const registerBtn = document.getElementById('registerBtn');
        const togglePassword = document.getElementById('togglePassword');
        
        // Toggle password visibility
        if (togglePassword) {
            togglePassword.addEventListener('click', function() {
                const passwordInput = document.getElementById('password');
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        }
        
        // Password confirmation validation
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        function validatePasswordMatch() {
            if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
                confirmPasswordInput.setCustomValidity('Passwords do not match');
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        }
        
        passwordInput.addEventListener('input', validatePasswordMatch);
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
        
        // Handle form submission
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const registerData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                password: formData.get('password'),
                role: formData.get('role')
            };
            
            // Validate password match
            if (registerData.password !== formData.get('confirmPassword')) {
                Auth.showAlert('Passwords do not match', 'danger');
                return;
            }
            
            try {
                // Show loading state
                registerBtn.querySelector('.btn-text').classList.add('d-none');
                registerBtn.querySelector('.loading').classList.remove('d-none');
                registerBtn.disabled = true;
                
                // Make registration request
                const response = await Auth.makeRequest('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify(registerData)
                });

                if (response.success) {
                    // Store auth data
                    Auth.setAuthData(response.data.token, response.data.user);
                    
                    // Show success message
                    Auth.showAlert('Account created successfully! Redirecting...', 'success');
                    
                    // Redirect based on role
                    setTimeout(() => {
                        if (response.data.user.role === 'barber') {
                            window.location.href = 'barber-profile.html';
                        } else {
                            window.location.href = 'dashboard.html';
                        }
                    }, 1000);
                } else {
                    Auth.showAlert(response.message, 'danger');
                }

            } catch (error) {
                Auth.showAlert(error.message || 'Registration failed. Please try again.', 'danger');
            } finally {
                // Reset button state
                registerBtn.querySelector('.btn-text').classList.remove('d-none');
                registerBtn.querySelector('.loading').classList.add('d-none');
                registerBtn.disabled = false;
            }
        });
    }
    
    // Logout user
    static async logout() {
        try {
            // Call logout endpoint
            await Auth.makeRequest('/auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local data regardless of API call result
            Auth.clearAuthData();
            window.location.href = 'index.html';
        }
    }
    
    // Check authentication status and redirect if needed
    static checkAuth(requiredRole = null) {
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        
        const user = Auth.getCurrentUser();
        if (requiredRole && user.role !== requiredRole) {
            Auth.showAlert('You do not have permission to access this page', 'danger');
            window.location.href = 'dashboard.html';
            return false;
        }
        
        return true;
    }

    // Check if user has specific role
    static checkRole(requiredRole) {
        const user = Auth.getCurrentUser();
        return user && user.role === requiredRole;
    }
}

Auth.debugToken = function() {
    const token = localStorage.getItem('auth_token');
    console.log('Current token:', token);
    
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token payload:', payload);
            console.log('Token expires:', new Date(payload.exp * 1000));
        } catch (e) {
            console.log('Invalid token format');
        }
    }
};
// Export for use in other files
window.Auth = Auth;
