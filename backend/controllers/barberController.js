const Barber = require('../models/Barber');
const User = require('../models/User');
const { successResponse, errorResponse, isValidPhone } = require('../utils/helpers');

// Get all barbers with filters
const getAllBarbers = async (req, res) => {
    try {
        const filters = {
            city: req.query.city,
            neighborhood: req.query.neighborhood,
            search: req.query.search,
            min_rating: req.query.min_rating,
            sort_by: req.query.sort_by,
            order: req.query.order,
            page: req.query.page || 1,
            limit: req.query.limit || 20
        };

        // Remove undefined filters
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined || filters[key] === '') {
                delete filters[key];
            }
        });

        console.log('Filters:', filters); // Debug log

        const barbers = await Barber.findAll(filters);
        
        res.json(successResponse({
            barbers,
            pagination: {
                page: parseInt(filters.page || 1),
                limit: parseInt(filters.limit || 20),
                total: barbers.length
            }
        }));

    } catch (error) {
        console.error('Get barbers error:', error);
        res.status(500).json(errorResponse('Failed to fetch barbers'));
    }
};

// Get barber by ID
const getBarberById = async (req, res) => {
    try {
        const barberId = req.params.id;
        const barber = await Barber.findById(barberId);

        if (!barber) {
            return res.status(404).json(errorResponse('Barber not found'));
        }

        res.json(successResponse(barber));

    } catch (error) {
        console.error('Get barber error:', error);
        res.status(500).json(errorResponse('Failed to fetch barber'));
    }
};

// Get current barber profile
const getMyProfile = async (req, res) => {
    try {
        if (req.user.role !== 'barber') {
            return res.status(403).json(errorResponse('Only barbers can access this endpoint'));
        }

        const barber = await Barber.findByUserId(req.user.id);
        
        if (!barber) {
            return res.status(404).json(errorResponse('Barber profile not found'));
        }

        res.json(successResponse(barber));

    } catch (error) {
        console.error('Get barber profile error:', error);
        res.status(500).json(errorResponse('Failed to fetch profile'));
    }
};

// Create barber profile
const createProfile = async (req, res) => {
    try {
        if (req.user.role !== 'barber') {
            return res.status(403).json(errorResponse('Only barbers can create profiles'));
        }

        // Check if profile already exists
        const existingProfile = await Barber.findByUserId(req.user.id);
        if (existingProfile) {
            return res.status(400).json(errorResponse('Barber profile already exists'));
        }

        const {
            business_name,
            description,
            address,
            city,
            neighborhood,
            latitude,
            longitude,
            phone,
            services,
            working_hours
        } = req.body;

        // Validate required fields
        if (!business_name || !address || !city) {
            return res.status(400).json(errorResponse('Business name, address, and city are required'));
        }

        // Validate phone if provided
        if (phone && !isValidPhone(phone)) {
            return res.status(400).json(errorResponse('Invalid phone number format'));
        }

        // Validate services array
        if (services && !Array.isArray(services)) {
            return res.status(400).json(errorResponse('Services must be an array'));
        }

        // Validate each service
        if (services) {
            for (const service of services) {
                if (!service.name || !service.price || !service.duration) {
                    return res.status(400).json(errorResponse('Each service must have name, price, and duration'));
                }
                if (service.price <= 0 || service.duration <= 0) {
                    return res.status(400).json(errorResponse('Service price and duration must be positive numbers'));
                }
            }
        }

        // Create barber profile
        const barberData = {
            user_id: req.user.id,
            business_name: business_name.trim(),
            description: description ? description.trim() : null,
            address: address.trim(),
            city: city.trim(),
            neighborhood: neighborhood ? neighborhood.trim() : null,
            latitude: latitude || null,
            longitude: longitude || null,
            phone: phone ? phone.trim() : null,
            services: services || [],
            working_hours: working_hours || {}
        };

        const barber = new Barber(barberData);
        const profileId = await barber.save();

        // Get created profile
        const createdProfile = await Barber.findByUserId(req.user.id);

        res.status(201).json(successResponse(createdProfile, 'Barber profile created successfully'));

    } catch (error) {
        console.error('Create barber profile error:', error);
        res.status(500).json(errorResponse('Failed to create barber profile'));
    }
};

// Update barber profile
const updateProfile = async (req, res) => {
    try {
        if (req.user.role !== 'barber') {
            return res.status(403).json(errorResponse('Only barbers can update profiles'));
        }

        const updateData = {};
        const allowedFields = [
            'business_name', 'description', 'address', 'city', 'neighborhood',
            'latitude', 'longitude', 'phone', 'services', 'working_hours'
        ];

        // Extract allowed fields
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Validate phone if provided
        if (updateData.phone && !isValidPhone(updateData.phone)) {
            return res.status(400).json(errorResponse('Invalid phone number format'));
        }

        // Validate services if provided
        if (updateData.services) {
            if (!Array.isArray(updateData.services)) {
                return res.status(400).json(errorResponse('Services must be an array'));
            }

            for (const service of updateData.services) {
                if (!service.name || !service.price || !service.duration) {
                    return res.status(400).json(errorResponse('Each service must have name, price, and duration'));
                }
                if (service.price <= 0 || service.duration <= 0) {
                    return res.status(400).json(errorResponse('Service price and duration must be positive numbers'));
                }
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json(errorResponse('No valid fields to update'));
        }

        const updatedProfile = await Barber.update(req.user.id, updateData);
        
        if (!updatedProfile) {
            return res.status(404).json(errorResponse('Barber profile not found'));
        }

        res.json(successResponse(updatedProfile, 'Profile updated successfully'));

    } catch (error) {
        console.error('Update barber profile error:', error);
        res.status(500).json(errorResponse('Failed to update profile'));
    }
};

// Get barber availability
const getAvailability = async (req, res) => {
    try {
        const barberId = req.params.id;
        const date = req.query.date;

        if (!date) {
            return res.status(400).json(errorResponse('Date parameter is required'));
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json(errorResponse('Invalid date format. Use YYYY-MM-DD'));
        }

        // Check if date is not in the past
        const requestedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (requestedDate < today) {
            return res.status(400).json(errorResponse('Cannot check availability for past dates'));
        }

        const availability = await Barber.getAvailability(barberId, date);
        res.json(successResponse(availability));

    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json(errorResponse('Failed to fetch availability'));
    }
};

// Search barbers by location - FIXED VERSION
const searchByLocation = async (req, res) => {
    try {
        const { latitude, longitude, radius = 10 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json(errorResponse('Latitude and longitude are required'));
        }

        // Validate latitude and longitude
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const rad = parseFloat(radius);

        if (isNaN(lat) || isNaN(lon) || isNaN(rad)) {
            return res.status(400).json(errorResponse('Invalid latitude, longitude, or radius values'));
        }

        if (lat < -90 || lat > 90) {
            return res.status(400).json(errorResponse('Latitude must be between -90 and 90'));
        }

        if (lon < -180 || lon > 180) {
            return res.status(400).json(errorResponse('Longitude must be between -180 and 180'));
        }

        const barbers = await Barber.searchByLocation(lat, lon, rad);

        res.json(successResponse({
            barbers,
            search_params: { latitude: lat, longitude: lon, radius: rad }
        }));

    } catch (error) {
        console.error('Location search error:', error);
        res.status(500).json(errorResponse('Failed to search by location'));
    }
};

module.exports = {
    getAllBarbers,
    getBarberById,
    getMyProfile,
    createProfile,
    updateProfile,
    getAvailability,
    searchByLocation
};
