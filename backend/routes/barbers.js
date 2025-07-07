const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barberController');
const { authenticateToken, requireBarber, optionalAuth } = require('../middleware/auth');
const { validateBarberProfile, validateBarberUpdate } = require('../middleware/validation');

// Public routes
router.get('/', optionalAuth, barberController.getAllBarbers);
router.get('/search/location', barberController.searchByLocation);
router.get('/:id', barberController.getBarberById);
router.get('/:id/availability', barberController.getAvailability);

// Protected routes - barber only
router.get('/profile/me', authenticateToken, requireBarber, barberController.getMyProfile);
router.post('/profile', authenticateToken, requireBarber, validateBarberProfile, barberController.createProfile);
router.put('/profile', authenticateToken, requireBarber, validateBarberUpdate, barberController.updateProfile);

module.exports = router;
