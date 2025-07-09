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

// Validate barber profile creation
const validateBarberProfile = (req, res, next) => {
    const { business_name, address, city, phone, services, working_hours } = req.body;
    const errors = [];

    // Required fields
    if (!business_name || business_name.trim().length < 2) {
        errors.push('Business name must be at least 2 characters long');
    }

    if (!address || address.trim().length < 5) {
        errors.push('Address must be at least 5 characters long');
    }

    if (!city || city.trim().length < 2) {
        errors.push('City is required');
    }

    // Phone validation (optional)
    if (phone && !isValidPhone(phone)) {
        errors.push('Invalid phone number format');
    }

    // Services validation (optional)
    if (services) {
        if (!Array.isArray(services)) {
            errors.push('Services must be an array');
        } else {
            services.forEach((service, index) => {
                if (!service.name || service.name.trim().length < 2) {
                    errors.push(`Service ${index + 1}: Name is required and must be at least 2 characters`);
                }
                if (!service.price || service.price <= 0) {
                    errors.push(`Service ${index + 1}: Price must be a positive number`);
                }
                if (!service.duration || service.duration <= 0) {
                    errors.push(`Service ${index + 1}: Duration must be a positive number`);
                }
            });
        }
    }

    // Working hours validation (optional)
    if (working_hours) {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

        Object.keys(working_hours).forEach(day => {
            if (!validDays.includes(day.toLowerCase())) {
                errors.push(`Invalid day: ${day}`);
            } else {
                const hours = working_hours[day];
                if (hours && !hours.closed) {
                    if (!hours.open || !timeRegex.test(hours.open)) {
                        errors.push(`${day}: Invalid opening time format (use HH:MM)`);
                    }
                    if (!hours.close || !timeRegex.test(hours.close)) {
                        errors.push(`${day}: Invalid closing time format (use HH:MM)`);
                    }
                    if (hours.open && hours.close && hours.open >= hours.close) {
                        errors.push(`${day}: Opening time must be before closing time`);
                    }
                }
            }
        });
    }

    if (errors.length > 0) {
        return res.status(400).json(errorResponse('Validation failed', errors));
    }

    next();
};

// Validate barber profile update
const validateBarberUpdate = (req, res, next) => {
    const updateFields = req.body;
    const errors = [];

    // Only validate fields that are being updated
    if (updateFields.business_name !== undefined) {
        if (!updateFields.business_name || updateFields.business_name.trim().length < 2) {
            errors.push('Business name must be at least 2 characters long');
        }
    }

    if (updateFields.address !== undefined) {
        if (!updateFields.address || updateFields.address.trim().length < 5) {
            errors.push('Address must be at least 5 characters long');
        }
    }

    if (updateFields.city !== undefined) {
        if (!updateFields.city || updateFields.city.trim().length < 2) {
            errors.push('City is required');
        }
    }

    if (updateFields.phone !== undefined && updateFields.phone) {
        if (!isValidPhone(updateFields.phone)) {
            errors.push('Invalid phone number format');
        }
    }

    // Services validation
    if (updateFields.services !== undefined) {
        if (!Array.isArray(updateFields.services)) {
            errors.push('Services must be an array');
        } else {
            updateFields.services.forEach((service, index) => {
                if (!service.name || service.name.trim().length < 2) {
                    errors.push(`Service ${index + 1}: Name is required and must be at least 2 characters`);
                }
                if (!service.price || service.price <= 0) {
                    errors.push(`Service ${index + 1}: Price must be a positive number`);
                }
                if (!service.duration || service.duration <= 0) {
                    errors.push(`Service ${index + 1}: Duration must be a positive number`);
                }
            });
        }
    }

    // Working hours validation
    if (updateFields.working_hours !== undefined) {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

        Object.keys(updateFields.working_hours).forEach(day => {
            if (!validDays.includes(day.toLowerCase())) {
                errors.push(`Invalid day: ${day}`);
            } else {
                const hours = updateFields.working_hours[day];
                if (hours && !hours.closed) {
                    if (!hours.open || !timeRegex.test(hours.open)) {
                        errors.push(`${day}: Invalid opening time format (use HH:MM)`);
                    }
                    if (!hours.close || !timeRegex.test(hours.close)) {
                        errors.push(`${day}: Invalid closing time format (use HH:MM)`);
                    }
                    if (hours.open && hours.close && hours.open >= hours.close) {
                        errors.push(`${day}: Opening time must be before closing time`);
                    }
                }
            }
        });
    }

    if (errors.length > 0) {
        return res.status(400).json(errorResponse('Validation failed', errors));
    }

    next();
};

// Validate booking data
const validateBooking = (req, res, next) => {
    const { 
        barber_id, 
        service_name, 
        service_price, 
        service_duration, 
        appointment_date, 
        appointment_time 
    } = req.body;
    
    const errors = [];

    // Required fields
    if (!barber_id) {
        errors.push('Barber ID is required');
    }

    if (!service_name || service_name.trim().length < 2) {
        errors.push('Service name is required');
    }

    if (!service_price || service_price <= 0) {
        errors.push('Valid service price is required');
    }

    if (!service_duration || service_duration <= 0) {
        errors.push('Valid service duration is required');
    }

    if (!appointment_date) {
        errors.push('Appointment date is required');
    }

    if (!appointment_time) {
        errors.push('Appointment time is required');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (appointment_date && !dateRegex.test(appointment_date)) {
        errors.push('Invalid date format. Use YYYY-MM-DD');
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (appointment_time && !timeRegex.test(appointment_time)) {
        errors.push('Invalid time format. Use HH:MM');
    }

    // Check if date is not in the past
    if (appointment_date) {
        const appointmentDate = new Date(appointment_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (appointmentDate < today) {
            errors.push('Cannot book appointments for past dates');
        }
    }

    // Check if appointment is not too far in the future (e.g., 3 months)
    if (appointment_date) {
        const appointmentDate = new Date(appointment_date);
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);

        if (appointmentDate > maxDate) {
            errors.push('Cannot book appointments more than 3 months in advance');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json(errorResponse('Validation failed', errors));
    }

    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateBarberProfile,
    validateBarberUpdate,
    validateBooking
};
