// File: backend/routes/reviews.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

// Public routes (no auth required)
router.get('/barber/:barberId', reviewController.getBarberReviews);
router.get('/barber/:barberId/stats', reviewController.getBarberStats);

// Protected routes (auth required)
router.use(authenticateToken);

// Create new review (customers only)
router.post('/', reviewController.createReview);

// Get my reviews
router.get('/my-reviews', reviewController.getMyReviews);

// Check if booking can be reviewed
router.get('/can-review/:bookingId', reviewController.checkCanReview);

module.exports = router;
