class BarberProfile {
    constructor() {
        this.defaultServices = [
            { id: 'haircut', name: 'Haircut', price: 50, duration: 30 },
            { id: 'beard-trim', name: 'Beard Trim', price: 30, duration: 20 },
            { id: 'shave', name: 'Traditional Shave', price: 40, duration: 25 },
            { id: 'styling', name: 'Hair Styling', price: 35, duration: 20 },
            { id: 'wash', name: 'Hair Wash', price: 20, duration: 15 },
            { id: 'treatment', name: 'Hair Treatment', price: 60, duration: 45 }
        ];

        this.customServices = [];
        this.days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        this.dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        this.init();
    }

    async init() {
        console.log('BarberProfile: Initializing...');
        
        // Check authentication
        if (!Auth.isLoggedIn()) {
            console.log('BarberProfile: User not logged in, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        // Check if user is barber
        const user = Auth.getCurrentUser();
        console.log('BarberProfile: Current user:', user);
        
        // Debug: Check token
        const token = localStorage.getItem('token');
        console.log('BarberProfile: Token exists:', !!token);
        if (token) {
            console.log('BarberProfile: Token length:', token.length);
        }
        
        if (user.role !== 'barber') {
            console.log('BarberProfile: User is not a barber, access denied');
            Auth.showAlert('Access denied. This page is for barbers only.', 'danger');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
            return;
        }

        console.log('BarberProfile: Authentication and role checks passed');
        
        try {
            this.setupForm();
            console.log('BarberProfile: Form setup completed');
            await this.loadProfile();
            console.log('BarberProfile: Profile loading completed');
        } catch (error) {
            console.error('BarberProfile: Error during initialization:', error);
            Auth.showAlert('Failed to initialize profile page', 'danger');
            // Show form anyway to prevent infinite loading
            this.showForm();
        }
    }

    setupForm() {
        this.createServicesSection();
        this.createWorkingHoursSection();
        this.attachEventListeners();
        this.debugAvailableServices();
    }

    debugAvailableServices() {
        console.log('BarberProfile: Debugging available services...');
        const allCheckboxes = document.querySelectorAll('[data-service]');
        console.log('BarberProfile: Total service checkboxes found:', allCheckboxes.length);
        
        allCheckboxes.forEach((checkbox, index) => {
            const serviceId = checkbox.dataset.service;
            const label = checkbox.closest('.form-check').querySelector('label');
            const labelText = label ? label.textContent.trim() : 'No label';
            console.log(`BarberProfile: Service ${index + 1}:`, {
                id: serviceId,
                label: labelText,
                checked: checkbox.checked
            });
        });
    }

    createServicesSection() {
        const container = document.getElementById('servicesContainer');
        const allServices = [...this.defaultServices, ...this.customServices];
        
        container.innerHTML = allServices.map(service => `
            <div class="service-item mb-2" data-service-id="${service.id}">
                <div class="form-check d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <input class="form-check-input me-2" type="checkbox" 
                               id="service-${service.id}" data-service="${service.id}">
                        <label class="form-check-label" for="service-${service.id}">
                            ${service.name}
                        </label>
                    </div>
                    <div class="d-flex align-items-center">
                        <span class="badge bg-success me-2">${service.price} MAD</span>
                        <span class="badge bg-info">${service.duration}min</span>
                        ${this.customServices.find(s => s.id === service.id) ? 
                            `<button type="button" class="btn btn-sm btn-outline-danger ms-2" 
                                onclick="BarberProfile.removeCustomService('${service.id}')">
                                <i class="fas fa-times"></i>
                            </button>` : ''
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }

    createWorkingHoursSection() {
        const container = document.getElementById('workingHoursContainer');
        container.innerHTML = this.days.map((day, index) => `
            <div class="row mb-3 align-items-center">
                <div class="col-md-3">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" 
                               id="day-${day}" data-day="${day}">
                        <label class="form-check-label fw-bold" for="day-${day}">
                            ${this.dayNames[index]}
                        </label>
                    </div>
                </div>
                <div class="col-md-4">
                    <input type="time" class="form-control" 
                           id="start-${day}" placeholder="Start time" disabled>
                </div>
                <div class="col-md-1 text-center">
                    <span class="text-muted">to</span>
                </div>
                <div class="col-md-4">
                    <input type="time" class="form-control" 
                           id="end-${day}" placeholder="End time" disabled>
                </div>
            </div>
        `).join('');

        // Add event listeners for day checkboxes
        this.days.forEach(day => {
            const checkbox = document.getElementById(`day-${day}`);
            const startTime = document.getElementById(`start-${day}`);
            const endTime = document.getElementById(`end-${day}`);

            checkbox.addEventListener('change', () => {
                startTime.disabled = !checkbox.checked;
                endTime.disabled = !checkbox.checked;
                if (!checkbox.checked) {
                    startTime.value = '';
                    endTime.value = '';
                } else {
                    // Set default times if enabling
                    if (!startTime.value) startTime.value = '09:00';
                    if (!endTime.value) endTime.value = '18:00';
                }
            });
        });
    }

    attachEventListeners() {
        document.getElementById('barberProfileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });
    }

    // Location Methods
    static async getCurrentLocation() {
        if (!navigator.geolocation) {
            Auth.showAlert('Geolocation is not supported by this browser.', 'danger');
            return;
        }

        const loadingBtn = document.querySelector('button[onclick="BarberProfile.getCurrentLocation()"]');
        const originalText = loadingBtn.innerHTML;
        loadingBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Getting Location...';
        loadingBtn.disabled = true;

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                });
            });

            const { latitude, longitude } = position.coords;
            document.getElementById('latitude').value = latitude.toFixed(6);
            document.getElementById('longitude').value = longitude.toFixed(6);
            
            Auth.showAlert('Location updated successfully!', 'success');
        } catch (error) {
            console.error('Location error:', error);
            let message = 'Unable to get your location. ';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message += 'Please enable location permissions.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message += 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    message += 'Location request timed out.';
                    break;
                default:
                    message += 'An unknown error occurred.';
                    break;
            }
            
            Auth.showAlert(message, 'warning');
        } finally {
            loadingBtn.innerHTML = originalText;
            loadingBtn.disabled = false;
        }
    }

    static clearLocation() {
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';
        Auth.showAlert('Location cleared.', 'info');
    }

    // Service Methods
    static addCustomService() {
        const name = document.getElementById('customServiceName').value.trim();
        const price = parseInt(document.getElementById('customServicePrice').value);
        
        if (!name || !price || price <= 0) {
            Auth.showAlert('Please enter a valid service name and price.', 'warning');
            return;
        }

        const customId = 'custom_' + Date.now();
        const newService = {
            id: customId,
            name: name,
            price: price,
            duration: 30 // Default duration
        };

        // Get the current instance (this is a bit hacky but works)
        const instance = window.barberProfileInstance;
        if (instance) {
            instance.customServices.push(newService);
            instance.createServicesSection();
            
            // Clear inputs
            document.getElementById('customServiceName').value = '';
            document.getElementById('customServicePrice').value = '';
            
            Auth.showAlert('Custom service added!', 'success');
        }
    }

    static removeCustomService(serviceId) {
        const instance = window.barberProfileInstance;
        if (instance) {
            instance.customServices = instance.customServices.filter(s => s.id !== serviceId);
            instance.createServicesSection();
            Auth.showAlert('Service removed.', 'info');
        }
    }

    // Working Hours Quick Set Methods
    static setStandardHours() {
        const workdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        workdays.forEach(day => {
            const dayCheckbox = document.getElementById(`day-${day}`);
            const startTime = document.getElementById(`start-${day}`);
            const endTime = document.getElementById(`end-${day}`);
            
            dayCheckbox.checked = true;
            startTime.disabled = false;
            endTime.disabled = false;
            startTime.value = '09:00';
            endTime.value = '18:00';
        });
        Auth.showAlert('Standard working hours set (Monday-Friday, 9 AM to 6 PM).', 'success');
    }

    static setExtendedHours() {
        const workdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        workdays.forEach(day => {
            const dayCheckbox = document.getElementById(`day-${day}`);
            const startTime = document.getElementById(`start-${day}`);
            const endTime = document.getElementById(`end-${day}`);
            
            dayCheckbox.checked = true;
            startTime.disabled = false;
            endTime.disabled = false;
            startTime.value = '08:00';
            endTime.value = '20:00';
        });
        Auth.showAlert('Extended working hours set (Monday-Saturday, 8 AM to 8 PM).', 'success');
    }

    static clearAllHours() {
        this.prototype.days.forEach(day => {
            const dayCheckbox = document.getElementById(`day-${day}`);
            const startTime = document.getElementById(`start-${day}`);
            const endTime = document.getElementById(`end-${day}`);
            
            dayCheckbox.checked = false;
            startTime.disabled = true;
            endTime.disabled = true;
            startTime.value = '';
            endTime.value = '';
        });
        Auth.showAlert('All working hours cleared.', 'info');
    }

    async loadProfile() {
        console.log('BarberProfile: Loading profile...');
        
        // Debug: Check if we have a valid token
        const token = localStorage.getItem('auth_token');
        console.log('BarberProfile: Token exists:', !!token);
        if (token) {
            console.log('BarberProfile: Token length:', token.length);
            console.log('BarberProfile: Token preview:', token.substring(0, 20) + '...');
        }
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
        });
        
        try {
            console.log('BarberProfile: Making API request to /barbers/profile');
            const response = await Promise.race([
                Auth.makeRequest('/barbers/profile'),
                timeoutPromise
            ]);
            console.log('BarberProfile: API response received:', response);
            console.log('BarberProfile: Response success:', response.success);
            console.log('BarberProfile: Response data:', response.data);
            
            if (response.success && response.data) {
                console.log('BarberProfile: Populating form with existing data');
                this.populateForm(response.data);
            } else {
                console.log('BarberProfile: No existing profile or empty response, setting defaults');
                // New profile - set defaults
                this.setDefaultWorkingHours();
            }
            
            this.showForm();
        } catch (error) {
            console.error('BarberProfile: Load profile error:', error);
            console.error('BarberProfile: Error message:', error.message);
            console.error('BarberProfile: Error stack:', error.stack);
            
            if (error.message.includes('404') || error.message.includes('not found')) {
                console.log('BarberProfile: Profile not found (404), setting defaults');
                // New profile
                this.setDefaultWorkingHours();
                this.showForm();
            } else if (error.message.includes('timeout')) {
                console.log('BarberProfile: Request timeout, showing form with defaults');
                Auth.showAlert('Request timeout. Showing form with default settings.', 'warning');
                this.setDefaultWorkingHours();
                this.showForm();
            } else {
                console.error('BarberProfile: Unexpected error loading profile:', error);
                Auth.showAlert('Failed to load profile: ' + (error.message || 'Unknown error') + '. Showing form with defaults.', 'warning');
                // Show form anyway to prevent infinite loading
                this.setDefaultWorkingHours();
                this.showForm();
            }
        }
    }

    populateForm(profile) {
        console.log('BarberProfile: Populating form with profile data:', profile);
        
        // Basic information
        document.getElementById('businessName').value = profile.business_name || '';
        document.getElementById('description').value = profile.description || '';
        document.getElementById('phone').value = profile.phone || '';
        document.getElementById('address').value = profile.address || '';
        document.getElementById('city').value = profile.city || '';
        document.getElementById('neighborhood').value = profile.neighborhood || '';
        document.getElementById('latitude').value = profile.latitude || '';
        document.getElementById('longitude').value = profile.longitude || '';

        console.log('BarberProfile: Basic info populated');

        // Services - Handle both old string format and new array format
        if (profile.services) {
            let services = [];
            try {
                if (typeof profile.services === 'string') {
                    services = JSON.parse(profile.services);
                } else if (Array.isArray(profile.services)) {
                    services = profile.services;
                }
                
                console.log('BarberProfile: Processing services from API:', services);
                
                // Clear existing custom services and add API services as custom services
                this.customServices = [];
                
                // Add all API services as custom services
                services.forEach(service => {
                    console.log('BarberProfile: Processing service:', service);
                    
                    if (typeof service === 'object' && service.name) {
                        // Add as custom service with generated ID if not present
                        const customService = {
                            ...service,
                            id: service.id || `custom_${service.name.toLowerCase().replace(/\s+/g, '_')}`
                        };
                        console.log('BarberProfile: Adding as custom service:', customService);
                        this.customServices.push(customService);
                    }
                });
                
                // Recreate the services section to include custom services
                if (this.customServices.length > 0) {
                    console.log('BarberProfile: Recreating services section with custom services');
                    this.createServicesSection();
                    
                    // Check the custom service checkboxes
                    this.customServices.forEach(service => {
                        // Use the actual service ID from the API
                        const serviceId = service.id;
                        const checkbox = document.querySelector(`[data-service="${serviceId}"]`);
                        if (checkbox) {
                            checkbox.checked = true;
                            console.log('BarberProfile: Checked custom service:', service.name, 'with ID:', serviceId);
                        } else {
                            console.log('BarberProfile: Custom service checkbox not found for ID:', serviceId);
                            // Debug: list all available checkboxes
                            const allCheckboxes = document.querySelectorAll('[data-service]');
                            console.log('BarberProfile: Available checkboxes:', Array.from(allCheckboxes).map(cb => cb.dataset.service));
                        }
                    });
                }
                
            } catch (e) {
                console.error('BarberProfile: Error parsing services:', e);
            }
        } else {
            console.log('BarberProfile: No services found in profile, setting defaults');
            // Set some default services if none exist
            const defaultServices = ['haircut', 'beard-trim'];
            defaultServices.forEach(serviceId => {
                const checkbox = document.querySelector(`[data-service="${serviceId}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    console.log('BarberProfile: Set default service:', serviceId);
                }
            });
        }

        // Working hours - Handle both open/close and start/end formats
        if (profile.working_hours) {
            try {
                let hours = {};
                if (typeof profile.working_hours === 'string') {
                    hours = JSON.parse(profile.working_hours);
                } else {
                    hours = profile.working_hours;
                }
                
                console.log('BarberProfile: Processing working hours:', hours);
                
                Object.keys(hours).forEach(day => {
                    const dayCheckbox = document.getElementById(`day-${day}`);
                    const startTime = document.getElementById(`start-${day}`);
                    const endTime = document.getElementById(`end-${day}`);
                    
                    if (dayCheckbox && startTime && endTime) {
                        const dayHours = hours[day];
                        
                        // Handle both open/close and start/end formats
                        let startValue = null;
                        let endValue = null;
                        
                        if (dayHours) {
                            if (dayHours.closed) {
                                // Day is closed, don't check the checkbox
                                console.log('BarberProfile: Day closed:', day);
                                return;
                            } else if (dayHours.open && dayHours.close) {
                                // open/close format (API format)
                                startValue = dayHours.open;
                                endValue = dayHours.close;
                            } else if (dayHours.start && dayHours.end) {
                                // start/end format (legacy)
                                startValue = dayHours.start;
                                endValue = dayHours.end;
                            }
                            
                            if (startValue && endValue) {
                                dayCheckbox.checked = true;
                                startTime.disabled = false;
                                endTime.disabled = false;
                                startTime.value = startValue;
                                endTime.value = endValue;
                                console.log('BarberProfile: Set hours for', day, ':', startValue, '-', endValue);
                            }
                        }
                    }
                });
            } catch (e) {
                console.error('BarberProfile: Error parsing working hours:', e);
            }
        } else {
            console.log('BarberProfile: No working hours found, setting defaults');
            this.setDefaultWorkingHours();
        }
        
        console.log('BarberProfile: Form population completed');
    }

