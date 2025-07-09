const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validation');

// All booking routes require authentication
router.use(authenticateToken);

// Create new booking (customers only)
router.post('/', validateBooking, bookingController.createBooking);

// Get my bookings (customer or barber)
router.get('/my-bookings', bookingController.getMyBookings);

// Get booking statistics (for dashboard)
router.get('/statistics', bookingController.getBookingStatistics);

// Get upcoming appointments
router.get('/upcoming', bookingController.getUpcomingAppointments);

// Get specific booking by ID
router.get('/:id', bookingController.getBookingById);

// Update booking status
router.patch('/:id/status', bookingController.updateBookingStatus);

// Cancel booking
router.delete('/:id', bookingController.cancelBooking);

module.exports = router;
