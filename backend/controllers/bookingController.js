const Booking = require('../models/Booking');
const Barber = require('../models/Barber');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/helpers');

// Create new booking
const createBooking = async (req, res) => {
    try {
        const {
            barber_id,
            service_name,
            service_price,
            service_duration,
            appointment_date,
            appointment_time,
            notes
        } = req.body;

        // Validate booking data
        const bookingData = {
            customer_id: req.user.id,
            barber_id,
            service_name,
            service_price: parseFloat(service_price),
            service_duration: parseInt(service_duration),
            appointment_date,
            appointment_time,
            total_price: parseFloat(service_price),
            notes
        };

        const validationErrors = Booking.validateBookingData(bookingData);
        if (validationErrors.length > 0) {
            return res.status(400).json(errorResponse('Validation failed', validationErrors));
        }

        // Check if barber exists and is active
        const barber = await Barber.findByUserId(barber_id);
        if (!barber) {
            return res.status(404).json(errorResponse('Barber not found'));
        }

        if (!barber.is_active) {
            return res.status(400).json(errorResponse('Barber is not currently accepting bookings'));
        }

        // Check barber availability for the requested date and time
        const availability = await Barber.getAvailability(barber_id, appointment_date);
        if (!availability.available || !availability.slots.includes(appointment_time)) {
            return res.status(400).json(errorResponse('Selected time slot is not available'));
        }

        // Check for booking conflicts
        const conflictCheck = await Booking.checkConflicts(
            barber_id, 
            appointment_date, 
            appointment_time, 
            service_duration
        );

        if (conflictCheck.hasConflict) {
            return res.status(400).json(errorResponse('Time slot conflicts with existing booking'));
        }

        // Create the booking
        const booking = new Booking(bookingData);
        const bookingId = await booking.save();

        // Get the created booking with full details
        const createdBooking = await Booking.findById(bookingId);

        res.status(201).json(successResponse(createdBooking, 'Booking created successfully'));

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json(errorResponse('Failed to create booking'));
    }
};

// Get booking by ID
const getBookingById = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json(errorResponse('Booking not found'));
        }

        // Check if user has permission to view this booking
        if (req.user.role === 'customer' && booking.customer_id !== req.user.id) {
            return res.status(403).json(errorResponse('You can only view your own bookings'));
        }

        if (req.user.role === 'barber' && booking.barber_id !== req.user.id) {
            return res.status(403).json(errorResponse('You can only view your own bookings'));
        }

        res.json(successResponse(booking));

    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json(errorResponse('Failed to fetch booking'));
    }
};

// Get user's bookings (customer or barber)
const getMyBookings = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            from_date: req.query.from_date,
            to_date: req.query.to_date,
            page: req.query.page || 1,
            limit: req.query.limit || 20
        };

        // Remove undefined filters
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined || filters[key] === '') {
                delete filters[key];
            }
        });

        let bookings;
        if (req.user.role === 'customer') {
            bookings = await Booking.findByCustomerId(req.user.id, filters);
        } else if (req.user.role === 'barber') {
            bookings = await Booking.findByBarberId(req.user.id, filters);
        } else {
            return res.status(403).json(errorResponse('Invalid user role'));
        }

        res.json(successResponse({
            bookings,
            pagination: {
                page: parseInt(filters.page || 1),
                limit: parseInt(filters.limit || 20),
                total: bookings.length
            }
        }));

    } catch (error) {
        console.error('Get my bookings error:', error);
        res.status(500).json(errorResponse('Failed to fetch bookings'));
    }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json(errorResponse('Status is required'));
        }

        // Get the booking first
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json(errorResponse('Booking not found'));
        }

        // Check permissions
        let canUpdate = false;
        const allowedTransitions = {
            customer: {
                pending: ['cancelled'],
                confirmed: ['cancelled']
            },
            barber: {
                pending: ['confirmed', 'cancelled'],
                confirmed: ['completed', 'cancelled', 'no_show'],
                completed: [] // Cannot change completed status
            }
        };

        // Check if user has permission to update this booking
        if (req.user.role === 'customer' && booking.customer_id === req.user.id) {
            canUpdate = allowedTransitions.customer[booking.status]?.includes(status);
        } else if (req.user.role === 'barber' && booking.barber_id === req.user.id) {
            canUpdate = allowedTransitions.barber[booking.status]?.includes(status);
        }

        if (!canUpdate) {
            return res.status(403).json(errorResponse('You cannot perform this status update'));
        }

        // Update the booking
        const updatedBooking = await Booking.updateStatus(bookingId, status, req.user.id);

        res.json(successResponse(updatedBooking, 'Booking status updated successfully'));

    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json(errorResponse('Failed to update booking status'));
    }
};

// Get booking statistics
const getBookingStatistics = async (req, res) => {
    try {
        const dateRange = parseInt(req.query.days) || 30;
        
        let barberId = null;
        let customerId = null;

        if (req.user.role === 'barber') {
            barberId = req.user.id;
        } else if (req.user.role === 'customer') {
            customerId = req.user.id;
        }

        const stats = await Booking.getStatistics(barberId, customerId, dateRange);

        res.json(successResponse(stats));

    } catch (error) {
        console.error('Get booking statistics error:', error);
        res.status(500).json(errorResponse('Failed to fetch statistics'));
    }
};

// Get upcoming appointments
const getUpcomingAppointments = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        
        let barberId = null;
        let customerId = null;

        if (req.user.role === 'barber') {
            barberId = req.user.id;
        } else if (req.user.role === 'customer') {
            customerId = req.user.id;
        }

        const appointments = await Booking.getUpcoming(barberId, customerId, days);

        res.json(successResponse(appointments));

    } catch (error) {
        console.error('Get upcoming appointments error:', error);
        res.status(500).json(errorResponse('Failed to fetch upcoming appointments'));
    }
};

// Cancel booking
const cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { reason } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json(errorResponse('Booking not found'));
        }

        // Check permissions
        if (req.user.role === 'customer' && booking.customer_id !== req.user.id) {
            return res.status(403).json(errorResponse('You can only cancel your own bookings'));
        }

        if (req.user.role === 'barber' && booking.barber_id !== req.user.id) {
            return res.status(403).json(errorResponse('You can only cancel your own bookings'));
        }

        // Check if booking can be cancelled
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json(errorResponse('This booking cannot be cancelled'));
        }

        // Update booking status to cancelled
        const updatedBooking = await Booking.updateStatus(bookingId, 'cancelled', req.user.id);

        res.json(successResponse(updatedBooking, 'Booking cancelled successfully'));

    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json(errorResponse('Failed to cancel booking'));
    }
};

module.exports = {
    createBooking,
    getBookingById,
    getMyBookings,
    updateBookingStatus,
    getBookingStatistics,
    getUpcomingAppointments,
    cancelBooking
};