    setDefaultWorkingHours() {
        // Set default working hours (Monday to Friday, 9 AM to 6 PM)
        const workdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        workdays.forEach(day => {
            const dayCheckbox = document.getElementById(`day-${day}`);
            const startTime = document.getElementById(`start-${day}`);
            const endTime = document.getElementById(`end-${day}`);
            
            if (dayCheckbox && startTime && endTime) {
                dayCheckbox.checked = true;
                startTime.disabled = false;
                endTime.disabled = false;
                startTime.value = '09:00';
                endTime.value = '18:00';
            }
        });
    }

    async saveProfile() {
        try {
            const formData = this.getFormData();
            console.log('BarberProfile: Saving form data:', formData);
            
            if (!this.validateForm(formData)) {
                console.log('BarberProfile: Form validation failed');
                return;
            }

            const submitBtn = document.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
            submitBtn.disabled = true;

            console.log('BarberProfile: Starting save process...');

            // Try to update first (PUT), if it fails, try to create (POST)
            let response;
            try {
                console.log('BarberProfile: Attempting to update profile (PUT)');
                response = await Auth.makeRequest('/barbers/profile', {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                console.log('BarberProfile: PUT request successful:', response);
            } catch (error) {
                console.log('BarberProfile: Update failed, trying to create (POST):', error.message);
                response = await Auth.makeRequest('/barbers/profile', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                console.log('BarberProfile: POST request successful:', response);
            }

            console.log('BarberProfile: Final save response:', response);

            if (response.success) {
                console.log('BarberProfile: Save successful, showing success message');
                Auth.showAlert('Profile saved successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'barber-dashboard.html';
                }, 1500);
            } else {
                console.log('BarberProfile: Save failed with response:', response);
                throw new Error(response.message || 'Failed to save profile');
            }
        } catch (error) {
            console.error('BarberProfile: Save profile error:', error);
            console.error('BarberProfile: Error details:', {
                message: error.message,
                stack: error.stack
            });
            Auth.showAlert(error.message || 'Failed to save profile', 'danger');
        } finally {
            console.log('BarberProfile: Resetting button state');
            const submitBtn = document.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Profile';
            submitBtn.disabled = false;
        }
    }

    getFormData() {
        console.log('BarberProfile: Getting form data...');
        
        // Get selected services with details
        const allServices = [...this.defaultServices, ...this.customServices];
        console.log('BarberProfile: All available services:', allServices);
        
        const serviceCheckboxes = document.querySelectorAll('[data-service]:checked');
        console.log('BarberProfile: Found checked service checkboxes:', serviceCheckboxes.length);
        
        const selectedServices = Array.from(serviceCheckboxes)
            .map(checkbox => {
                const serviceId = checkbox.dataset.service;
                const service = allServices.find(s => s.id === serviceId);
                console.log('BarberProfile: Processing service checkbox:', serviceId, service);
                return service || { id: serviceId, name: serviceId, price: 50, duration: 30 };
            });
        
        console.log('BarberProfile: Selected services:', selectedServices);

        // Get working hours - use open/close format to match API
        const workingHours = {};
        this.days.forEach(day => {
            const dayCheckbox = document.getElementById(`day-${day}`);
            const startTime = document.getElementById(`start-${day}`);
            const endTime = document.getElementById(`end-${day}`);
            
            if (dayCheckbox && dayCheckbox.checked && startTime && startTime.value && endTime && endTime.value) {
                workingHours[day] = {
                    open: startTime.value,  // Use 'open' instead of 'start'
                    close: endTime.value,   // Use 'close' instead of 'end'
                    closed: false
                };
                console.log('BarberProfile: Added working hours for', day, ':', workingHours[day]);
            }
        });

        const formData = {
            business_name: document.getElementById('businessName').value.trim(),
            description: document.getElementById('description').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            address: document.getElementById('address').value.trim(),
            city: document.getElementById('city').value.trim(),
            neighborhood: document.getElementById('neighborhood').value.trim(),
            latitude: document.getElementById('latitude').value || null,
            longitude: document.getElementById('longitude').value || null,
            services: selectedServices,
            working_hours: workingHours
        };
        
        console.log('BarberProfile: Final form data:', formData);
        return formData;
    }

    validateForm(data) {
        console.log('BarberProfile: Validating form data:', data);
        
        if (!data.business_name) {
            Auth.showAlert('Business name is required', 'danger');
            return false;
        }

        if (!data.address) {
            Auth.showAlert('Address is required', 'danger');
            return false;
        }

        if (!data.city) {
            Auth.showAlert('City is required', 'danger');
            return false;
        }

        if (data.services.length === 0) {
            console.log('BarberProfile: No services selected, showing warning');
            Auth.showAlert('Please select at least one service. You can select multiple services.', 'warning');
            return false;
        }

        if (Object.keys(data.working_hours).length === 0) {
            console.log('BarberProfile: No working hours set, showing warning');
            Auth.showAlert('Please set at least one working day and time.', 'warning');
            return false;
        }

        console.log('BarberProfile: Form validation passed');
        return true;
    }

    showForm() {
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('profileForm').style.display = 'block';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.barberProfileInstance = new BarberProfile();
});

// Make BarberProfile available globally for onclick handlers
window.BarberProfile = BarberProfile;
